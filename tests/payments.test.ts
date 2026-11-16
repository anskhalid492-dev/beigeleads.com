import { describe, expect, it } from "vitest";
import { COINS, buildQuote, formatAtomic, parseAtomic, usdCentsToAtomic, QUOTE_LOCK_MS } from "@/lib/payments/amounts";
import { allocateUniqueAmount } from "@/lib/payments/unique-amount";
import { deriveBtcAddress, detectKind } from "@/lib/payments/derive";
import { aggregate, assertStablecoinPeg, fetchUsdPrice } from "@/lib/payments/rates";
import { canTransition, classifyPayment, confirmationsNeeded, transition } from "@/lib/payments/state";

describe("amounts", () => {
  it("converts USD cents to BTC satoshi, rounding up", () => {
    // $100 at $50,000/BTC = 0.002 BTC = 200000 sat
    expect(usdCentsToAtomic(10_000, "50000", 8)).toBe(200_000n);
    // $1 at $67,123.45 = 1489.7... sat, rounded UP to 1490
    expect(usdCentsToAtomic(100, "67123.45", 8)).toBe(1490n);
  });
  it("USDT at $1", () => {
    expect(usdCentsToAtomic(4900, "1", 6)).toBe(49_000_000n);
  });
  it("formats and parses without floats", () => {
    expect(formatAtomic(200_000n, 8)).toBe("0.00200000");
    expect(formatAtomic(49_013_700n, 6)).toBe("49.013700");
    expect(parseAtomic("49.0137", 6)).toBe(49_013_700n);
    expect(() => parseAtomic("1.1234567", 6)).toThrow();
    expect(() => parseAtomic("-1", 6)).toThrow();
  });
  it("rejects bad input", () => {
    expect(() => usdCentsToAtomic(0, "1", 6)).toThrow();
    expect(() => usdCentsToAtomic(100, "abc", 6)).toThrow();
    expect(() => usdCentsToAtomic(100, "0", 6)).toThrow();
    expect(() => usdCentsToAtomic(1.5, "1", 6)).toThrow();
  });
  it("locks a quote for 30 minutes", () => {
    const q = buildQuote(COINS.BTC, 10_000, "50000", 1_000);
    expect(q.expiresAt).toBe(1_000 + QUOTE_LOCK_MS);
    expect(q.amount).toBe("0.00200000");
  });
});

describe("unique amount (TRC20)", () => {
  it("adds a 4-decimal offset like 49.0137", () => {
    const a = allocateUniqueAmount(49_000_000n, new Set(), () => 0.137);
    expect(formatAtomic(a, 6)).toBe("49.013700");
  });
  it("never reuses an open amount", () => {
    const taken = new Set<bigint>();
    for (let i = 0; i < 999; i++) {
      const a = allocateUniqueAmount(10_000_000n, taken, () => 0.5);
      expect(taken.has(a)).toBe(false);
      taken.add(a);
    }
    expect(taken.size).toBe(999);
    expect(() => allocateUniqueAmount(10_000_000n, taken)).toThrow(/no unique amount/);
  });
  it("rounds an odd base up to 4 decimals first", () => {
    const a = allocateUniqueAmount(49_000_001n, new Set(), () => 0);
    expect(a).toBe(49_000_100n + 100n);
  });
});

describe("BTC address derivation", () => {
  const ZPUB = "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs";
  it("matches the BIP84 test vectors", () => {
    expect(deriveBtcAddress(ZPUB, 0)).toBe("bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu");
    expect(deriveBtcAddress(ZPUB, 1)).toBe("bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g");
  });
  it("rejects private keys and unsupported keys", () => {
    expect(() => detectKind("zprvAWgYBBk7JR8Gjrh4UJQ2uJdG1r3WNRRfURiABBE3RvMXYSrRJL62XuezvGdPvG6GFBZduosCc1YP5wixPox7zhZLfiUm8aunE96BBa4Kei5")).toThrow(/private/);
    expect(() => detectKind("xprv9s21ZrQH143K")).toThrow(/private/);
    expect(() => detectKind("xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz")).toThrow(/unsupported/);
  });
  it("rejects bad indexes", () => {
    expect(() => deriveBtcAddress(ZPUB, -1)).toThrow();
    expect(() => deriveBtcAddress(ZPUB, 1.5)).toThrow();
  });
});

describe("rates", () => {
  const ok = (v: number) => ({ name: "x", fetch: async () => v });
  const bad = { name: "bad", fetch: async () => { throw new Error("down"); } };
  it("uses the median when sources agree", () => {
    expect(aggregate([100, 101, 100.5])).toBe(100.5);
  });
  it("blocks when sources disagree", () => {
    expect(() => aggregate([100, 110])).toThrow(/disagree/);
  });
  it("blocks with fewer than 2 sources", async () => {
    await expect(fetchUsdPrice("BTC", [ok(100), bad])).rejects.toThrow(/not enough/);
  });
  it("survives one failing source", async () => {
    await expect(fetchUsdPrice("BTC", [ok(100), ok(100.2), bad])).resolves.toBeCloseTo(100.1);
  });
  it("blocks stablecoin depeg beyond 2%", async () => {
    expect(() => assertStablecoinPeg(1.019)).not.toThrow();
    expect(() => assertStablecoinPeg(0.97)).toThrow(/depeg/);
    await expect(fetchUsdPrice("USDT", [ok(0.96), ok(0.96)])).rejects.toThrow(/depeg/);
  });
});

describe("payment classification", () => {
  const base = { expectedAtomic: 1_000_000n, confirmations: 6, confirmationsNeeded: 2, seenAtMs: 10, expiresAtMs: 100 };
  it("exact payment is paid", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 1_000_000n })).toEqual({ kind: "paid", overpaidAtomic: 0n });
  });
  it("accepts underpayment within 1%", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 990_000n }).kind).toBe("paid");
  });
  it("beyond 1% under is partial with the remaining amount", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 900_000n })).toEqual({ kind: "partial", remainingAtomic: 100_000n });
  });
  it("overpayment beyond 1% is paid but flagged", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 1_200_000n })).toEqual({ kind: "paid", overpaidAtomic: 200_000n });
    expect(classifyPayment({ ...base, receivedAtomic: 1_005_000n })).toEqual({ kind: "paid", overpaidAtomic: 0n });
  });
  it("payment seen after expiry is a late payment", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 1_000_000n, seenAtMs: 101 }).kind).toBe("late_payment");
  });
  it("waits for confirmations", () => {
    expect(classifyPayment({ ...base, receivedAtomic: 1_000_000n, confirmations: 1 }).kind).toBe("waiting_confirmations");
  });
});

describe("order state machine", () => {
  it("allows the normal flow and is idempotent", () => {
    expect(transition("pending", "paid")).toEqual({ changed: true, status: "paid" });
    expect(transition("paid", "paid")).toEqual({ changed: false, status: "paid" });
  });
  it("blocks illegal moves", () => {
    expect(canTransition("paid", "pending")).toBe(false);
    expect(() => transition("refunded", "paid")).toThrow();
    expect(() => transition("expired", "paid")).toThrow(); // must go through late_payment + admin
  });
  it("late payments need a manual decision", () => {
    expect(canTransition("expired", "late_payment")).toBe(true);
    expect(canTransition("late_payment", "paid")).toBe(true);
  });
});

describe("confirmations", () => {
  it("BTC 2, or 3 for $1,000+; TRC20 final; wallet can only raise", () => {
    expect(confirmationsNeeded("BTC", "bitcoin", 5_000, 1)).toBe(2);
    expect(confirmationsNeeded("BTC", "bitcoin", 100_000, 1)).toBe(3);
    expect(confirmationsNeeded("USDT", "tron", 5_000, 1)).toBe(1);
    expect(confirmationsNeeded("BTC", "bitcoin", 5_000, 6)).toBe(6);
  });
});
