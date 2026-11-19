// System Emails against a LOCAL D1: drafts, publishing, versions, fallbacks and real delivery logs.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { sendEmailDetailed, maskEmail } from "@/lib/forms/email";
import { systemMail } from "@/lib/system-emails/mail";
import { discardDraft, getEditable, listVersions, publish, restoreVersion, saveDraft } from "@/lib/system-emails/store";
import { getTemplate } from "@/lib/system-emails/defaults";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const fallback = { to: "a@b.co", subject: "legacy", text: "legacy text" };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "sysmail-e2e-")) } });
  env = { ...proxy.env, RESEND_API_KEY: "test-key" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(0[0-9]|1[0-9]|2[0-3])_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); vi.unstubAllGlobals(); });

describe("template storage", () => {
  const db = () => getDbFromEnv(env);
  const def = getTemplate("sample_request_received")!;
  it("starts as the built-in version", async () => {
    const t = await getEditable(db(), def.key);
    expect(t?.custom).toBe(false);
    expect(t?.version).toBe(0);
    expect(t?.published.subject).toBe(def.content.subject);
  });
  it("a draft never changes what is sent", async () => {
    await saveDraft(db(), "admin@x.co", def.key, { ...def.content, subject: "DRAFT {{first_name}} subject" });
    const t = await getEditable(db(), def.key);
    expect(t?.draft?.subject).toBe("DRAFT {{first_name}} subject");
    expect(t?.published.subject).toBe(def.content.subject);
    const m = await systemMail(db(), def.key, "a@b.co", { product_name: "Dentists" }, fallback);
    expect(m.subject).not.toContain("DRAFT");
    expect(m.templateKey).toBe(def.key);
    expect(m.html).toContain("<!doctype html>");
  });
  it("refuses to publish an invalid template and keeps production stable", async () => {
    await expect(publish(db(), "admin@x.co", def.key, { ...def.content, heading: "Hi {{nope}}" })).rejects.toThrow(/known variable/);
    expect((await getEditable(db(), def.key))?.version).toBe(0);
  });
  it("publishes numbered versions, clears the draft, and restores into a draft", async () => {
    const v1 = await publish(db(), "admin@x.co", def.key, { ...def.content, subject: "V1 {{product_name}}" }, "first");
    const v2 = await publish(db(), "admin@x.co", def.key, { ...def.content, subject: "V2 {{product_name}}" });
    expect([v1, v2]).toEqual([1, 2]);
    let t = await getEditable(db(), def.key);
    expect(t?.draft).toBeNull();
    expect(t?.published.subject).toBe("V2 {{product_name}}");
    expect((await systemMail(db(), def.key, "a@b.co", { product_name: "Dentists" }, fallback)).subject).toBe("V2 Dentists");
    await restoreVersion(db(), "admin@x.co", def.key, 1);
    t = await getEditable(db(), def.key);
    expect(t?.draft?.subject).toBe("V1 {{product_name}}");
    expect(t?.published.subject).toBe("V2 {{product_name}}");
    expect((await listVersions(db(), def.key)).map((v) => v.version)).toEqual([2, 1]);
    await restoreVersion(db(), "admin@x.co", def.key, 0);
    expect((await getEditable(db(), def.key))?.draft?.subject).toBe(def.content.subject);
    await discardDraft(db(), "admin@x.co", def.key);
    expect((await getEditable(db(), def.key))?.draft).toBeNull();
  });
  it("falls back to the existing text when a required value is missing", async () => {
    expect(await systemMail(db(), def.key, "a@b.co", {}, fallback)).toBe(fallback);
    expect(await systemMail(db(), "product_delivery", "a@b.co", { product_name: "X", download_url: "javascript:alert(1)" }, fallback)).toBe(fallback);
    expect(await systemMail(db(), "no_such_template", "a@b.co", {}, fallback)).toBe(fallback);
  });
});

describe("delivery logs", () => {
  it("records the real provider result, masked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "re_123" }), { status: 200 })));
    const ok = await sendEmailDetailed(env, { to: "alex@example.com", subject: "S", text: "t", html: "<p>t</p>", templateKey: "contact_received", reference: "CT-1" });
    expect(ok).toMatchObject({ ok: true, id: "re_123" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 })));
    const bad = await sendEmailDetailed(env, { to: "alex@example.com", subject: "S2", text: "t", templateKey: "contact_received", source: "test" });
    expect(bad.ok).toBe(false);
    const rows = (await env.DB.prepare("SELECT * FROM email_delivery_logs ORDER BY id").all()).results as Record<string, string>[];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ status: "sent", provider_id: "re_123", recipient: "a***@example.com", reference: "CT-1", source: "live" });
    expect(rows[1]).toMatchObject({ status: "failed", source: "test" });
    expect(rows[1].error).toContain("domain not verified");
    expect(JSON.stringify(rows)).not.toContain("alex@");
    expect(JSON.stringify(rows)).not.toContain("test-key");
  });
  it("does not log plain sends and sends html to Resend", async () => {
    const f = vi.fn(async (_u: unknown, init?: RequestInit) => { void init; return new Response("{}", { status: 200 }); });
    vi.stubGlobal("fetch", f);
    await sendEmailDetailed(env, { to: "a@b.co", subject: "x", text: "t" });
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM email_delivery_logs").first<{ n: number }>())?.n).toBe(2);
    await sendEmailDetailed(env, { to: "a@b.co", subject: "x", text: "t", html: "<b>h</b>" });
    const body = JSON.parse(String(f.mock.calls[1][1]?.body));
    expect(body.html).toBe("<b>h</b>");
    expect(body.text).toBe("t");
  });
  it("masks addresses", () => { expect(maskEmail("alex@example.com")).toBe("a***@example.com"); });
});

describe("copies and branding", () => {
  const db = () => getDbFromEnv(env);
  it("duplicates into an editable, never-connected copy and deletes it", async () => {
    const { duplicateTemplate, deleteCopy, listEditable } = await import("@/lib/system-emails/store");
    const key = await duplicateTemplate(db(), "admin@x.co", "contact_received", "My contact copy");
    expect(key).toMatch(/^custom_/);
    const t = await getEditable(db(), key);
    expect(t?.copy).toBe(true);
    expect(t?.def.connection).toBe("not_connected");
    expect(t?.def.required).toEqual([]);
    expect(t?.def.name).toBe("My contact copy");
    expect(t?.draft?.subject).toContain("received your message");
    await saveDraft(db(), "admin@x.co", key, { ...t!.draft!, subject: "Copy subject" });
    expect((await publish(db(), "admin@x.co", key, { ...t!.draft!, subject: "Copy subject" }))).toBe(1);
    expect((await listEditable(db())).get(key)?.published.subject).toBe("Copy subject");
    // the original is untouched and still the live contact email
    expect((await getEditable(db(), "contact_received"))?.version).toBe(0);
    await expect(deleteCopy(db(), "contact_received")).rejects.toThrow(/own copies/);
    await deleteCopy(db(), key);
    expect(await getEditable(db(), key)).toBeNull();
  });
  it("saves branding and uses it in sent emails", async () => {
    const { saveBranding, getBranding, DEFAULT_BRANDING } = await import("@/lib/system-emails/branding");
    expect(await getBranding(db())).toEqual(DEFAULT_BRANDING);
    await expect(saveBranding(db(), "a@x.co", { ...DEFAULT_BRANDING, supportEmail: "bad" })).rejects.toThrow();
    await saveBranding(db(), "a@x.co", { ...DEFAULT_BRANDING, supportEmail: "help@example.com", footerNote: "Hello footer" });
    const m = await systemMail(db(), "contact_received", "a@b.co", { request_reference: "CT-1" }, fallback);
    expect(m.html).toContain("Hello footer");
    expect(m.html).toContain("help@example.com");
  });
});
