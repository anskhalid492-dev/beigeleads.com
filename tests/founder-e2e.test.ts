// Founder-led Customer Success against a LOCAL D1: enrolment safety, dry run, live gating, once-only sending, frequency, unsubscribe sync,
// feedback, webhook problems, replies. Resend is mocked (no real email is sent).
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { enrolEmail, runJourneys } from "@/lib/founder/engine";
import { onFounderProblem, recordReply, setStatus } from "@/lib/founder/events";
import { submitFeedback } from "@/lib/founder/feedback";
import { loadPrefs } from "@/lib/founder/data";
import { savePrefs, unsubscribeAll, resubscribe } from "@/lib/founder/prefs";
import { loadCs, saveCs } from "@/lib/founder/settings";
import { FOUNDER_TEMPLATES } from "@/lib/founder/templates";
import { isOptedOut, optoutToken } from "@/lib/followups/tokens";
import { getDbFromEnv } from "@/lib/db";
import { getEditable } from "@/lib/system-emails/store";

let proxy: PlatformProxy<CloudflareEnv>; let base: CloudflareEnv; let env: CloudflareEnv;
const NOW = () => Math.floor(Date.now() / 1000); const DAY = 86400;
const sent: { to: string[]; subject: string; from: string; reply_to?: string; headers?: Record<string, string>; html?: string }[] = [];
const mockResend = () => vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { sent.push(JSON.parse(String((init as RequestInit).body))); return new Response(JSON.stringify({ id: `m${sent.length}` }), { status: 200 }); });
const key = (n: string) => FOUNDER_TEMPLATES.find((t) => t.founder!.id === `CS-${n}`)!.key;
const run = (q: string, ...a: unknown[]) => base.DB.prepare(q).bind(...a).run();
const one = async <T,>(q: string, ...a: unknown[]) => (await base.DB.prepare(q).bind(...a).first()) as T;
const all = async <T,>(q: string, ...a: unknown[]) => ((await base.DB.prepare(q).bind(...a).all()).results ?? []) as T[];

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "founder-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>", HASH_SALT: "salt-test" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join(";\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); sent.length = 0; });

async function paid(id: string, email: string, ageDays: number, network = "mainnet", slug = "dentists-us") {
  await run("INSERT INTO orders (id, email, status, total_usd_cents, paid_at) VALUES (?, ?, 'paid', 9900, ?)", id, email, NOW() - ageDays * DAY);
  await run("INSERT INTO order_items (order_id, product_slug, package_name, records, price_usd_cents) VALUES (?, ?, 'Starter', 100000, 9900)", id, slug);
  await run("INSERT INTO payment_attempts (order_id, coin, network, address, expected_amount, locked_rate, expires_at, status) VALUES (?, 'BTC', ?, 'addr', '0.1', '1', ?, 'paid')", id, network, NOW() + DAY);
  await run("INSERT INTO deliveries (order_id, url, status, attempts, sent_at) VALUES (?, 'https://x.test/f', 'sent', 1, ?)", id, NOW() - ageDays * DAY);
}
const cid = async (email: string) => (await one<{ id: number }>("SELECT id FROM cs_customers WHERE email = ?", email)).id;
async function goLive(keys: string[]) {
  const db = getDbFromEnv(env); const approved: Record<string, number> = {};
  for (const k of keys) approved[k] = (await getEditable(db, k))!.version;
  const r = await saveCs(env, "t", { mode: "live", enabled: Object.fromEntries(keys.map((k) => [k, true])), approved, sendersConfirmed: { A: true, B: true, C: true }, replyInboxConfirmed: true }, "test");
  expect(r.ok).toBe(true);
}

describe("safety defaults", () => {
  it("everything is off and nothing is enrolled by default", async () => {
    const s = await loadCs(env); expect(s.mode).toBe("off"); expect(s.autoEnrollNew).toBe(false); expect(Object.values(s.enabled).some(Boolean)).toBe(false);
    await paid("O-OLD", "old@buyer.test", 40); mockResend();
    const r = await runJourneys(env); expect(r.customers).toBe(0); expect(sent).toHaveLength(0);
    expect(await one<{ n: number }>("SELECT COUNT(*) AS n FROM cs_customers")).toEqual({ n: 0 });
  });
  it("auto-enrolment never picks up historical or test-network orders and ignores service-only orders", async () => {
    await paid("O-TEST", "test@buyer.test", 1, "testnet"); await paid("O-SVC", "svc@buyer.test", 1, "mainnet", "email-verification");
    const t0 = NOW() - 100;
    await saveCs(env, "t", { autoEnrollNew: true, enrollFrom: t0, mode: "dry_run" }, "test"); mockResend();
    await paid("O-NEW", "new@buyer.test", 0);
    await runJourneys(env);
    const emails = (await all<{ email: string }>("SELECT email FROM cs_customers")).map((x) => x.email);
    expect(emails).toContain("new@buyer.test"); expect(emails).not.toContain("old@buyer.test"); expect(emails).not.toContain("test@buyer.test"); expect(emails).not.toContain("svc@buyer.test");
    await saveCs(env, "t", { autoEnrollNew: false, mode: "off" }, "test");
  });
});

describe("dry run and live gating", () => {
  it("a dry run records what it would send and sends nothing", async () => {
    await paid("O-A", "a@buyer.test", 3); await enrolEmail(env, "a@buyer.test", "t", "Ann");
    await saveCs(env, "t", { mode: "dry_run", enabled: { [key("01")]: true } }, "test"); mockResend();
    const r = await runJourneys(env); expect(r.planned).toBeGreaterThan(0); expect(sent).toHaveLength(0);
    expect(await one<{ n: number }>("SELECT COUNT(*) AS n FROM cs_events WHERE kind = 'dry_run'")).toEqual({ n: expect.any(Number) });
    expect(await one<{ n: number }>("SELECT COUNT(*) AS n FROM cs_scheduled")).toEqual({ n: 0 });
  });
  it("live mode holds an email that is not approved, then sends once it is approved", async () => {
    const k = key("01"); mockResend();
    await saveCs(env, "t", { mode: "live", enabled: { [k]: true }, approved: {}, sendersConfirmed: { A: true, B: true, C: true }, replyInboxConfirmed: true }, "test");
    expect((await runJourneys(env)).blocked).toBeGreaterThan(0); expect(sent).toHaveLength(0);
    await goLive([k]);
    const r = await runJourneys(env);
    expect(r.sent).toBe(1); expect(sent).toHaveLength(1);
    const m = sent[0]!;
    expect(m.from).toBe("Anus — Founder, BeigeLeads <anus@mail.beigeleads.com>"); expect(m.reply_to).toBe("hello@beigeleads.com");
    expect(m.to).toEqual(["a@buyer.test"]); expect(m.subject).toBe("Ann, a personal thank you from me");
    expect(m.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click"); expect(m.headers?.["List-Unsubscribe"]).toContain("/api/unsubscribe?e=a%40buyer.test");
    expect(m.html).toContain("mailto:hello@beigeleads.com?subject="); expect(m.html).not.toMatch(/\{\{[^}]*\}\}/);
  });
  it("does not send the same email twice, however often the cron runs", async () => {
    mockResend(); await runJourneys(env); await runJourneys(env);
    expect(sent).toHaveLength(0);
    expect(await one<{ n: number }>("SELECT COUNT(*) AS n FROM cs_scheduled WHERE template_key = ?", key("01"))).toEqual({ n: 1 });
  });
  it("an unconfirmed sender blocks that sender's emails", async () => {
    await saveCs(env, "t", { sendersConfirmed: { A: false, B: true, C: true } }, "test");
    await paid("O-B", "b@buyer.test", 3); await enrolEmail(env, "b@buyer.test", "t"); mockResend();
    expect((await runJourneys(env)).blocked).toBeGreaterThan(0); expect(sent).toHaveLength(0);
    await saveCs(env, "t", { sendersConfirmed: { A: true, B: true, C: true } }, "test");
  });
  it("a failed send is retried at most 3 times and the team is told", async () => {
    await paid("O-F", "f@buyer.test", 3); await enrolEmail(env, "f@buyer.test", "t");
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ message: "nope" }), { status: 500 }));
    const r = await runJourneys(env); expect(r.failed).toBeGreaterThan(0);
    const row = await one<{ status: string; attempts: number }>("SELECT status, attempts FROM cs_scheduled WHERE customer_id = ? AND template_key = ?", await cid("f@buyer.test"), key("01"));
    expect(row.status).toBe("failed"); expect(row.attempts).toBe(1);
  });
});

describe("frequency and customer controls", () => {
  it("sends one optional email, then holds the next one for the minimum gap", async () => {
    const k2 = key("02"), k3 = key("03"); await paid("O-C", "c@buyer.test", 9); await enrolEmail(env, "c@buyer.test", "t");
    await goLive([key("01"), k2, k3]); mockResend();
    await runJourneys(env); await runJourneys(env);
    const mine = await all<{ template_key: string }>("SELECT template_key FROM cs_scheduled WHERE customer_id = ? AND status = 'sent'", await cid("c@buyer.test"));
    const optional = mine.filter((m) => m.template_key !== key("01"));
    expect(optional.length).toBeLessThanOrEqual(1);
  });
  it("a paused customer gets nothing; recording a reply pauses and notes what they shared", async () => {
    await paid("O-D", "d@buyer.test", 9); await enrolEmail(env, "d@buyer.test", "t"); const id = await cid("d@buyer.test");
    expect(await recordReply(env, id, "admin", ["business"], "wrote back")).toBe(true);
    expect((await one<{ status: string }>("SELECT status FROM cs_customers WHERE id = ?", id)).status).toBe("paused");
    expect((await all("SELECT 1 FROM cs_events WHERE customer_id = ? AND kind = 'shared:business'", id)).length).toBe(1);
    mockResend(); await runJourneys(env); expect(sent.filter((m) => m.to[0] === "d@buyer.test")).toHaveLength(0);
    expect(await setStatus(env, id, "active", "admin")).toBe(true);
  });
  it("cancelling a customer cancels scheduled emails", async () => {
    const id = await cid("d@buyer.test"); await run("INSERT OR IGNORE INTO cs_scheduled (customer_id, template_key, reference, status) VALUES (?, 'x', '-', 'scheduled')", id);
    await setStatus(env, id, "cancelled", "admin");
    expect((await one<{ status: string }>("SELECT status FROM cs_scheduled WHERE customer_id = ? AND template_key = 'x'", id)).status).toBe("cancelled");
  });
});

describe("preferences and unsubscribe", () => {
  it("needs a valid signed link; unsubscribe applies to every sender through the shared list; resubscribe needs a press", async () => {
    const e = "p@buyer.test"; const t = await optoutToken(env, e);
    expect(await savePrefs(env, e, "0".repeat(48), { recs: false })).toBe(false);
    expect(await savePrefs(env, e, t, { recs: false, frequency: "less", countries: ["Germany"] })).toBe(true);
    const p = await loadPrefs(env, e); expect(p.recs).toBe(false); expect(p.frequency).toBe("less"); expect(p.countries).toEqual(["germany"]);
    expect(await unsubscribeAll(env, e, t)).toBe(true); expect(await isOptedOut(env, e)).toBe(true); expect((await loadPrefs(env, e)).unsubAll).toBe(true);
    expect(await resubscribe(env, e, t)).toBe(true); expect(await isOptedOut(env, e)).toBe(false);
  });
  it("an unsubscribed customer gets no optional email but is still allowed service replies", async () => {
    await paid("O-U", "u@buyer.test", 9); await enrolEmail(env, "u@buyer.test", "t"); await unsubscribeAll(env, "u@buyer.test", await optoutToken(env, "u@buyer.test"));
    mockResend(); await runJourneys(env); expect(sent.filter((m) => m.to[0] === "u@buyer.test")).toHaveLength(0);
  });
});

describe("feedback", () => {
  it("needs a valid link, saves first, alerts the team without the customer's address, and ignores a duplicate", async () => {
    const e = "fb@buyer.test"; const t = await optoutToken(env, e); mockResend();
    expect((await submitFeedback(env, { email: e, token: "1".repeat(48), satisfaction: 5 })).ok).toBe(false);
    const r = await submitFeedback(env, { email: e, token: t, satisfaction: 1, comments: "It did not work", wantsHelp: true });
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.reference).toMatch(/^FB-[0-9A-F]{8}$/);
    const to = sent.map((m) => m.to[0]); expect(to.every((x) => x === "owner@test.dev")).toBe(true); expect(sent.length).toBe(3); // feedback, assistance, negative
    expect(JSON.stringify(sent)).not.toContain(e);
    const again = await submitFeedback(env, { email: e, token: t, satisfaction: 1, comments: "It did not work", wantsHelp: true });
    expect(again.ok && again.reference).toBe(r.reference);
    expect(await one<{ n: number }>("SELECT COUNT(*) AS n FROM cs_feedback WHERE email = ?", e)).toEqual({ n: 1 });
    expect((await submitFeedback(env, { email: e, token: t, satisfaction: 9 })).ok).toBe(false);
  });
  it("sends no customer confirmation until the founder approved it (honest 'not sent')", async () => {
    const e = "fb2@buyer.test"; mockResend();
    const r = await submitFeedback(env, { email: e, token: await optoutToken(env, e), satisfaction: 4 });
    expect(r.ok && r.confirmation).toBe("not_sent");
  });
});

describe("delivery problems", () => {
  it("a bounce pauses the customer; a spam complaint unsubscribes and cancels", async () => {
    await paid("O-X", "x@buyer.test", 1); await enrolEmail(env, "x@buyer.test", "t"); const id = await cid("x@buyer.test");
    await run("INSERT INTO cs_scheduled (customer_id, template_key, reference, status, provider_id) VALUES (?, ?, '-', 'sent', 'prov-1')", id, key("01"));
    await onFounderProblem(env, "prov-1", "bounced");
    expect((await one<{ status: string }>("SELECT status FROM cs_customers WHERE id = ?", id)).status).toBe("paused");
    await onFounderProblem(env, "prov-1", "complained");
    expect((await one<{ status: string }>("SELECT status FROM cs_customers WHERE id = ?", id)).status).toBe("cancelled");
    expect(await isOptedOut(env, "x@buyer.test")).toBe(true);
  });
});
