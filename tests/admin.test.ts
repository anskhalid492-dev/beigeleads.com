import { describe, expect, it } from "vitest";
import { validateWalletValue } from "@/lib/wallets/validate";
import { verifyAccessJwt } from "@/lib/admin/access";

describe("wallet validation", () => {
  it("rejects private keys and bad values", () => {
    expect(() => validateWalletValue({ coin: "BTC", network: "mainnet" }, "zprvAWgYBBk7JR8Gj")).toThrow(/private/);
    expect(() => validateWalletValue({ coin: "BTC", network: "mainnet" }, "xpub661MyMwAqRbcF")).toThrow();
    expect(() => validateWalletValue({ coin: "USDT", network: "TRC20" }, "TNotAnAddress")).toThrow();
    expect(() => validateWalletValue({ coin: "USDT", network: "TRC20" }, "")).toThrow();
  });
  it("accepts a valid TRON address", () => {
    expect(validateWalletValue({ coin: "USDT", network: "TRC20" }, "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7")).toContain("TLa2f6");
  });
});

describe("access jwt", () => {
  it("returns null for missing config or token", async () => {
    expect(await verifyAccessJwt(null, { domain: "a.cloudflareaccess.com", aud: "x" })).toBeNull();
    expect(await verifyAccessJwt("a.b.c", {})).toBeNull();
    expect(await verifyAccessJwt("garbage", { domain: "a", aud: "x" })).toBeNull();
  });
});
