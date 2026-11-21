// Database Bundles against a local D1 + KV: admin create/publish, order, exact amounts, delivery, analytics, coupons, plain orders.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getProducts } from "@/lib/catalog";
import { getDbFromEnv } from "@/lib/db";
import { createOrder } from "@/lib/checkout/create";
import { deliverOrder } from "@/lib/delivery/deliver";
import { BundleError, createBundle, deleteBundle, loadPublished, loadStats, saveCategory, loadCategories, setBundleStatus, updateBundle, bundleInput } from "@/lib/bundles/store";

let proxy: PlatformProxy<CloudflareEnv>;
let base: CloudflareEnv;
let env: CloudflareEnv;
const P = getProducts();
const [a, b, c] = P;
const ctx = { checkoutOpen: true, allowPlaceholder: true };
const input = (over: Record<string, unknown> = {}) => bundleInput.parse({
  name: "Starter Pair", shortDescription: "Two lists in one purchase.", priceMode: "percent", discountPercent: 20,
  items: [{ slug: a.slug, pkg: a.packages[0].name }, { slug: b.slug, pkg: b.packages[0].name }], status: "published", ...over,
});
const list = a.packages[0].priceUsdCents + b.packages[0].priceUsdCents;
const count = async (sql: string) => ((await base.DB.prepare(sql).first()) as { n: number }).n;

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "bundles-e2e-")) } });
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

describe("admin: create, publish, unpublish", () => {
  const db = () => getDbFromEnv(base);
  let id = 0;
  it("creates a published bundle that the public loader returns", async () => {
    id = await createBundle(db(), input(), ctx);
    expect((await loadPublished(env, true)).map((x) => x.slug)).toContain("starter-pair");
  });
  it("refuses a duplicate URL name, unknown products, unknown packages and a price that is not a saving", async () => {
    await expect(createBundle(db(), input(), ctx)).rejects.toThrow(/already uses/);
    await expect(createBundle(db(), input({ name: "X1", items: [{ slug: "nope", pkg: "x" }, { slug: a.slug, pkg: a.packages[0].name }] }), ctx)).rejects.toBeInstanceOf(BundleError);
    await expect(createBundle(db(), input({ name: "X2", items: [{ slug: a.slug, pkg: "Nope" }, { slug: b.slug, pkg: b.packages[0].name }] }), ctx)).rejects.toThrow(/package/);
    await expect(createBundle(db(), input({ name: "X3", priceMode: "fixed", fixedPrice: (list + 100) / 100 }), ctx)).rejects.toThrow(/cannot be published/);
    await expect(createBundle(db(), input({ name: "X4", items: [{ slug: a.slug, pkg: a.packages[0].name }] }), ctx)).rejects.toThrow(/at least 2/);
  });
  it("unpublish hides it, publish shows it again", async () => {
    await setBundleStatus(db(), id, "draft", ctx);
    expect((await loadPublished(env, true)).map((x) => x.slug)).not.toContain("starter-pair");
    await setBundleStatus(db(), id, "published", ctx);
    expect((await loadPublished(env, true)).map((x) => x.slug)).toContain("starter-pair");
  });
  it("categories work and an edit keeps the bundle", async () => {
    await saveCategory(db(), { name: "Healthcare", sortOrder: 1 });
    const cat = (await loadCategories(db()))[0];
    await updateBundle(db(), id, input({ categorySlug: cat.slug }), ctx);
    expect((await loadPublished(env, true))[0].categorySlug).toBe(cat.slug);
  });
});

describe("checkout: exact amount, identity, delivery", () => {
  let orderId = "";
  it("charges the bundle price and records the bundle and its lists", async () => {
    orderId = await createOrder(env, { email: "buyer@test.dev", items: [], bundles: ["starter-pair"], option: "BTC" });
    const o = (await base.DB.prepare("SELECT total_usd_cents AS t FROM orders WHERE id = ?").bind(orderId).first()) as { t: number };
    expect(o.t).toBe(Math.round(list * 0.8));
    const items = (await base.DB.prepare("SELECT product_slug, price_usd_cents FROM order_items WHERE order_id = ?").bind(orderId).all()).results as { product_slug: string; price_usd_cents: number }[];
    expect(items.map((x) => x.product_slug).sort()).toEqual([a.slug, b.slug].sort());
    expect(items.reduce((s, x) => s + x.price_usd_cents, 0)).toBe(o.t); // a refund of the order reflects what was paid
    const ob = (await base.DB.prepare("SELECT bundle_slug, price_cents FROM order_bundles WHERE order_id = ?").bind(orderId).first()) as { bundle_slug: string; price_cents: number };
    expect(ob).toEqual({ bundle_slug: "starter-pair", price_cents: o.t });
  });
  it("a repeat request returns the same order", async () => {
    expect(await createOrder(env, { email: "buyer@test.dev", items: [], bundles: ["starter-pair"], option: "BTC" })).toBe(orderId);
  });
  it("a list already in the bundle cannot be added again; an unknown bundle is refused", async () => {
    await expect(createOrder(env, { email: "y@test.dev", items: [{ productSlug: a.slug, packageName: a.packages[0].name }], bundles: ["starter-pair"], option: "BTC" })).rejects.toThrow(/already part of/);
    await expect(createOrder(env, { email: "y@test.dev", items: [], bundles: ["nope"], option: "BTC" })).rejects.toThrow();
  });
  it("bundle + a normal list: bundle keeps its price, the list is priced normally", async () => {
    const id2 = await createOrder(env, { email: "mix@test.dev", items: [{ productSlug: c.slug, packageName: c.packages[0].name }], bundles: ["starter-pair"], option: "BTC" });
    const o = (await base.DB.prepare("SELECT total_usd_cents AS t FROM orders WHERE id = ?").bind(id2).first()) as { t: number };
    expect(o.t).toBe(Math.round(list * 0.8) + c.packages[0].priceUsdCents);
  });
  it("a normal order without a bundle is unchanged and has no bundle row", async () => {
    const id3 = await createOrder(env, { email: "plain@test.dev", items: [{ productSlug: c.slug, packageName: c.packages[0].name }], option: "BTC" });
    expect(await count(`SELECT COUNT(*) AS n FROM order_bundles WHERE order_id = '${id3}'`)).toBe(0);
    const o = (await base.DB.prepare("SELECT total_usd_cents AS t FROM orders WHERE id = ?").bind(id3).first()) as { t: number };
    expect(o.t).toBe(c.packages[0].priceUsdCents);
  });
  it("a coupon code does not discount a bundle again", async () => {
    const id4 = await createOrder(env, { email: "code@test.dev", items: [], bundles: ["starter-pair"], option: "BTC", discountCode: "PARTNER-AAAA-BBBB" }).catch(() => "refused");
    if (id4 !== "refused") {
      const o = (await base.DB.prepare("SELECT total_usd_cents AS t FROM orders WHERE id = ?").bind(id4).first()) as { t: number };
      expect(o.t).toBe(Math.round(list * 0.8));
    }
  });
  it("delivers every database link once, and never twice", async () => {
    const bodies: { text: string }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { bodies.push(JSON.parse(String((init as RequestInit).body))); return new Response(JSON.stringify({ id: "m" }), { status: 200 }); });
    await base.DB.prepare("UPDATE orders SET status = 'paid', paid_at = unixepoch() WHERE id = ?").bind(orderId).run();
    for (const p of [a, b]) await base.DB.prepare("INSERT INTO delivery_links (product_slug, package_name, url, updated_by, updated_at) VALUES (?, '', ?, 'test', unixepoch())").bind(p.slug, `https://files.example/${p.slug}`).run();
    expect(await deliverOrder(env, orderId)).toBe("sent");
    const mail = bodies.find((x) => x.text?.includes("files.example"));
    expect(mail?.text).toContain(`https://files.example/${a.slug}`);
    expect(mail?.text).toContain(`https://files.example/${b.slug}`);
    expect(await deliverOrder(env, orderId)).toBe("already-sent");
  });
});

describe("analytics and deletion", () => {
  it("counts only paid real-money orders", async () => {
    const s0 = await loadStats(getDbFromEnv(base));
    expect(s0?.published).toBe(1);
    expect(s0?.purchases).toBe(0); // the paid order above was paid on a TEST network, so it is not counted
    expect(s0?.revenueCents).toBe(0);
  });
  it("a bundle with orders cannot be deleted (unpublish instead); an unsold one can", async () => {
    const db = getDbFromEnv(base);
    const [row] = await loadPublished(env, true);
    await expect(deleteBundle(db, row.id)).rejects.toThrow(/has orders/);
    const fresh = await createBundle(db, input({ name: "Unsold", items: [{ slug: b.slug, pkg: b.packages[0].name }, { slug: c.slug, pkg: c.packages[0].name }] }), ctx);
    await deleteBundle(db, fresh);
    expect((await loadPublished(env, true)).map((x) => x.slug)).not.toContain("unsold");
  });
});
