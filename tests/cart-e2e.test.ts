// Multi-list orders: creation, duplicate protection, and delivery, against a local D1 + KV.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getProducts } from "@/lib/catalog";
import { CheckoutError, createOrder } from "@/lib/checkout/create";
import { deliverOrder } from "@/lib/delivery/deliver";
import { cartStats } from "@/lib/cart/stats";

let proxy: PlatformProxy<CloudflareEnv>;
let base: CloudflareEnv;
let env: CloudflareEnv;
const P = getProducts();
const a = P[0], b = P[1];
const it0 = (p: (typeof P)[number], n = 0) => ({ productSlug: p.slug, packageName: p.packages[n].name });

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "cart-e2e-")) } });
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

const count = async (sql: string) => ((await base.DB.prepare(sql).first()) as { n: number }).n;

describe("multi-list order creation", () => {
  let orderId = "";
  it("creates ONE order with every item and the exact server-side total", async () => {
    orderId = await createOrder(env, { email: "buyer@test.dev", items: [it0(a, 0), it0(b, 1)], option: "BTC" });
    const o = (await base.DB.prepare("SELECT total_usd_cents AS t, status FROM orders WHERE id = ?").bind(orderId).first()) as { t: number; status: string };
    expect(o.status).toBe("pending");
    expect(o.t).toBe(a.packages[0].priceUsdCents + b.packages[1].priceUsdCents);
    expect(await count(`SELECT COUNT(*) AS n FROM order_items WHERE order_id = '${orderId}'`)).toBe(2);
    expect(await count(`SELECT COUNT(*) AS n FROM payment_attempts WHERE order_id = '${orderId}'`)).toBe(1);
  });
  it("returns the same open order for an identical repeat request (no second order or payment session)", async () => {
    const again = await createOrder(env, { email: "buyer@test.dev", items: [it0(b, 1), it0(a, 0)], option: "BTC" });
    expect(again).toBe(orderId);
    expect(await count("SELECT COUNT(*) AS n FROM orders")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM payment_attempts")).toBe(1);
  });
  it("a different cart creates a different order", async () => {
    const other = await createOrder(env, { email: "buyer@test.dev", items: [it0(a, 0)], option: "BTC" });
    expect(other).not.toBe(orderId);
    expect(await count("SELECT COUNT(*) AS n FROM orders")).toBe(2);
  });
  it("refuses empty carts, duplicate lists, unknown packages and closed checkout", async () => {
    await expect(createOrder(env, { email: "x@test.dev", items: [], option: "BTC" })).rejects.toBeInstanceOf(CheckoutError);
    await expect(createOrder(env, { email: "x@test.dev", items: [it0(a), it0(a, 1)], option: "BTC" })).rejects.toThrow(/only once/i);
    await expect(createOrder(env, { email: "x@test.dev", items: [{ productSlug: a.slug, packageName: "Nope" }], option: "BTC" })).rejects.toThrow(/does not exist/i);
    const closed = new Proxy(env, { get: (t, k) => (k === "CHECKOUT_ENABLED" ? "false" : (t as never)[k]) }) as CloudflareEnv;
    await expect(createOrder(closed, { email: "x@test.dev", items: [it0(a)], option: "BTC" })).rejects.toThrow(/not open/i);
  });
  it("reports multi-item orders in the admin funnel", async () => {
    const s = await cartStats(base, 30);
    expect(s.ordersCreated).toBe(2);
    expect(s.multiItemOrders).toBe(1);
    expect(s.paidReal).toBe(0);
  });

  describe("delivery of a paid multi-list order", () => {
    const bodies: { subject: string; text: string }[] = [];
    const mockResend = () => vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { bodies.push(JSON.parse(String((init as RequestInit).body))); return new Response(JSON.stringify({ id: "m1" }), { status: 200 }); });
    it("waits (sends nothing) until EVERY list has a delivery link", async () => {
      await base.DB.prepare("UPDATE orders SET status = 'paid', paid_at = unixepoch() WHERE id = ?").bind(orderId).run();
      await base.DB.prepare("INSERT INTO delivery_links (product_slug, package_name, url, updated_by, updated_at) VALUES (?, '', 'https://files.example/a', 'test', unixepoch())").bind(a.slug).run();
      mockResend();
      expect(await deliverOrder(env, orderId)).toBe("no-link");
      expect(bodies.filter((x) => /Your BeigeLeads lists/.test(x.subject))).toHaveLength(0);
    });
    it("then sends ONE email with a link per list, and never a second one", async () => {
      await base.DB.prepare("INSERT INTO delivery_links (product_slug, package_name, url, updated_by, updated_at) VALUES (?, '', 'https://files.example/b', 'test', unixepoch())").bind(b.slug).run();
      mockResend();
      expect(await deliverOrder(env, orderId)).toBe("sent");
      const mail = bodies.find((x) => /Your BeigeLeads lists/.test(x.subject));
      expect(mail?.text).toContain("https://files.example/a");
      expect(mail?.text).toContain("https://files.example/b");
      expect(await deliverOrder(env, orderId)).toBe("already-sent");
      expect(await count(`SELECT COUNT(*) AS n FROM deliveries WHERE order_id = '${orderId}'`)).toBe(1);
    });
  });
});
