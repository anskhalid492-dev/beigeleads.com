"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CATEGORIES, type CategoryId } from "@/lib/settings/registry";
import { SettingsError, saveCategory } from "@/lib/settings/service";

export type SaveResult = { ok: true; changed: number } | { ok: false; error: string; conflict?: boolean };

export async function saveSettingsAction(category: string, values: Record<string, string>, stamp: number): Promise<SaveResult> {
  try {
    const admin = await requireAdmin(); // Access + app login; blog editors are rejected
    if (!CATEGORIES.some((c) => c.id === category)) return { ok: false, error: "Unknown settings section." };
    const r = await saveCategory(getCloudflareContext().env, admin.email, category as CategoryId, values, Number(stamp) || 0);
    revalidatePath("/admin/settings", "layout");
    return { ok: true, changed: r.changed };
  } catch (e) {
    if (e instanceof SettingsError) return { ok: false, error: e.message, conflict: e.conflict };
    return { ok: false, error: "Could not save. Try again." };
  }
}

import { getDbFromEnv, schema } from "@/lib/db";
import { sendEmailDetailed } from "@/lib/forms/email";

export type TestResult = { ok: true; to: string } | { ok: false; error: string };

/**
 * Sends one test email to the signed-in admin's OWN address (never a typed address), at most 5 per hour,
 * and records the real result in the audit log.
 */
export async function sendTestEmailAction(): Promise<TestResult> {
  try {
    const admin = await requireAdmin();
    const env = getCloudflareContext().env;
    const key = `testmail:${admin.email}:${Math.floor(Date.now() / 3_600_000)}`;
    const n = Number((await env.CACHE.get(key)) ?? 0);
    if (n >= 5) return { ok: false, error: "Test email limit reached (5 per hour). Try again later." };
    await env.CACHE.put(key, String(n + 1), { expirationTtl: 3700 });
    const r = await sendEmailDetailed(env, { to: admin.email, subject: "[BeigeLeads] Test email", text: "This is a test email from Admin > Settings > Email & Notifications.\n\nIf you can read this, the email service accepted the message. Check that the sender name and reply-to look right." });
    await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: admin.email, category: "email", settingKey: "testEmail", oldValue: "", newValue: "to the admin's own address", result: r.ok ? "sent" : "failed" }).catch(() => {});
    return r.ok ? { ok: true, to: admin.email } : { ok: false, error: r.error ?? "The email was not accepted." };
  } catch { return { ok: false, error: "Could not send. Sign in again and retry." }; }
}

import { revalidatePath as rp } from "next/cache";
import { rememberCheck, runCheck, type CheckId, type CheckResult } from "@/lib/settings/health";
import { PUBLIC_CACHE_KEY } from "@/lib/settings/service";

const CHECK_IDS: CheckId[] = ["d1", "kv", "r2", "resend", "turnstile", "access"];

/** Runs one real connectivity check. Admin only, 30 per hour. Nothing secret is returned. */
export async function runCheckAction(id: string): Promise<CheckResult | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (!CHECK_IDS.includes(id as CheckId)) return { ok: false, error: "Unknown check." };
    const env = getCloudflareContext().env;
    const key = `healthrun:${admin.email}:${Math.floor(Date.now() / 3_600_000)}`;
    const n = Number((await env.CACHE.get(key)) ?? 0);
    if (n >= 30) return { ok: false, error: "Check limit reached (30 per hour)." };
    await env.CACHE.put(key, String(n + 1), { expirationTtl: 3700 });
    const r = await runCheck(env, id as CheckId);
    await rememberCheck(env, r);
    return r;
  } catch { return { ok: false, error: "Could not run the check. Sign in again." }; }
}

/** Safe maintenance: clears the settings caches and revalidates the sitemap and blog pages. Nothing is deleted. */
export async function refreshCachesAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    const env = getCloudflareContext().env;
    await Promise.all([env.CACHE.delete(PUBLIC_CACHE_KEY), env.CACHE.delete("settings:email:v1")]);
    rp("/sitemap.xml"); rp("/blog", "layout"); rp("/", "layout");
    await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: admin.email, category: "maintenance", settingKey: "refreshCaches", newValue: "settings caches cleared; sitemap and blog revalidated", result: "done" }).catch(() => {});
    return { ok: true };
  } catch { return { ok: false, error: "Could not refresh. Sign in again." }; }
}
