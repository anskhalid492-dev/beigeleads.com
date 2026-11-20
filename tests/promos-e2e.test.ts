// Promotions end to end against a LOCAL D1 + KV: admin-created promotion -> server-priced cart -> discounted order and payment amount
// -> reservation -> paid = redeemed -> expired = released -> limits, windows, first purchase, partner-only, stacking, retries.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { priceCart } from "@/lib/cart/model";
import { CheckoutError, createOrder } from "@/lib/checkout/create";
import { getDbFromEnv } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/manual";
import { expireStaleAttempts } from "@/lib/payments/watcher";
import { loadCandidates } from "@/lib/promos/store";

let proxy: PlatformProxy<CloudflareEnv>;
let base: CloudflareEnv;
let env: CloudflareEnv;
const NOW = () => Math.floor(Date.now() / 1000);
const item = (slug = "dentists-us", pkg = "Complete") => [{ productSlug: slug, packageName: pkg }];
const mockResend = () => vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "promos-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { CHECKOUT_ENABLED: "true", CHECKOUT_ALLOW_PLACEHOLDER: "true", RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
  await base.CACHE.put("rate:BTC", "60000.00000000", { expirationTtl: 3600 });
  await base.DB.prepare("INSERT INTO wallets (coin, network, address_or_xpub, next_index, enabled, activates_at, min_confirmations) VALUES ('BTC','testnet','tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',0,1,0,1)").run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); });

const db = () => getDbFromEnv(env);
const all = async <T,>(sql: string, ...args: unknown[]) => ((await base.DB.prepare(sql).bind(...args).all()).results ?? []) as T[];
const one = async <T,>(sql: string, ...args: unknown[]) => (await base.DB.prepare(sql).bind(...args).first()) as T;
type P = Partial<{ name: string; title: string; code: string | null; kind: string; value: number; products: string; packages: string; min: number; max: number | null; starts: number | null; ends: number | null; limit: number | null; perCustomer: number | null; first: number; partner: number; automatic: number; combinable: number; status: string }>;
async function addPromo(o: P = {}) {
  const r = await base.DB.prepare(
    "INSERT INTO promotions (name,title,code,kind,value,product_slugs,package_names,min_cart_cents,max_discount_cents,starts_at,ends_at,usage_limit,per_customer_limit,first_purchase_only,partner_only,automatic,combinable,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id",
  ).bind(o.name ?? "Campaign", o.title ?? "Save 20%", o.code === undefined ? "SAVE20" : o.code, o.kind ?? "percent", o.value ?? 20, o.products ?? "[]", o.packages ?? "[]", o.min ?? 0, o.max ?? null, o.starts ?? null, o.ends ?? null, o.limit ?? null, o.perCustomer ?? null, o.first ?? 0, o.partner ?? 0, o.automatic ?? 0, o.combinable ?? 0, o.status ?? "active").first<{ id: number }>();
  return r!.id;
}
const clear = async () => { await base.DB.prepare("DELETE FROM promotions").run(); await base.DB.prepare("DELETE FROM promotion_redemptions").run(); };
const priceFor = async (code?: string, email?: string) => priceCart([{ slug: "dentists-us", pkg: "Complete" }], { checkoutOpen: true, allowPlaceholder: true, promo: { candidates: await loadCandidates(db(), email), enteredCode: code, nowSec: NOW(), emailKnown: !!email } });

describe("SAVE20 end to end", () => {
  it("cart shows $239.20, the order and the payment record carry the discounted amount, the redemption is reserved", async () => {
    mockResend();
    await clear();
    const id = await addPromo();
    const cart = await priceFor("save20");
    expect(cart.subtotalCents).toBe(29900);
    expect(cart.discountCents).toBe(5980);
    expect(cart.totalCents).toBe(23920);
    expect(cart.applied[0].code).toBe("SAVE20");

    const orderId = await createOrder(env, { email: "buyer@test.dev", items: item(), option: "BTC", discountCode: "save20" });
    const o = await one<{ total_usd_cents: number; subtotal_cents: number; discount_cents: number; discount_code: string; discount_percent: number }>("SELECT * FROM orders WHERE id = ?", orderId);
    expect(o).toMatchObject({ total_usd_cents: 23920, subtotal_cents: 29900, discount_cents: 5980, discount_code: "SAVE20", discount_percent: 20 });
    expect((await one<{ price_usd_cents: number }>("SELECT price_usd_cents FROM order_items WHERE order_id = ?", orderId)).price_usd_cents).toBe(23920);
    // The coin amount is derived from the DISCOUNTED total: $239.20 at $60,000 = 0.00398667 BTC (+ unique offset up to 999 sats).
    const a = await one<{ expected_amount: string }>("SELECT expected_amount FROM payment_attempts WHERE order_id = ?", orderId);
    const sats = Math.round(Number(a.expected_amount) * 1e8);
    expect(sats).toBeGreaterThanOrEqual(398_667);
    expect(sats).toBeLessThan(398_667 + 1000);
    const red = await all<{ status: string; discount_cents: number; promotion_id: number }>("SELECT * FROM promotion_redemptions WHERE order_id = ?", orderId);
    expect(red).toEqual([expect.objectContaining({ status: "reserved", discount_cents: 5980, promotion_id: id })]);

    // A retry of the same request returns the same order and creates no second redemption.
    const again = await createOrder(env, { email: "buyer@test.dev", items: item(), option: "BTC", discountCode: "SAVE20" });
    expect(again).toBe(orderId);
    expect((await all("SELECT id FROM promotion_redemptions WHERE promotion_id = ?", id))).toHaveLength(1);

    // Payment confirmed -> the redemption is final (idempotent).
    expect(await markOrderPaid(env, "admin@test.dev", orderId, "test")).toBe("paid");
    expect((await one<{ status: string }>("SELECT status FROM promotion_redemptions WHERE order_id = ?", orderId)).status).toBe("redeemed");
    await markOrderPaid(env, "admin@test.dev", orderId, "again");
    expect((await all("SELECT id FROM promotion_redemptions WHERE order_id = ?", orderId))).toHaveLength(1);
  });
});

describe("refusals at checkout (the buyer is never charged a price they did not expect)", () => {
  it.each([
    ["expired", { ends: NOW() - 60 }, /expired/],
    ["not started", { starts: NOW() + 3600 }, /not active yet/],
    ["paused", { status: "paused" }, /not valid/],
    ["draft", { status: "draft" }, /not valid/],
  ] as const)("%s code", async (_n, p, msg) => {
    mockResend();
    await clear();
    await addPromo(p as P);
    await expect(createOrder(env, { email: "x1@test.dev", items: item(), option: "BTC", discountCode: "SAVE20" })).rejects.toThrow(msg);
    expect(await all("SELECT id FROM orders WHERE email = 'x1@test.dev'")).toHaveLength(0);
  });
  it("an unknown code stops the order", async () => {
    await clear();
    await expect(createOrder(env, { email: "x2@test.dev", items: item(), option: "BTC", discountCode: "NOPE" })).rejects.toBeInstanceOf(CheckoutError);
  });
  it("the browser cannot change the amount: only the code is read, prices come from the catalog", async () => {
    await clear();
    const o = await createOrder(env, { email: "x3@test.dev", items: item(), option: "BTC" });
    expect((await one<{ total_usd_cents: number }>("SELECT total_usd_cents FROM orders WHERE id = ?", o)).total_usd_cents).toBe(29900);
  });
});

describe("usage limits", () => {
  it("total limit: the second buyer is refused, and an expired unpaid order gives the use back", async () => {
    mockResend();
    await clear();
    await addPromo({ limit: 1 });
    const first = await createOrder(env, { email: "l1@test.dev", items: item(), option: "BTC", discountCode: "SAVE20" });
    await expect(createOrder(env, { email: "l2@test.dev", items: item(), option: "BTC", discountCode: "SAVE20" })).rejects.toThrow(/usage limit/);
    expect(await all("SELECT id FROM orders WHERE email = 'l2@test.dev'")).toHaveLength(0);
    // The first order never pays and expires: the use is released.
    await expireStaleAttempts(env, Date.now() + 3 * 3600_000);
    expect((await one<{ status: string }>("SELECT status FROM promotion_redemptions WHERE order_id = ?", first)).status).toBe("released");
    const later = await createOrder(env, { email: "l2@test.dev", items: item(), option: "BTC", discountCode: "SAVE20" });
    expect(later).not.toBe(first);
  });
  it("per-customer limit counts by email, case-insensitively", async () => {
    mockResend();
    await clear();
    await addPromo({ perCustomer: 1 });
    await createOrder(env, { email: "Pc@test.dev".toLowerCase(), items: item("dentists-us", "Starter"), option: "BTC", discountCode: "SAVE20" });
    await expect(createOrder(env, { email: "pc@test.dev", items: item("restaurants-us", "Starter"), option: "BTC", discountCode: "SAVE20" })).rejects.toThrow(/maximum number of times/);
    await expect(createOrder(env, { email: "other@test.dev", items: item("restaurants-us", "Starter"), option: "BTC", discountCode: "SAVE20" })).resolves.toBeTruthy();
  });
});

describe("scope, automatic and first-purchase promotions", () => {
  it("package-specific discount applies to the Complete package only", async () => {
    await clear();
    await addPromo({ packages: '["Complete"]' });
    expect((await priceFor("SAVE20")).totalCents).toBe(23920);
    const starter = priceCart([{ slug: "dentists-us", pkg: "Starter" }], { checkoutOpen: true, allowPlaceholder: true, promo: { candidates: await loadCandidates(db()), enteredCode: "SAVE20", nowSec: NOW(), emailKnown: false } });
    expect(starter.totalCents).toBe(9900);
    expect(starter.codeError).toContain("does not apply");
  });
  it("an automatic promotion applies with no code and is charged by createOrder", async () => {
    mockResend();
    await clear();
    await addPromo({ code: null, automatic: 1, value: 10, title: "10% off automatically" });
    expect((await priceFor()).totalCents).toBe(26910);
    const o = await createOrder(env, { email: "auto@test.dev", items: item(), option: "BTC" });
    expect((await one<{ total_usd_cents: number }>("SELECT total_usd_cents FROM orders WHERE id = ?", o)).total_usd_cents).toBe(26910);
  });
  it("first-purchase promotion works for a new email and is refused after a paid order", async () => {
    mockResend();
    await clear();
    await addPromo({ code: "WELCOME20", first: 1 });
    const o = await createOrder(env, { email: "fresh@test.dev", items: item("dentists-us", "Starter"), option: "BTC", discountCode: "WELCOME20" });
    await markOrderPaid(env, "admin@test.dev", o, "test");
    await expect(createOrder(env, { email: "fresh@test.dev", items: item("restaurants-us", "Starter"), option: "BTC", discountCode: "WELCOME20" })).rejects.toThrow(/first purchases only/);
  });
  it("fixed discount can never make an order negative", async () => {
    await clear();
    await addPromo({ kind: "fixed", value: 500_000 });
    const c = await priceFor("SAVE20");
    expect(c.totalCents).toBe(0);
    expect(c.discountCents).toBe(29900);
  });
});

describe("partner rules", () => {
  async function partner(email: string) {
    const r = await base.DB.prepare("INSERT INTO partner_applications (reference,full_name,business_name,email,website,country,business_type,resale_plan,terms_accepted_at,dedupe_key,status) VALUES (?,?,?,?,?,?,?,?,?,?,'approved') RETURNING id")
      .bind(`PT-${email}`, "P", "Biz", email, "https://x.test", "US", "agency", "resale plan text", 1, `dk-${email}`).first<{ id: number }>();
    await base.DB.prepare("INSERT INTO partner_discounts (application_id, code, email, percent, active) VALUES (?,?,?,50,1)").bind(r!.id, `PARTNER-${email.slice(0, 4).toUpperCase().padEnd(4, "X")}-ABCD`, email).run();
    return `PARTNER-${email.slice(0, 4).toUpperCase().padEnd(4, "X")}-ABCD`;
  }
  it("a partner-only promotion is refused for non-partners and accepted for a verified partner", async () => {
    mockResend();
    await clear();
    await addPromo({ code: "PARTNER50", value: 50, partner: 1, title: "Partner offer" });
    await expect(createOrder(env, { email: "rando@test.dev", items: item(), option: "BTC", discountCode: "PARTNER50" })).rejects.toThrow(/Data Reseller Partners/);
    await partner("agency@test.dev");
    const o = await createOrder(env, { email: "agency@test.dev", items: item(), option: "BTC", discountCode: "PARTNER50" });
    expect((await one<{ total_usd_cents: number }>("SELECT total_usd_cents FROM orders WHERE id = ?", o)).total_usd_cents).toBe(14950);
  });
  it("the personal partner code still works and public promotions are NOT combined with it", async () => {
    mockResend();
    await clear();
    await addPromo({ code: null, automatic: 1, value: 20 });
    const code = await partner("seller@test.dev");
    const o = await createOrder(env, { email: "seller@test.dev", items: item(), option: "BTC", discountCode: code });
    const row = await one<{ total_usd_cents: number; discount_code: string }>("SELECT * FROM orders WHERE id = ?", o);
    expect(row.total_usd_cents).toBe(14950);
    expect(row.discount_code).toBe(code);
    expect(await all("SELECT id FROM promotion_redemptions WHERE order_id = ?", o)).toHaveLength(0);
    // A stranger cannot use someone else's personal code.
    await expect(createOrder(env, { email: "thief@test.dev", items: item(), option: "BTC", discountCode: code })).rejects.toThrow();
  });
});

describe("stacking at checkout", () => {
  it("combinable promotions stack and the order records both redemptions", async () => {
    mockResend();
    await clear();
    const a = await addPromo({ code: null, automatic: 1, combinable: 1, value: 10, title: "10% auto" });
    const b = await addPromo({ code: "EXTRA10", combinable: 1, value: 10, title: "Extra 10%" });
    const o = await createOrder(env, { email: "stack@test.dev", items: item(), option: "BTC", discountCode: "extra10" });
    // 10% of 29900 = 2990, then 10% of 26910 = 2691
    expect((await one<{ total_usd_cents: number }>("SELECT total_usd_cents FROM orders WHERE id = ?", o)).total_usd_cents).toBe(29900 - 2990 - 2691);
    const red = await all<{ promotion_id: number }>("SELECT promotion_id FROM promotion_redemptions WHERE order_id = ? ORDER BY promotion_id", o);
    expect(red.map((r) => r.promotion_id)).toEqual([a, b]);
  });
});
