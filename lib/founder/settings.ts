// Customer Success settings (CLAUDE.md section 173). One JSON value in system_settings key `cs.settings`. Default = everything OFF.
import { z } from "zod";

export const KEY = "cs.settings";
const sid = z.enum(["A", "B", "C"]);
export const csSchema = z.object({
  /** off = nothing runs. dry_run = the engine plans and records what it WOULD send, sends nothing. live = real sending. */
  mode: z.enum(["off", "dry_run", "live"]).default("off"),
  /** The founder confirmed each sender address exists and can send (Resend domain verified or confirmed by hand). */
  sendersConfirmed: z.object({ A: z.boolean(), B: z.boolean(), C: z.boolean() }).default({ A: false, B: false, C: false }),
  /** The founder confirmed hello@beigeleads.com is a monitored inbox. */
  replyInboxConfirmed: z.boolean().default(false),
  /** Founder approval, bound to the published version of each template (a later edit needs a new approval). */
  approved: z.record(z.string(), z.number().int().min(0)).default({}),
  /** Per-email switch. Default off. */
  enabled: z.record(z.string(), z.boolean()).default({}),
  delays: z.record(z.string(), z.number().int().min(0).max(24 * 400)).default({}),
  senderOverride: z.record(z.string(), sid).default({}),
  caps: z.object({
    firstWeekMax: z.number().int().min(0).max(5).default(2),
    perWeekMax: z.number().int().min(0).max(5).default(1),
    per30Max: z.number().int().min(0).max(12).default(4),
    minGapHours: z.number().int().min(0).max(24 * 14).default(72),
    reactivationMax: z.number().int().min(0).max(5).default(2),
  }).default({ firstWeekMax: 2, perWeekMax: 1, per30Max: 4, minGapHours: 72, reactivationMax: 2 }),
  /** Customers are never enrolled automatically unless the founder switches this on (past customers always need explicit approval). */
  autoEnrollNew: z.boolean().default(false),
  /** Orders paid before this time are "historical": they are never auto-enrolled. Set when autoEnrollNew is switched on. */
  enrollFrom: z.number().int().min(0).default(0),
  maxPerRun: z.number().int().min(1).max(100).default(20),
});
export type CsSettings = z.infer<typeof csSchema>;
export const DEFAULT_CS: CsSettings = csSchema.parse({});

export function parseCs(raw: string | null | undefined): CsSettings {
  try { const p = csSchema.safeParse(JSON.parse(raw ?? "{}")); return p.success ? p.data : DEFAULT_CS; } catch { return DEFAULT_CS; }
}
export async function loadCs(env: { DB: D1Database }): Promise<CsSettings> {
  try { return parseCs((await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(KEY).first<{ value: string }>())?.value); } catch { return DEFAULT_CS; }
}
export async function saveCs(env: { DB: D1Database }, actor: string, patch: Partial<CsSettings>, why: string): Promise<{ ok: true; settings: CsSettings } | { ok: false; error: string }> {
  const cur = await loadCs(env);
  const p = csSchema.safeParse({ ...cur, ...patch });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the values." };
  const nv = JSON.stringify(p.data);
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at").bind(KEY, nv, actor),
      env.DB.prepare("INSERT INTO settings_audit_log (actor, category, setting_key, old_value, new_value, result) VALUES (?, 'customer-success', ?, ?, ?, 'saved')").bind(actor, why.slice(0, 80), JSON.stringify(cur).slice(0, 1000), nv.slice(0, 1000)),
    ]);
  } catch { return { ok: false, error: "Could not save. Has migration 0052 been run?" }; }
  return { ok: true, settings: p.data };
}

/** Go-live gate: what is still missing before mode can become "live". Honest list, shown in the admin. */
export function goLiveBlockers(s: CsSettings, publishedVersions: Record<string, number>, enabledKeys: string[]): string[] {
  const out: string[] = [];
  const used = new Set<"A" | "B" | "C">();
  for (const k of enabledKeys) used.add((s.senderOverride[k] as "A" | "B" | "C") ?? "A");
  if (!enabledKeys.length) out.push("No email is switched on.");
  for (const id of ["A", "B", "C"] as const) if (used.has(id) && !s.sendersConfirmed[id]) out.push(`Sender ${id} is not confirmed.`);
  if (!s.replyInboxConfirmed) out.push("hello@beigeleads.com is not confirmed as a monitored inbox.");
  for (const k of enabledKeys) if (s.approved[k] !== publishedVersions[k]) out.push(`${k} has not been approved at its current version.`);
  return out;
}
