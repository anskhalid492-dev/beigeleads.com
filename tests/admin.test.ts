import { describe, expect, it } from "vitest";
import { validateWalletValue } from "@/lib/wallets/validate";
import { verifyAccessJwt } from "@/lib/admin/access";

describe("wallet validation", () => {
  const btc = { coin: "BTC", network: "mainnet" } as const;
  it("rejects keys, seed phrases and bad addresses", () => {
    expect(() => validateWalletValue(btc, "zprvAWgYBBk7JR8GjABCDEFGHIJKLMNOPQRSTUV")).toThrow(/ADDRESS/);
    expect(() => validateWalletValue(btc, "zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs")).toThrow();
    expect(() => validateWalletValue(btc, "abandon ability able about above absent")).toThrow();
    expect(() => validateWalletValue(btc, "bc1qnotanaddress")).toThrow(/valid Bitcoin/);
    expect(() => validateWalletValue({ coin: "USDT", network: "TRC20" }, "TNotAnAddress")).toThrow();
    expect(() => validateWalletValue({ coin: "USDT", network: "TRC20" }, "")).toThrow();
  });
  it("accepts real public addresses on the right network only", () => {
    expect(validateWalletValue(btc, "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toContain("bc1q");
    expect(validateWalletValue(btc, "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2")).toContain("1Bv");
    expect(validateWalletValue(btc, "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy")).toContain("3J9");
    expect(() => validateWalletValue({ coin: "BTC", network: "testnet" }, "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toThrow();
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
    expect(await readSessionValue("s".repeat(32), v, 1_000_000 + 13 * 3600_000)).toBeNull();
    expect(await readSessionValue("t".repeat(32), v, 1_000_000)).toBeNull();
    expect(await readSessionValue("s".repeat(32), v.replace(".6", ".7"), 1_000_000)).toBeNull();
  });
});
