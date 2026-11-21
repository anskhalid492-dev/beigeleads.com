// Team Purchase Requests end to end against a LOCAL D1 + KV.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/manual";
import { cancelRequest, createRequest, listRequests, managerApprove, managerDecline, managerView, sweepRequests } from "@/lib/sales/team";
import { getProducts } from "@/lib/catalog";

let proxy: PlatformProxy<CloudflareEnv>; let base: CloudflareEnv; let env: CloudflareEnv;
const NOW = () => Math.floor(Date.now() / 1000);
const P = getProducts();
const items = [{ slug: P[0].slug, pkg: P[0].packages[0].name }, { slug: P[1].slug, pkg: P[1].packages[0].name }];
const mockResend = (ok = true) => vi.spyOn(globalThis, "fetch").mockImplementation(async () => ok ? new Response(JSON.stringify({ id: "m1" }), { status: 200 }) : new Response("no", { status: 500 }));

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "team-e2e-")) } });
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
const sentTo = (spy: ReturnType<typeof mockResend>) => spy.mock.calls.filter((c) => String(c[0]).includes("resend")).map((c) => { const b = JSON.parse(String((c[1] as RequestInit).body)); return { to: String(b.to), subject: String(b.subject), body: `${b.html ?? ""}${b.text ?? ""}` }; });
const base0 = { requesterName: "Alex Morgan", requesterEmail: "alex@team.dev", managerName: "Sam Lee", managerEmail: "sam@team.dev", note: "For Q1 outreach", items };
let token = ""; let ref = ""; let orderId = "";

describe("Team Purchase Requests", () => {
  it("creates one request with a price snapshot, emails the manager the secure link and the requester a confirmation", async () => {
    const spy = mockResend();
    const r = await createRequest(env, base0);
    expect(r.ok && !r.existing).toBe(true); if (!r.ok) return; ref = r.reference;
    const row = await one<{ total_cents: number; status: string; token_hash: string; manager_email_status: string }>("SELECT * FROM purchase_requests WHERE reference = ?", ref);
    expect(row.status).toBe("pending"); expect(row.total_cents).toBeGreaterThan(0); expect(row.manager_email_status).toBe("sent");
    const mails = sentTo(spy);
    const m = mails.find((x) => x.to.includes("sam@team.dev")); expect(m).toBeTruthy();
    token = m!.body.match(/purchase-request\/([0-9a-f]{64})/)![1];
    expect(row.token_hash).not.toBe(token); // only a hash is stored
    expect(mails.some((x) => x.to.includes("alex@team.dev"))).toBe(true);
  });
  it("the same open request again creates nothing new and sends nothing", async () => {
    const spy = mockResend();
    const r = await createRequest(env, base0);
    expect(r.ok && r.existing).toBe(true);
    expect(sentTo(spy)).toHaveLength(0);
  });
  it("refuses own email as manager and an empty cart", async () => {
    expect((await createRequest(env, { ...base0, managerEmail: "ALEX@team.dev" })).ok).toBe(false);
    expect((await createRequest(env, { ...base0, items: [] })).ok).toBe(false);
  });
  it("the manager must confirm the right email; a wrong one sees nothing", async () => {
    expect((await managerView(env, token, "evil@x.dev")).ok).toBe(false);
    expect((await managerView(env, "0".repeat(64), "sam@team.dev")).ok).toBe(false);
    const v = await managerView(env, token, "SAM@team.dev"); expect(v.ok).toBe(true);
    expect((await one<{ status: string }>("SELECT status FROM purchase_requests WHERE reference = ?", ref)).status).toBe("viewed");
  });
  it("approve needs the total the manager saw; then it opens a normal checkout order for the MANAGER and never marks paid", async () => {
    const spy = mockResend();
    const stale = await managerApprove(env, token, "sam@team.dev", "BTC", 1);
    expect(stale.ok).toBe(false);
    const v = await managerView(env, token, "sam@team.dev"); if (!v.ok) throw new Error("view");
    const a = await managerApprove(env, token, "sam@team.dev", "BTC", v.view.currentCents);
    expect(a.ok).toBe(true); if (!a.ok) return; orderId = a.orderId;
    const o = await one<{ email: string; status: string; total_usd_cents: number }>("SELECT * FROM orders WHERE id = ?", orderId);
    expect(o).toMatchObject({ email: "sam@team.dev", status: "pending", total_usd_cents: v.view.currentCents });
    expect((await one<{ n: number }>("SELECT COUNT(*) AS n FROM order_items WHERE order_id = ?", orderId)).n).toBe(2);
    expect((await one<{ status: string }>("SELECT status FROM purchase_requests WHERE reference = ?", ref)).status).toBe("approved");
    expect(sentTo(spy).some((x) => x.to.includes("alex@team.dev"))).toBe(true);
    // approving again returns the same open order (no second order)
    const again = await managerApprove(env, token, "sam@team.dev", "BTC", v.view.currentCents);
    expect(again).toEqual({ ok: true, orderId });
    expect(await managerDecline(env, token, "sam@team.dev", "")).toMatchObject({ ok: false });
  });
  it("only a really paid order makes the request paid; both people are told once", async () => {
    const spy = mockResend();
    expect((await listRequests(db()))![0].status).toBe("approved");
    await markOrderPaid(env, "admin@test.dev", orderId, "test"); await markOrderPaid(env, "admin@test.dev", orderId, "test");
    expect((await one<{ status: string }>("SELECT status FROM purchase_requests WHERE reference = ?", ref)).status).toBe("paid");
    const paid = sentTo(spy).filter((x) => /Payment confirmed for your request|Payment confirmed: purchase request/.test(x.subject));
    expect(paid.filter((x) => x.to.includes("alex@team.dev"))).toHaveLength(1);
    expect(paid.filter((x) => x.to.includes("sam@team.dev"))).toHaveLength(1);
  });
  it("decline: requester is told with the reason; a declined request cannot be approved", async () => {
    const spy = mockResend();
    const r = await createRequest(env, { ...base0, requesterEmail: "dee@team.dev", managerEmail: "boss@team.dev" }); if (!r.ok) throw new Error("create");
    const t = sentTo(spy).find((x) => x.to.includes("boss@team.dev"))!.body.match(/purchase-request\/([0-9a-f]{64})/)![1];
    expect(await managerDecline(env, t, "boss@team.dev", "Budget is closed")).toEqual({ ok: true });
    expect(sentTo(spy).some((x) => x.to.includes("dee@team.dev") && /declined/i.test(x.subject) && x.body.includes("Budget is closed"))).toBe(true);
    expect((await managerApprove(env, t, "boss@team.dev", "BTC", 1)).ok).toBe(false);
  });
  it("reminder after 48 h (once, with a fresh link) and expiry after 7 days (once)", async () => {
    const spy = mockResend();
    const r = await createRequest(env, { ...base0, requesterEmail: "eve@team.dev", managerEmail: "lead@team.dev" }); if (!r.ok) throw new Error("create");
    const first = sentTo(spy).find((x) => x.to.includes("lead@team.dev"))!.body.match(/purchase-request\/([0-9a-f]{64})/)![1];
    await base.DB.prepare("UPDATE purchase_requests SET created_at = ? WHERE reference = ?").bind(NOW() - 50 * 3600, r.reference).run();
    spy.mockClear(); await sweepRequests(env); await sweepRequests(env);
    const rem = sentTo(spy).filter((x) => x.to.includes("lead@team.dev")); expect(rem).toHaveLength(1);
    const second = rem[0].body.match(/purchase-request\/([0-9a-f]{64})/)![1]; expect(second).not.toBe(first);
    expect((await managerView(env, second, "lead@team.dev")).ok).toBe(true);
    await base.DB.prepare("UPDATE purchase_requests SET expires_at = ? WHERE reference = ?").bind(NOW() - 5, r.reference).run();
    spy.mockClear(); await sweepRequests(env); await sweepRequests(env);
    expect(sentTo(spy).filter((x) => x.to.includes("eve@team.dev") && /expired/i.test(x.subject))).toHaveLength(1);
    expect((await managerApprove(env, second, "lead@team.dev", "BTC", 1)).ok).toBe(false);
    expect((await one<{ status: string }>("SELECT status FROM purchase_requests WHERE reference = ?", r.reference)).status).toBe("expired");
  });
  it("admin can cancel an open request; the manager link then refuses", async () => {
    const spy = mockResend();
    const r = await createRequest(env, { ...base0, requesterEmail: "kim@team.dev", managerEmail: "head@team.dev" }); if (!r.ok) throw new Error("create");
    const t = sentTo(spy).find((x) => x.to.includes("head@team.dev"))!.body.match(/purchase-request\/([0-9a-f]{64})/)![1];
    const id = (await one<{ id: number }>("SELECT id FROM purchase_requests WHERE reference = ?", r.reference)).id;
    expect(await cancelRequest(db(), id)).toBe(true); expect(await cancelRequest(db(), id)).toBe(false);
    expect((await managerApprove(env, t, "head@team.dev", "BTC", 1)).ok).toBe(false);
  });
});
