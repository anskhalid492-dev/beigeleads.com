"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv } from "@/lib/db";
import { checkKey, getDomain, type DomainDetail, type KeyCheck } from "@/lib/email/resend-api";
import { credentialStatus, rememberCheck, removeApiKey, resolveResend, saveApiKey, saveWebhookSecret } from "@/lib/email/credentials";
import { saveSenders, sendersSchema } from "@/lib/email/senders";
import { retryEmail } from "@/lib/email/admin";
import { sendEmailDetailed } from "@/lib/forms/email";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { setTemplateOff } from "@/lib/system-emails/enabled";

export type Res = { ok: boolean; message: string; data?: unknown };
const PATH = "/admin/settings/integrations/resend";
const audit = (env: CloudflareEnv, actor: string, key: string, newValue: string, result: string) =>
  env.DB.prepare("INSERT INTO settings_audit_log (actor, category, setting_key, old_value, new_value, result) VALUES (?, 'resend', ?, '', ?, ?)").bind(actor, key, newValue.slice(0, 200), result).run().catch(() => {});

async function limited(env: CloudflareEnv, actor: string, what: string, max: number): Promise<boolean> {
  const k = `resend:${what}:${actor}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = Number((await env.CACHE.get(k).catch(() => null)) ?? 0);
  if (n >= max) return true;
  await env.CACHE.put(k, String(n + 1), { expirationTtl: 3700 }).catch(() => {});
  return false;
}
async function safe<T extends Res>(f: () => Promise<T>): Promise<Res> {
  try { return await f(); } catch { return { ok: false, message: "Something went wrong. Sign in again and retry." }; }
}

/** Validates the new key with Resend, then saves it encrypted. The saved key changes only when the check passes. */
export async function saveKeyAction(raw: string): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    if (await limited(env, a.email, "key", 10)) return { ok: false, message: "Too many key changes this hour." };
    const r = await saveApiKey(env, a.email, raw);
    await audit(env, a.email, "apiKey", r.ok ? "replaced (value never logged)" : "refused", r.ok ? "saved" : "refused");
    revalidatePath(PATH);
    return r.ok ? { ok: true, message: r.check.state === "valid_sending_only" ? "Saved. Resend accepted the key (sending only)." : "Saved. Resend accepted the key." } : { ok: false, message: r.error };
  });
}
export async function removeKeyAction(): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    await removeApiKey(env); await audit(env, a.email, "apiKey", "admin key removed", "saved"); revalidatePath(PATH);
    return { ok: true, message: "The saved key was removed. The RESEND_API_KEY variable is used if set." };
  });
}
export async function testConnectionAction(): Promise<Res & { check?: KeyCheck }> {
  try {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    if (await limited(env, a.email, "test", 30)) return { ok: false, message: "Test limit reached (30 per hour)." };
    const c = await resolveResend(env);
    const check = await checkKey(c.key);
    await rememberCheck(env, check); revalidatePath(PATH);
    const ok = check.state === "valid_full" || check.state === "valid_sending_only";
    return { ok, message: check.detail, check: { ...check, domains: undefined } };
  } catch { return { ok: false, message: "Could not run the test. Sign in again." }; }
}
export async function saveWebhookSecretAction(raw: string): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    if (await limited(env, a.email, "hook", 10)) return { ok: false, message: "Too many changes this hour." };
    const r = await saveWebhookSecret(env, a.email, raw);
    await audit(env, a.email, "webhookSecret", r.ok ? "replaced (value never logged)" : "refused", r.ok ? "saved" : "refused");
    revalidatePath(PATH);
    return r.ok ? { ok: true, message: `Saved (${r.hint}).` } : { ok: false, message: r.error };
  });
}
export async function saveSendersAction(json: string): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    let input: unknown; try { input = JSON.parse(json); } catch { return { ok: false, message: "Bad form data." }; }
    if (!sendersSchema.safeParse(input).success) { /* saveSenders returns the readable message */ }
    const c = await resolveResend(env);
    const ck = await checkKey(c.key);
    const verified = ck.domains ? ck.domains.filter((d) => d.status === "verified").map((d) => d.name.toLowerCase()) : null;
    const r = await saveSenders(env, a.email, input, verified);
    revalidatePath(PATH);
    return r.ok ? { ok: true, message: "Sender settings saved. They apply to new emails within a minute." } : { ok: false, message: r.error };
  });
}
export async function refreshDomainAction(id: string): Promise<Res & { domain?: DomainDetail }> {
  try {
    await requireAdmin(); const env = getCloudflareContext().env;
    const c = await resolveResend(env);
    const r = await getDomain(c.key, id);
    return r.ok ? { ok: true, message: "Refreshed from Resend.", domain: r.domain } : { ok: false, message: r.error };
  } catch { return { ok: false, message: "Could not refresh." }; }
}
export async function sendTestEmailAction(to: string, subject: string, message: string): Promise<Res & { id?: string }> {
  try {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    const addr = to.trim().toLowerCase();
    if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(addr) || addr.length > 120) return { ok: false, message: "Enter one valid email address." };
    if (await limited(env, a.email, "testmail", 5)) return { ok: false, message: "Test email limit reached (5 per hour)." };
    const sub = (subject.trim() || "BeigeLeads — Resend Integration Test").slice(0, 150);
    const text = (message.trim() || "Your BeigeLeads email integration is working. This test email was sent from your admin dashboard.").slice(0, 1000);
    const r = await sendEmailDetailed(env, { to: addr, subject: `[TEST] ${sub}`, text, templateKey: "resend_test", reference: "admin-test", source: "test" });
    await audit(env, a.email, "testEmail", "to a typed address (not logged)", r.ok ? "sent" : "failed");
    revalidatePath(PATH);
    return r.ok ? { ok: true, message: "Resend accepted the email. That means it took the message, not that the inbox has it yet. Delivery status appears in Email Activity once the webhook reports it.", id: r.id } : { ok: false, message: r.error ?? "Not accepted." };
  } catch { return { ok: false, message: "Could not send. Sign in again." }; }
}
export async function retryAction(logId: number, reason: string): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    if (await limited(env, a.email, "retry", 20)) return { ok: false, message: "Retry limit reached (20 per hour)." };
    const r = await retryEmail(env, a.email, Number(logId), reason);
    revalidatePath(PATH);
    return r;
  });
}
export async function toggleEventAction(key: string, enabled: boolean): Promise<Res> {
  return safe(async () => {
    const a = await requireAdmin(); const env = getCloudflareContext().env;
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) return { ok: false, message: "Unknown email." };
    if (!t.canDisable) return { ok: false, message: "This email is essential and cannot be switched off." };
    await setTemplateOff(getDbFromEnv(env), a.email, key, !enabled);
    await audit(env, a.email, `event:${key}`, enabled ? "on" : "off", "saved");
    revalidatePath(PATH);
    return { ok: true, message: enabled ? "Switched on." : "Switched off." };
  });
}
export async function statusAction() { await requireAdmin(); return credentialStatus(getCloudflareContext().env); }
