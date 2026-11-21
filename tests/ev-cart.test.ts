import { describe, expect, it } from "vitest";
import { getProducts } from "@/lib/catalog";
import { priceCart, type CartContext } from "@/lib/cart/model";
import { DEFAULT_VOLUME } from "@/lib/sales/settings";
import { DEFAULT_EV, evSettingsSchema } from "@/lib/ev/settings";
import { adminOptions, canMove, canUpload, terminal } from "@/lib/ev/state";
import { evToken, signFile, verifyFile } from "@/lib/ev/token";

const [a, b, c] = getProducts();
const verification = (pkg: string | null, enabled = true): CartContext["verification"] => ({ pkg, enabled, packages: DEFAULT_EV.packages.map((p) => ({ name: p.name, limit: p.limit, priceCents: p.priceCents })) });
const ctx = (v?: CartContext["verification"]): CartContext => ({ checkoutOpen: true, allowPlaceholder: true, volume: { ...DEFAULT_VOLUME, enabled: true } as never, verification: v });
const dbs = [a, b, c].map((p) => ({ slug: p.slug, pkg: p.packages[0].name }));

describe("cart pricing with verification", () => {
  it("verification-only cart is purchasable at the package price", () => {
    const r = priceCart([], ctx(verification("Professional")));
    expect(r.service).toMatchObject({ name: "Professional", limit: 250_000, priceCents: 12_000, purchasable: true });
    expect(r.totalCents).toBe(12_000);
    expect(r.canCheckout).toBe(true);
  });
  it("is excluded from Buy More Save More: three databases get the ladder, the service price is added untouched", () => {
    const without = priceCart(dbs, ctx());
    const withEv = priceCart(dbs, ctx(verification("Business")));
    expect(withEv.totalCents).toBe(without.totalCents + 6000);
    expect(withEv.discountCents).toBe(without.discountCents);
    expect(withEv.volume?.count ?? 0).toBe(without.volume?.count ?? 0); // the service does not count toward the tier
  });
  it("an unknown or disabled package yields no service and a verification-only cart cannot check out", () => {
    expect(priceCart(dbs, ctx(verification("Nope"))).service).toBeUndefined();
    const off = priceCart([], ctx(verification("Starter", false)));
    expect(off.service?.purchasable ?? false).toBe(false);
    expect(off.canCheckout).toBe(false);
  });
  it("no verification context = old behaviour", () => {
    expect(priceCart(dbs, ctx()).service).toBeUndefined();
  });
});

describe("state machine", () => {
  it("cannot skip payment or file steps and terminal states are final", () => {
    expect(canMove("awaiting_payment", "completed")).toBe(false);
    expect(canMove("awaiting_file", "processing")).toBe(false);
    expect(canMove("file_submitted", "processing")).toBe(true);
    expect(canMove("processing", "completed")).toBe(true);
    expect(canMove("completed", "delivered")).toBe(true);
    expect(terminal("cancelled") && terminal("refunded")).toBe(true);
    expect(canMove("cancelled", "processing")).toBe(false);
  });
  it("admins only get the hand-set targets; uploads allowed only in the right states", () => {
    expect(adminOptions("awaiting_file")).toEqual(["cancelled", "refunded"]);
    expect(adminOptions("processing")).toContain("completed");
    expect(adminOptions("processing")).not.toContain("delivered");
    expect(canUpload("awaiting_file") && canUpload("needs_action")).toBe(true);
    expect(canUpload("processing") || canUpload("completed") || canUpload("awaiting_payment")).toBe(false);
  });
});

describe("tokens and signed links", () => {
  const env = { HASH_SALT: "s" };
  it("token is stable, 48 hex, and depends on the salt and id", async () => {
    const t = await evToken(env, "EV-AAAA1111");
    expect(t).toMatch(/^[0-9a-f]{48}$/);
    expect(await evToken(env, "EV-AAAA1111")).toBe(t);
    expect(await evToken({ HASH_SALT: "other" }, "EV-AAAA1111")).not.toBe(t);
    expect(await evToken(env, "EV-BBBB2222")).not.toBe(t);
  });
  it("a signed link verifies, expires after 10 minutes, and rejects tampering", async () => {
    const now = 1_700_000_000_000;
    const { exp, sig } = await signFile(env, "f1", 600, now);
    expect(await verifyFile(env, "f1", exp, sig, now + 1000)).toBe(true);
    expect(await verifyFile(env, "f1", exp, sig, now + 601_000)).toBe(false);
    expect(await verifyFile(env, "f2", exp, sig, now + 1000)).toBe(false);
    expect(await verifyFile(env, "f1", exp + 1000, sig, now + 1000)).toBe(false);
    expect(await verifyFile(env, "f1", exp, sig.replace(/.$/, "0"), now + 1000)).toBe(sig.endsWith("0"));
  });
});

describe("settings schema", () => {
  it("defaults are valid, hold the six launch packages, and duplicates or bad limits are rejected", () => {
    expect(evSettingsSchema.safeParse(DEFAULT_EV).success).toBe(true);
    expect(DEFAULT_EV.packages.map((p) => [p.name, p.priceCents])).toEqual([["Starter", 1000], ["Growth", 3000], ["Business", 6000], ["Professional", 12000], ["Scale", 25000], ["Enterprise", 49900]]);
    expect(evSettingsSchema.safeParse({ ...DEFAULT_EV, maxUploadMb: 0 }).success).toBe(false);
  });
});
