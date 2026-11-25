// Resend integration manager: key classification, encrypted credentials, sender rules, retry rules. Local D1.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyDomainsAnswer } from "@/lib/email/resend-api";
import { decryptSecret, encryptSecret, hint } from "@/lib/email/crypto";
import { credentialStatus, emailConfigured, removeApiKey, resetCredentialMemo, resolveResend, resolveWebhookSecret, saveApiKey, saveWebhookSecret } from "@/lib/email/credentials";
import { categoryOf, checkSenderDomains, EMPTY_SENDERS, saveSenders, senderFor } from "@/lib/email/senders";
import { activity, eventRegistry, retryEmail, retryState, usage, type LogRow } from "@/lib/email/admin";
import { sendEmailDetailed } from "@/lib/forms/email";

const SECRET = "a".repeat(40);
const KEY_A = "re_AAAAAAAAAAAAAAAAAAAAAAAA1111";
const KEY_B = "re_BBBBBBBBBBBBBBBBBBBBBBBB2222";
const ok = async () => ({ state: "valid_full" as const, detail: "ok" });
const bad = async () => ({ state: "invalid" as const, detail: "no" });

describe("answer classification", () => {
  it("separates valid, sending-only, invalid, permission, rate limit and provider errors", () => {
    expect(classifyDomainsAnswer(200, {}).state).toBe("valid_full");
    expect(classifyDomainsAnswer(401, { name: "restricted_api_key", message: "This API key is restricted to only send emails" }).state).toBe("valid_sending_only");
    expect(classifyDomainsAnswer(400, { name: "validation_error", message: "API key is invalid" }).state).toBe("invalid");
    expect(classifyDomainsAnswer(401, { name: "missing_api_key" }).state).toBe("invalid");
    expect(classifyDomainsAnswer(403, { message: "nope" }).state).toBe("insufficient_permissions");
    expect(classifyDomainsAnswer(429, {}).state).toBe("rate_limited");
    expect(classifyDomainsAnswer(503, {}).state).toBe("provider_error");
  });
});

describe("encryption", () => {
  it("round-trips, fails with another secret, and never shows the key in the hint", async () => {
    const e = await encryptSecret(KEY_A, SECRET);
    expect(e).not.toContain(KEY_A);
    expect(await decryptSecret(e, SECRET)).toBe(KEY_A);
    expect(await decryptSecret(e, "b".repeat(40))).toBeNull();
    expect(hint(KEY_A)).toBe("••••1111");
    await expect(encryptSecret(KEY_A, "short")).rejects.toThrow();
  });
});

describe("sender domain rules (pure)", () => {
  it("accepts the configured domain and verified domains only", () => {
    const s = { ...EMPTY_SENDERS, defaultEmail: "hello@mail.beigeleads.com" };
    expect(checkSenderDomains(s, "noreply@mail.beigeleads.com", null)).toEqual([]);
    expect(checkSenderDomains({ ...s, defaultEmail: "x@other.com" }, "noreply@mail.beigeleads.com", null)).toHaveLength(1);
    expect(checkSenderDomains({ ...s, defaultEmail: "x@other.com" }, "noreply@mail.beigeleads.com", ["other.com"])).toEqual([]);
  });
  it("groups templates", () => {
    expect(categoryOf("product_delivery")).toBe("orders");
    expect(categoryOf("creator_inquiry_received")).toBe("inquiries");
    expect(categoryOf("partner_application_approved")).toBe("partners");
    expect(categoryOf("ev_admin_new_order")).toBe("alerts");
    expect(categoryOf(undefined)).toBe("alerts");
  });
});

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "resend-int-")) } });
  env = { ...proxy.env, EMAIL_KEY_SECRET: SECRET, EMAIL_FROM: "BeigeLeads <noreply@mail.beigeleads.com>" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(16|22|23|24|50)_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); vi.unstubAllGlobals(); });
beforeEach(() => { resetCredentialMemo(); env = { ...env, RESEND_API_KEY: undefined } as CloudflareEnv; });

describe("credentials", () => {
  it("works from the variable alone (existing behaviour preserved)", async () => {
    const e = { ...env, RESEND_API_KEY: "re_envkey_envkey_envkey" } as CloudflareEnv;
    expect((await resolveResend(e)).source).toBe("env");
    expect(await emailConfigured(e)).toBe(true);
  });
  it("is not configured with nothing", async () => { expect((await resolveResend(env)).source).toBe("none"); expect(await emailConfigured(env)).toBe(false); });
  it("refuses an invalid key and keeps the old one; a valid key is stored encrypted and wins over the variable", async () => {
    const withEnv = { ...env, RESEND_API_KEY: "re_envkey_envkey_envkey" } as CloudflareEnv;
    expect((await saveApiKey(withEnv, "a@x.co", KEY_A, ok)).ok).toBe(true);
    const raw = await env.DB.prepare("SELECT api_key_enc, api_key_hint FROM email_integration WHERE id='main'").first<{ api_key_enc: string; api_key_hint: string }>();
    expect(raw?.api_key_enc).not.toContain(KEY_A); expect(raw?.api_key_hint).toBe("••••1111");
    expect((await resolveResend(withEnv))).toMatchObject({ key: KEY_A, source: "admin" });
    // rotation: a bad new key does not replace the good one
    const r = await saveApiKey(withEnv, "a@x.co", KEY_B, bad);
    expect(r.ok).toBe(false);
    resetCredentialMemo();
    expect((await resolveResend(withEnv)).key).toBe(KEY_A);
    // a good new key replaces it
    expect((await saveApiKey(withEnv, "a@x.co", KEY_B, async () => ({ state: "valid_sending_only" as const, detail: "" }))).ok).toBe(true);
    expect((await resolveResend(withEnv)).key).toBe(KEY_B);
    // status exposes hints only
    const st = JSON.stringify(await credentialStatus(withEnv));
    expect(st).not.toContain(KEY_A); expect(st).not.toContain(KEY_B);
  });
  it("falls back to the variable when the saved key cannot be decrypted, and after removal", async () => {
    const withEnv = { ...env, RESEND_API_KEY: "re_envkey_envkey_envkey" } as CloudflareEnv;
    resetCredentialMemo();
    const wrong = { ...withEnv, EMAIL_KEY_SECRET: "z".repeat(40) } as CloudflareEnv;
    expect(await resolveResend(wrong)).toMatchObject({ source: "env", adminBroken: true });
    resetCredentialMemo();
    await removeApiKey(withEnv);
    expect((await resolveResend(withEnv)).source).toBe("env");
  });
  it("refuses saving without the encryption secret or with a malformed key", async () => {
    expect((await saveApiKey({ ...env, EMAIL_KEY_SECRET: undefined } as CloudflareEnv, "a", KEY_A, ok)).ok).toBe(false);
    expect((await saveApiKey(env, "a", "not-a-key", ok)).ok).toBe(false);
  });
  it("stores the webhook signing secret encrypted and resolves it", async () => {
    const s = "whsec_" + "A".repeat(30);
    expect((await saveWebhookSecret(env, "a", s)).ok).toBe(true);
    expect((await resolveWebhookSecret(env))).toMatchObject({ secret: s, source: "admin" });
    expect((await saveWebhookSecret(env, "a", "nope")).ok).toBe(false);
  });
});

describe("sender settings and sending", () => {
  it("rejects an address on an unverified domain, accepts the configured one", async () => {
    expect((await saveSenders(env, "a", { ...EMPTY_SENDERS, defaultEmail: "x@evil.com" }, null)).ok).toBe(false);
    expect((await saveSenders(env, "a", { ...EMPTY_SENDERS, defaultName: "BL Team", defaultEmail: "hello@mail.beigeleads.com", supportEmail: "help@mail.beigeleads.com", overrides: { orders: { replyTo: "support" } } }, null)).ok).toBe(true);
    expect((await saveSenders(env, "a", { ...EMPTY_SENDERS, overrides: { orders: { replyTo: "sales" } } }, null)).ok).toBe(false);
    expect((await saveSenders(env, "a", { ...EMPTY_SENDERS, overrides: { nope: { name: "x" } } }, null)).ok).toBe(false);
  });
  it("uses the saved key and sender for a real send and logs without the key", async () => {
    await env.CACHE.delete("email:senders:v1");
    await saveApiKey(env, "a", KEY_A, ok); resetCredentialMemo();
    const calls: { auth: string; body: { from: string; reply_to?: string } }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { headers: Record<string, string>; body: string }) => { calls.push({ auth: init.headers.Authorization!, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ id: "em_x1" }), { status: 200 }); }));
    const r = await sendEmailDetailed(env, { to: "buyer@x.co", subject: "Hi", text: "t", templateKey: "product_delivery", reference: "ORD1" });
    expect(r).toMatchObject({ ok: true, id: "em_x1" });
    expect(calls[0]!.auth).toBe(`Bearer ${KEY_A}`);
    expect(calls[0]!.body.from).toBe("BL Team <hello@mail.beigeleads.com>");
    expect(calls[0]!.body.reply_to).toBe("help@mail.beigeleads.com");
    const log = await env.DB.prepare("SELECT * FROM email_delivery_logs WHERE provider_id='em_x1'").first<Record<string, string>>();
    expect(JSON.stringify(log)).not.toContain(KEY_A);
    expect(log?.recipient).toBe("b***@x.co");
    expect((await senderFor(env, "ev_admin_new_order")).replyTo).toBeUndefined();
  });
  it("reports a clear error when nothing is configured", async () => {
    await removeApiKey(env); resetCredentialMemo();
    const r = await sendEmailDetailed(env, { to: "a@x.co", subject: "s", text: "t" });
    expect(r.ok).toBe(false); expect(r.error).toContain("not configured");
  });
  it("survives a Resend outage without throwing", async () => {
    await saveApiKey(env, "a", KEY_A, ok); resetCredentialMemo();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const r = await sendEmailDetailed(env, { to: "a@x.co", subject: "s", text: "t", templateKey: "contact_received", reference: "CT-1" });
    expect(r.ok).toBe(false);
    const row = await env.DB.prepare("SELECT status FROM email_delivery_logs WHERE reference='CT-1'").first<{ status: string }>();
    expect(row?.status).toBe("failed");
  });
});

async function seed(o: Partial<{ tpl: string; src: string; status: string; ds: string; ref: string; pid: string }> = {}) {
  const r = await env.DB.prepare("INSERT INTO email_delivery_logs (template_key, source, recipient, subject, reference, status, provider_id, delivery_status) VALUES (?, ?, 'a***@x.co', 'Subject', ?, ?, ?, ?)").bind(o.tpl ?? "creator_inquiry_received", o.src ?? "live", o.ref ?? "CR-1", o.status ?? "failed", o.pid ?? "", o.ds ?? "").run();
  return (await env.DB.prepare("SELECT * FROM email_delivery_logs WHERE id = ?").bind(r.meta.last_row_id).first<LogRow>())!;
}
describe("retry rules", () => {
  it("allows a failed, identifiable, supported email", async () => { expect((await retryState(env, await seed({ ref: "CR-100" }))).allowed).toBe(true); });
  it("never retries bounces, complaints, tests, delivered emails, unsupported events or items without reference", async () => {
    expect((await retryState(env, await seed({ status: "sent", ds: "bounced", ref: "CR-101" }))).allowed).toBe(false);
    expect((await retryState(env, await seed({ status: "sent", ds: "complained", ref: "CR-102" }))).allowed).toBe(false);
    expect((await retryState(env, await seed({ src: "test", ref: "CR-103" }))).allowed).toBe(false);
    expect((await retryState(env, await seed({ status: "sent", ds: "delivered", ref: "CR-104" }))).allowed).toBe(false);
    expect((await retryState(env, await seed({ tpl: "payment_received", ref: "O1" }))).allowed).toBe(false);
    expect((await retryState(env, await seed({ ref: "" }))).allowed).toBe(false);
  });
  it("refuses when a later attempt for the same item was already accepted (no duplicate)", async () => {
    const first = await seed({ ref: "CR-200" });
    await seed({ ref: "CR-200", status: "sent" });
    expect((await retryState(env, first)).allowed).toBe(false);
  });
  it("needs a reason, counts attempts and stops after three; one claim at a time", async () => {
    const l = await seed({ ref: "CR-300" });
    expect((await retryEmail(env, "a@x.co", l.id, "")).ok).toBe(false);
    const r1 = await retryEmail(env, "a@x.co", l.id, "customer asked");
    expect(r1.ok).toBe(false); // the inquiry does not exist in this test DB: nothing is created or sent
    await env.DB.prepare("INSERT INTO email_retry_log (log_id, template_key, reference, result) VALUES (?, 'x', 'CR-300', 'started')").bind(l.id).run();
    expect((await retryEmail(env, "a@x.co", l.id, "again")).message).toContain("just started");
    await env.DB.prepare("UPDATE email_retry_log SET result = 'failed' WHERE result = 'started' AND log_id = ?").bind(l.id).run();
    await env.DB.prepare("INSERT INTO email_retry_log (log_id, template_key, reference, result) VALUES (?, 'x', 'CR-300', 'failed'), (?, 'x', 'CR-300', 'failed')").bind(l.id, l.id).run();
    expect((await retryState(env, l)).allowed).toBe(false);
  });
});

describe("activity, usage, registry", () => {
  it("filters by status, search and event; counts real rows", async () => {
    await seed({ tpl: "contact_received", status: "sent", ds: "delivered", ref: "CT-9", pid: "em_z" });
    const a = await activity(env, { status: "delivered", q: "CT-9" });
    expect(a.rows.length).toBe(1);
    expect((await activity(env, { event: "contact_received", q: "no-such" })).total).toBe(0);
    expect((await activity(env, { q: "%" })).total).toBe(0); // wildcard is escaped
    const u = await usage(env);
    expect(u.ready).toBe(true); expect(u.delivered30).toBeGreaterThan(0);
  });
  it("lists essential emails as not disableable", async () => {
    const reg = await eventRegistry(env);
    expect(reg.find((e) => e.key === "product_delivery")?.canDisable).toBe(false);
    expect(reg.find((e) => e.key === "payment_received")?.canDisable).toBe(false);
    expect(reg.every((e) => e.recipient)).toBe(true);
  });
});
