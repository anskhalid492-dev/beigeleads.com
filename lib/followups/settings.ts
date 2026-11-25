// Follow-up email settings (CLAUDE.md section 170). One JSON value in `system_settings` (key followups.settings). Everything defaults to OFF:
// the owner reviews the two templates in System Emails, then switches each follow-up on here. Never throws: failure = defaults (off).
import { z } from "zod";

export const followupSchema = z.object({
  reviewsOn: z.boolean(),
  reviewDays: z.number().int().min(1).max(60),
  sampleOn: z.boolean(),
  sampleDays: z.number().int().min(1).max(60),
  /** Show approved reviews publicly (only when at least minToShow exist). */
  showPublic: z.boolean(),
  minToShow: z.number().int().min(1).max(50),
});
export type FollowupSettings = z.infer<typeof followupSchema>;
export const DEFAULT_FOLLOWUPS: FollowupSettings = { reviewsOn: false, reviewDays: 5, sampleOn: false, sampleDays: 3, showPublic: true, minToShow: 3 };
const KEY = "followups.settings";

export function parseFollowups(raw: string | null | undefined): FollowupSettings {
  try { const p = followupSchema.safeParse({ ...DEFAULT_FOLLOWUPS, ...(raw ? JSON.parse(raw) : {}) }); return p.success ? p.data : DEFAULT_FOLLOWUPS; } catch { return DEFAULT_FOLLOWUPS; }
}
export async function loadFollowups(env: { DB: D1Database }): Promise<FollowupSettings> {
  try { const r = await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(KEY).first<{ value: string }>(); return parseFollowups(r?.value); } catch { return DEFAULT_FOLLOWUPS; }
}
export async function saveFollowups(env: { DB: D1Database }, actor: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = followupSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "A value is not valid." };
  const old = await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(KEY).first<{ value: string }>().catch(() => null);
  const value = JSON.stringify(p.data);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO system_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = unixepoch()").bind(KEY, value, actor),
    env.DB.prepare("INSERT INTO settings_audit_log (actor, category, setting_key, old_value, new_value, result) VALUES (?, 'followups', ?, ?, ?, 'saved')").bind(actor, KEY, old?.value ?? "", value),
  ]);
  return { ok: true };
}
