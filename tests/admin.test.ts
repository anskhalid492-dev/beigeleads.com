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

import { hashPassword, verifyPassword, verifyTotp, totp, base32Encode } from "@/lib/admin/crypto";
import { createSessionValue, readSessionValue } from "@/lib/admin/session";

describe("admin login primitives", () => {
  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("correct horse battery staple", 1000);
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("x", undefined)).toBe(false);
  });
  it("matches the RFC 6238 test vector and allows one step of drift", async () => {
    const secret = base32Encode(new TextEncoder().encode("12345678901234567890"));
    expect((await totp(secret, 59_000)).endsWith("287082")).toBe(true);
    expect(await verifyTotp(secret, "287082", 59_000 + 30_000)).toBe(true);
    expect(await verifyTotp(secret, "287082", 59_000 + 120_000)).toBe(false);
    expect(await verifyTotp(secret, "abc")).toBe(false);
  });
  it("signs, expires and rejects tampered sessions", async () => {
    const v = await createSessionValue("s".repeat(32), "a@b.co", 1_000_000);
    expect(await readSessionValue("s".repeat(32), v, 1_000_000)).toBe("a@b.co");
    expect(await readSessionValue("s".repeat(32), v, 1_000_000 + 16 * 60_000)).toBeNull();
    expect(await readSessionValue("t".repeat(32), v, 1_000_000)).toBeNull();
    expect(await readSessionValue("s".repeat(32), v.replace("a%40", "x%40"), 1_000_000)).toBeNull();
  });
});
