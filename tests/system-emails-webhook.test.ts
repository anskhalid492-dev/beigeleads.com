// Resend webhook: Svix signature, idempotency, status ordering, triggers sent once, retention. Local D1.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { processResendEvent, purgeEmailLogs, verifySvix } from "@/lib/system-emails/webhook";
import { sendOnce } from "@/lib/system-emails/triggers";

const SECRET_RAW = new Uint8Array(24).map((_, i) => i * 7 + 3);
const SECRET = `whsec_${btoa(String.fromCharCode(...SECRET_RAW))}`;
async function sign(id: string, ts: string, body: string) {
  const key = await crypto.subtle.importKey("raw", SECRET_RAW, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  return `v1,${btoa(String.fromCharCode(...sig))}`;
}

describe("Svix signature", () => {
  const now = 1_800_000_000;
  const body = '{"type":"email.delivered"}';
  it("accepts a correct signature, also among several", async () => {
    const sig = await sign("msg_1", String(now), body);
    expect(await verifySvix(SECRET, { id: "msg_1", timestamp: String(now), signature: sig }, body, now)).toBe(true);
    expect(await verifySvix(SECRET, { id: "msg_1", timestamp: String(now), signature: `v1,AAAA ${sig}` }, body, now)).toBe(true);
  });
  it("rejects a changed body, wrong id, wrong secret, stale or missing headers", async () => {
    const sig = await sign("msg_1", String(now), body);
    expect(await verifySvix(SECRET, { id: "msg_1", timestamp: String(now), signature: sig }, body + " ", now)).toBe(false);
    expect(await verifySvix(SECRET, { id: "msg_2", timestamp: String(now), signature: sig }, body, now)).toBe(false);
    expect(await verifySvix(`whsec_${btoa("another secret value!!")}`, { id: "msg_1", timestamp: String(now), signature: sig }, body, now)).toBe(false);
    expect(await verifySvix(SECRET, { id: "msg_1", timestamp: String(now - 600), signature: await sign("msg_1", String(now - 600), body) }, body, now)).toBe(false);
    expect(await verifySvix(SECRET, { id: null, timestamp: String(now), signature: sig }, body, now)).toBe(false);
    expect(await verifySvix("", { id: "msg_1", timestamp: String(now), signature: sig }, body, now)).toBe(false);
  });
});

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "sysmail-hook-")) } });
  env = { ...proxy.env, RESEND_API_KEY: "test-key", NOTIFY_EMAIL: "owner@x.co" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(0[0-9]|1[0-9]|2[0-4])_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); vi.unstubAllGlobals(); });

const evt = (type: string, id: string, extra: object = {}) => JSON.stringify({ type, data: { email_id: id, ...extra } });
const status = async (pid: string) => (await env.DB.prepare("SELECT delivery_status, delivery_detail FROM email_delivery_logs WHERE provider_id = ?").bind(pid).first<{ delivery_status: string; delivery_detail: string }>());
async function seedLog(pid: string, ref = "ref1") {
  await env.DB.prepare("INSERT INTO email_delivery_logs (template_key, source, recipient, subject, reference, status, provider_id) VALUES ('product_delivery','live','a***@x.co','s',?, 'sent', ?)").bind(ref, pid).run();
}

describe("webhook processing", () => {
  it("moves a log to delivered and ignores the same event delivered twice", async () => {
    await seedLog("em_1");
    expect((await processResendEvent(env, "svix_a", evt("email.delivered", "em_1"))).note).toBe("delivered");
    expect((await status("em_1"))?.delivery_status).toBe("delivered");
    expect((await processResendEvent(env, "svix_a", evt("email.delivered", "em_1"))).note).toBe("duplicate");
  });
  it("never moves backwards (a late 'sent' after 'delivered')", async () => {
    expect((await processResendEvent(env, "svix_b", evt("email.sent", "em_1"))).note).toBe("older event");
    expect((await status("em_1"))?.delivery_status).toBe("delivered");
  });
  it("records a bounce with its reason and emails the owner once", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => { calls.push(init.body); return new Response(JSON.stringify({ id: "x" }), { status: 200 }); }));
    await seedLog("em_2");
    await processResendEvent(env, "svix_c", evt("email.bounced", "em_2", { bounce: { message: "Mailbox does not exist", type: "Permanent" } }));
    const s = await status("em_2");
    expect(s?.delivery_status).toBe("bounced");
    expect(s?.delivery_detail).toContain("Mailbox does not exist");
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain("owner@x.co");
    expect(calls[0]).not.toContain("em_2@");
    await processResendEvent(env, "svix_c", evt("email.bounced", "em_2"));
    expect(calls.length).toBe(1);
  });
  it("ignores unknown events and unknown email ids without error", async () => {
    expect((await processResendEvent(env, "svix_d", evt("email.opened", "em_1"))).note).toBe("ignored");
    expect((await processResendEvent(env, "svix_e", evt("email.delivered", "em_unknown"))).note).toBe("no matching log");
    expect((await processResendEvent(env, "svix_f", "not json")).status).toBe(400);
  });
});

describe("triggers send once", () => {
  const db = () => getDbFromEnv(env);
  it("category confirmation: first send goes, second is blocked by the log", async () => {
    const sent: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => { sent.push(init.body); return new Response(JSON.stringify({ id: `em_t${sent.length}` }), { status: 200 }); }));
    expect(await sendOnce(env, db(), "category_request_received", "buyer@x.co", { category_name: "Yoga studios" }, "cat:abc")).toBe("sent");
    expect(await sendOnce(env, db(), "category_request_received", "buyer@x.co", { category_name: "Yoga studios" }, "cat:abc")).toBe("already-sent");
    expect(sent.length).toBe(1);
    expect(sent[0]).toContain("Yoga studios");
  });
  it("is skipped when a required value is missing, so no half-empty email goes out", async () => {
    expect(await sendOnce(env, db(), "sample_delivery", "buyer@x.co", { product_name: "Dentists" }, "sample:9")).toBe("skipped");
  });
  it("stops after 3 failed tries", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    const r: string[] = [];
    for (let i = 0; i < 5; i++) r.push(await sendOnce(env, db(), "payment_received", "b@x.co", { product_name: "Dentists", order_url: "https://beigeleads.com/checkout/x" }, "order-x"));
    expect(r).toEqual(["failed", "failed", "failed", "skipped", "skipped"]);
  });
});

describe("retention", () => {
  it("removes old logs and webhook events, keeps recent ones", async () => {
    await env.DB.prepare("INSERT INTO email_delivery_logs (template_key, source, status, created_at) VALUES ('old','live','sent', unixepoch() - 200*86400)").run();
    await env.DB.prepare("INSERT INTO email_webhook_events (id, type, created_at) VALUES ('old_evt','email.sent', unixepoch() - 40*86400)").run();
    await purgeEmailLogs(env);
    expect((await env.DB.prepare("SELECT COUNT(*) n FROM email_delivery_logs WHERE template_key='old'").first<{ n: number }>())?.n).toBe(0);
    expect((await env.DB.prepare("SELECT COUNT(*) n FROM email_webhook_events WHERE id='old_evt'").first<{ n: number }>())?.n).toBe(0);
    expect((await env.DB.prepare("SELECT COUNT(*) n FROM email_delivery_logs WHERE template_key='product_delivery'").first<{ n: number }>())?.n).toBeGreaterThan(0);
  });
});
