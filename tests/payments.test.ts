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

import { decideAttempt } from "@/lib/payments/decide";
import { summarizeTxs } from "@/lib/payments/btc-chain";

describe("payment watcher decisions", () => {
  const base = { expectedAtomic: 1_000_000n, confirmationsNeeded: 2, expiresAtMs: 10_000, nowMs: 5_000, orderStatus: "pending" as const };
  const tx = (sats: bigint, confirmations: number, seenAtMs = 1_000) => ({ sats, confirmations, seenAtMs });

  it("waits for confirmations, then marks paid (exact and within 1% under)", () => {
    expect(decideAttempt({ ...base, txs: [tx(1_000_000n, 1)] }).action).toBe("none");
    expect(decideAttempt({ ...base, txs: [tx(1_000_000n, 2)] }).action).toBe("paid");
    expect(decideAttempt({ ...base, txs: [tx(990_000n, 2)] }).action).toBe("paid");
  });
  it("flags partial and overpaid payments", () => {
    expect(decideAttempt({ ...base, txs: [tx(500_000n, 2)] })).toMatchObject({ action: "partial", remainingAtomic: 500_000n });
    expect(decideAttempt({ ...base, txs: [tx(1_200_000n, 2)] })).toMatchObject({ action: "paid", overpaidAtomic: 200_000n });
  });
  it("two small transactions add up", () => {
    expect(decideAttempt({ ...base, txs: [tx(600_000n, 2), tx(400_000n, 2)] }).action).toBe("paid");
  });
  it("late payment goes to manual review, never auto-paid", () => {
    expect(decideAttempt({ ...base, nowMs: 20_000, orderStatus: "expired", txs: [tx(1_000_000n, 3, 15_000)] }).action).toBe("late");
    expect(decideAttempt({ ...base, nowMs: 20_000, orderStatus: "late_payment", txs: [tx(1_000_000n, 3, 15_000)] }).action).toBe("none");
  });
  it("expires an unpaid quote once, and is idempotent for finished orders", () => {
    expect(decideAttempt({ ...base, nowMs: 20_000, txs: [] }).action).toBe("expire");
    expect(decideAttempt({ ...base, nowMs: 20_000, orderStatus: "expired", txs: [] }).action).toBe("none");
    expect(decideAttempt({ ...base, orderStatus: "paid", txs: [tx(1_000_000n, 9)] }).action).toBe("none");
  });
  it("summarizes mempool transactions", () => {
    const txs = [
      { txid: "a", vout: [{ scriptpubkey_address: "tb1qme", value: 700 }, { scriptpubkey_address: "tb1qother", value: 5 }, { scriptpubkey_address: "tb1qme", value: 300 }], status: { confirmed: true, block_height: 100 } },
      { txid: "b", vout: [{ scriptpubkey_address: "tb1qme", value: 50 }], status: { confirmed: false } },
      { txid: "c", vout: [{ scriptpubkey_address: "tb1qnobody", value: 9 }], status: { confirmed: true, block_height: 99 } },
    ];
    expect(summarizeTxs("tb1qme", txs, 101)).toEqual([{ txid: "a", sats: 1000n, confirmations: 2 }, { txid: "b", sats: 50n, confirmations: 0 }]);
  });
});

import { matchPayments } from "@/lib/payments/match";
import { summarizeTransfers } from "@/lib/payments/tron-chain";
import { BTC_STEP } from "@/lib/payments/unique-amount";

describe("fixed address matching", () => {
  const T0 = 1_000_000_000_000;
  const A = { id: 1, expectedAtomic: 99_000_137n, expiresAtMs: T0 + 30 * 60_000 }; // quote created at T0
  const B = { id: 2, expectedAtomic: 99_000_412n, expiresAtMs: T0 + 40 * 60_000 };
  const tx = (id: string, sats: bigint, timeMs?: number) => ({ txid: id, sats, confirmations: 1, timeMs });

  it("matches by exact amount only", () => {
    const m = matchPayments([A, B], [tx("a", 99_000_137n, T0 + 60_000), tx("b", 99_000_412n, T0 + 11 * 60_000), tx("x", 99_000_000n, T0 + 80_000)], T0 + 12 * 60_000);
    expect(m.byAttempt.get(1)?.[0].txid).toBe("a");
    expect(m.byAttempt.get(2)?.[0].txid).toBe("b");
    expect(m.unmatched.map((t) => t.txid)).toEqual(["x"]);
  });
  it("never gives an old payment to a newer order with the same amount", () => {
    const m = matchPayments([A], [tx("old", 99_000_137n, T0 - 3_600_000)], T0 + 60_000);
    expect(m.byAttempt.size).toBe(0);
    expect(m.unmatched).toHaveLength(1);
  });
  it("ignores transfers older than 7 days", () => {
    expect(matchPayments([A], [tx("ancient", 5n, T0 - 8 * 24 * 3_600_000)], T0).unmatched).toHaveLength(0);
  });
  it("BTC unique amounts differ by whole satoshis", () => {
    const a = allocateUniqueAmount(147_762n, new Set([147_763n]), () => 0, BTC_STEP);
    expect(a).toBe(147_764n);
  });
  it("reads only USDT transfers sent to our address", () => {
    const rows = [
      { transaction_id: "1", to: "TMine", value: "99000137", block_timestamp: 5, token_info: { address: "TUSDT" } },
      { transaction_id: "2", to: "TOther", value: "5", block_timestamp: 5, token_info: { address: "TUSDT" } },
      { transaction_id: "3", to: "TMine", value: "7", block_timestamp: 5, token_info: { address: "TFAKE" } },
    ];
    expect(summarizeTransfers("TMine", "TUSDT", rows)).toEqual([{ txid: "1", sats: 99_000_137n, confirmations: 1, timeMs: 5 }]);
  });
});

import { isEvmAddress } from "@/lib/payments/evm-chain";
import { OPTIONS, optionForWallet } from "@/lib/payments/options";
import { validateWalletValue } from "@/lib/wallets/validate";

describe("EVM options", () => {
  it("maps wallet coin+network to an option", () => {
    expect(optionForWallet("USDC", "ERC20")?.id).toBe("USDC-ERC20");
    expect(optionForWallet("ETH", "sepolia")?.decimals).toBe(18);
    expect(optionForWallet("USDT", "nope")).toBeUndefined();
    expect(Object.keys(OPTIONS)).toHaveLength(5);
  });
  it("validates EVM addresses (lowercase ok, bad checksum rejected)", () => {
    expect(isEvmAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7")).toBe(true);
    expect(isEvmAddress("0xdac17f958d2ee523a2206206994597c13d831ec7")).toBe(true);
    expect(isEvmAddress("0xdAC17F958D2ee523a2206206994597C13D831ec8")).toBe(false);
    expect(isEvmAddress("0x123")).toBe(false);
  });
  it("wallet validation accepts EVM for ETH and rejects TRON addresses", () => {
    expect(validateWalletValue({ coin: "ETH", network: "ethereum" }, "0xdAC17F958D2ee523a2206206994597C13D831ec7")).toBeTruthy();
    expect(() => validateWalletValue({ coin: "USDC", network: "ERC20" }, "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")).toThrow();
  });
});

import { parseDeliveryUrl } from "@/lib/delivery/links";
import { deliveryEmailText } from "@/lib/delivery/deliver";

describe("delivery", () => {
  it("accepts only https links", () => {
    expect(parseDeliveryUrl(" https://drive.example.com/file/abc ")).toBe("https://drive.example.com/file/abc");
    expect(() => parseDeliveryUrl("http://x.com/a")).toThrow();
    expect(() => parseDeliveryUrl("javascript:alert(1)")).toThrow();
    expect(() => parseDeliveryUrl("not a url")).toThrow();
  });
  it("email carries link, policies and opt-out", () => {
    const t = deliveryEmailText({ orderId: "o1", packageName: "Starter", records: 10000, productName: "X List", url: "https://a.b/c" });
    for (const s of ["https://a.b/c", "/legal/refund-replacement", "/opt-out", "/legal/lawful-use", "10,000"]) expect(t).toContain(s);
  });
});
