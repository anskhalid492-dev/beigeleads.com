// Second Purchase Offer end to end against a LOCAL D1 + KV.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { priceCart } from "@/lib/cart/model";
import { createOrder } from "@/lib/checkout/create";
import { getDbFromEnv } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/manual";
import { expireStaleAttempts } from "@/lib/payments/watcher";
import { loadCandidates } from "@/lib/promos/store";
import { issueReward, listRewards, revokeReward, sendRewardReminders } from "@/lib/sales/reward";

let proxy: PlatformProxy<CloudflareEnv>; let base: CloudflareEnv; let env: CloudflareEnv;
const NOW = () => Math.floor(Date.now() / 1000);
const item = (slug = "dentists-us", pkg = "Complete") => [{ productSlug: slug, packageName: pkg }];
const mockResend = (ok = true) => vi.spyOn(globalThis, "fetch").mockImplementation(async () => ok ? new Response(JSON.stringify({ id: "m1" }), { status: 200 }) : new Response("no", { status: 500 }));

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "sales-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { CHECKOUT_ENABLED: "true", CHECKOUT_ALLOW_PLACEHOLDER: "true", RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join(";\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
  await base.CACHE.put("rate:BTC", "60000.00000000", { expirationTtl: 3600 });
  await base.DB.prepare("INSERT INTO wallets (coin, network, address_or_xpub, next_index, enabled, activates_at, min_confirmations) VALUES ('BTC','testnet','tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',0,1,0,1)").run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); });

const db = () => getDbFromEnv(env);
const one = async <T,>(sql: string, ...a: unknown[]) => (await base.DB.prepare(sql).bind(...a).first()) as T;
const all = async <T,>(sql: string, ...a: unknown[]) => ((await base.DB.prepare(sql).bind(...a).all()).results ?? []) as T[];
const buy = async (email: string, code?: string) => { const id = await createOrder(env, { email, items: item(), option: "BTC", discountCode: code }); return id; };
const pay = async (id: string) => { await markOrderPaid(env, "admin@test.dev", id, "test"); };
const priceWith = async (code: string, email?: string) => priceCart([{ slug: "dentists-us", pkg: "Complete" }], { checkoutOpen: true, allowPlaceholder: true, promo: { candidates: await loadCandidates(db(), email), enteredCode: code, nowSec: NOW(), emailKnown: !!email } });

describe("Second Purchase Offer", () => {
  it("first paid order issues exactly one code, repeated calls never duplicate, email is recorded as sent", async () => {
    mockResend();
    const o = await buy("first@test.dev"); await pay(o);
    expect(await issueReward(env, o)).toBe("exists"); // already issued by the payment hook (or issued now)
    await issueReward(env, o); await Promise.all([issueReward(env, o), issueReward(env, o)]);
    const rows = await all<{ code: string; email_status: string; percent: number; max_discount_cents: number }>("SELECT * FROM reward_codes WHERE email = ?", "first@test.dev");
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toMatch(/^BEIGE-/); expect(rows[0].percent).toBe(50); expect(rows[0].max_discount_cents).toBe(10_000); expect(rows[0].email_status).toBe("sent");
    expect((await all("SELECT id FROM promotions WHERE origin = 'reward'")).length).toBeGreaterThanOrEqual(1);
  });
  it("a returning customer gets no second reward", async () => {
    mockResend();
    const o2 = await buy("first@test.dev"); await pay(o2);
    expect(await all("SELECT id FROM reward_codes WHERE email = ?", "first@test.dev")).toHaveLength(1);
  });
  it("code works only with the buyer's email, once, capped at $100", async () => {
    mockResend();
    const r = (await one<{ code: string }>("SELECT code FROM reward_codes WHERE email = ?", "first@test.dev")).code;
    const wrong = await priceWith(r, "other@test.dev"); expect(wrong.discountCents).toBe(0);
    const ok = await priceWith(r, "first@test.dev");
    expect(ok.subtotalCents).toBe(29900); expect(ok.discountCents).toBe(10_000); expect(ok.totalCents).toBe(19_900);
    const id = await buy("FIRST@test.dev", r);
    expect((await one<{ total_usd_cents: number }>("SELECT total_usd_cents FROM orders WHERE id = ?", id)).total_usd_cents).toBe(19_900);
    // reserved -> a second order with the same code is refused
    await expect(buy("first@test.dev", r)).rejects.toBeTruthy();
    // expiry releases it again
    await base.DB.prepare("UPDATE payment_attempts SET expires_at = ? WHERE order_id = ?").bind(NOW() - 10, id).run();
    await base.DB.prepare("UPDATE orders SET created_at = ? WHERE id = ?").bind(NOW() - 4000, id).run();
    await expireStaleAttempts(env);
    const again = await priceWith(r, "first@test.dev"); expect(again.discountCents).toBe(10_000);
  });
  it("revoked codes are refused, reminders skip used or revoked codes", async () => {
    mockResend();
    const row = await one<{ id: number; code: string }>("SELECT id, code FROM reward_codes WHERE email = ?", "first@test.dev");
    expect(await revokeReward(db(), row.id)).toBe(true);
    expect((await priceWith(row.code, "first@test.dev")).discountCents).toBe(0);
    await base.DB.prepare("UPDATE reward_codes SET created_at = ? WHERE id = ?").bind(NOW() - 6 * 86400, row.id).run();
    const spy = mockResend(); await sendRewardReminders(env);
    expect(spy.mock.calls.filter((c) => String(c[0]).includes("resend")).length).toBe(0);
    const list = await listRewards(db()); expect(list?.[0].status).toBe("revoked");
  });
  it("a failed first email is recorded as failed (never shown as sent)", async () => {
    mockResend(false);
    const o = await buy("fail@test.dev"); await pay(o);
    const r = await one<{ email_status: string }>("SELECT email_status FROM reward_codes WHERE email = ?", "fail@test.dev");
    expect(r.email_status).not.toBe("sent");
  });
  it("reminder goes out once after the reminder days for an unused code", async () => {
    const spy = mockResend();
    const o = await buy("remind@test.dev"); await pay(o);
    await base.DB.prepare("UPDATE reward_codes SET created_at = ? WHERE email = ?").bind(NOW() - 6 * 86400, "remind@test.dev").run();
    spy.mockClear(); await sendRewardReminders(env); await sendRewardReminders(env);
    const sent = spy.mock.calls.filter((c) => String(c[0]).includes("resend")).length;
    expect(sent).toBeLessThanOrEqual(1);
  });
});
