// Webhook follow-up, weekly summary and customer controls for Customer Success (CLAUDE.md section 173).
import { addOptout } from "@/lib/followups/tokens";
import { sendHistory } from "@/lib/system-emails/triggers";
import { notifyInternal } from "./engine";
import { lc } from "./data";

type Env = CloudflareEnv;
const log = (env: Env, customerId: number, kind: string, detail: string, actor: string) =>
  env.DB.prepare("INSERT INTO cs_events (customer_id, kind, detail, actor) VALUES (?, ?, ?, ?)").bind(customerId, kind, detail.slice(0, 300), actor.slice(0, 80)).run().catch(() => undefined);

/** A founder email bounced or was reported as spam: stop optional emails to that customer (complaint = unsubscribe everywhere). */
export async function onFounderProblem(env: Env, providerId: string, status: string): Promise<void> {
  try {
    const r = await env.DB.prepare("SELECT s.customer_id AS id, s.template_key AS k, c.email AS email FROM cs_scheduled s JOIN cs_customers c ON c.id = s.customer_id WHERE s.provider_id = ? LIMIT 1").bind(providerId).first<{ id: number; k: string; email: string }>();
    if (!r) return;
    if (status === "complained") { await addOptout(env, r.email); await env.DB.prepare("UPDATE cs_customers SET status = 'cancelled', paused_reason = 'spam complaint' WHERE id = ?").bind(r.id).run(); }
    else await env.DB.prepare("UPDATE cs_customers SET status = 'paused', paused_reason = ? WHERE id = ? AND status = 'active'").bind(`email ${status}`, r.id).run();
    await log(env, r.id, status, r.k, "webhook");
  } catch { /* the webhook must never fail because of this */ }
}

/** Customer controls. Every one is logged. Returns false when the customer does not exist. */
export async function setStatus(env: Env, id: number, to: "active" | "paused" | "cancelled", actor: string, reason = ""): Promise<boolean> {
  const r = await env.DB.prepare("UPDATE cs_customers SET status = ?, paused_reason = ? WHERE id = ?").bind(to, to === "active" ? "" : reason.slice(0, 120), id).run().catch(() => null);
  if (!r?.meta.changes) return false;
  if (to === "cancelled") await env.DB.prepare("UPDATE cs_scheduled SET status = 'cancelled', updated_at = unixepoch() WHERE customer_id = ? AND status = 'scheduled'").bind(id).run().catch(() => undefined);
  await log(env, id, to, reason, actor); return true;
}
/** A reply to a founder email, recorded by hand (no inbox sync exists). It pauses optional emails until an admin resumes them. */
export async function recordReply(env: Env, id: number, actor: string, tags: ("business" | "audience" | "goals")[], note: string): Promise<boolean> {
  const ok = await setStatus(env, id, "paused", actor, "customer replied: review before more emails");
  if (!ok) return false;
  await log(env, id, "reply", note, actor);
  for (const t of tags) await log(env, id, `shared:${t}`, "", actor);
  return true;
}
/** Skip one email for one customer (it will not be sent for that reference). */
export async function skipEmail(env: Env, id: number, key: string, reference: string, actor: string): Promise<boolean> {
  const r = await env.DB.prepare("INSERT INTO cs_scheduled (customer_id, template_key, reference, status, reason) VALUES (?, ?, ?, 'skipped', ?) ON CONFLICT(customer_id, template_key, reference) DO UPDATE SET status = 'skipped', reason = excluded.reason WHERE status IN ('scheduled','failed')").bind(id, key, reference || "-", `skipped by ${actor}`.slice(0, 100)).run().catch(() => null);
  if (r) await log(env, id, "skip", `${key} ${reference}`, actor);
  return !!r;
}
export async function setNote(env: Env, id: number, note: string, actor: string): Promise<boolean> {
  const r = await env.DB.prepare("UPDATE cs_customers SET note = ? WHERE id = ?").bind(note.slice(0, 1000), id).run().catch(() => null);
  if (r?.meta.changes) await log(env, id, "note", "updated", actor);
  return !!r?.meta.changes;
}
export async function setRecOverride(env: Env, id: number, slugs: string[], actor: string): Promise<boolean> {
  const r = await env.DB.prepare("UPDATE cs_customers SET rec_override_json = ? WHERE id = ?").bind(JSON.stringify(slugs.slice(0, 3)), id).run().catch(() => null);
  if (r?.meta.changes) await log(env, id, "recommendations", slugs.join(","), actor);
  return !!r?.meta.changes;
}

/** Monday 08:00-08:59 UTC: real counts of the last 7 days, once per ISO week (checked in the delivery log). */
export async function sendWeeklySummary(env: Env, now = new Date()): Promise<boolean> {
  if (now.getUTCDay() !== 1 || now.getUTCHours() !== 8) return false;
  const jan4 = new Date(Date.UTC(now.getUTCFullYear(), 0, 4)); const wk = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + ((jan4.getUTCDay() + 6) % 7) + 1) / 7);
  const ref = `${now.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
  if ((await sendHistory(env, "csi6_weekly_summary", ref)).sent) return false;
  const since = Math.floor(now.getTime() / 1000) - 7 * 86400;
  const n = async (sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).first<{ n: number }>().catch(() => null))?.n ?? 0;
  const sent = await n("SELECT COUNT(*) AS n FROM cs_scheduled WHERE status = 'sent' AND sent_at > ?", since);
  const failed = await n("SELECT COUNT(*) AS n FROM cs_scheduled WHERE status = 'failed' AND updated_at > ?", since);
  const fb = await n("SELECT COUNT(*) AS n FROM cs_feedback WHERE created_at > ?", since);
  const low = await n("SELECT COUNT(*) AS n FROM cs_feedback WHERE created_at > ? AND satisfaction <= 2", since);
  const help = await n("SELECT COUNT(*) AS n FROM cs_feedback WHERE wants_help = 1 AND status IN ('new','in_progress')");
  const bounced = await n("SELECT COUNT(*) AS n FROM email_delivery_logs WHERE template_key LIKE 'cs__\\_%' ESCAPE '\\' AND delivery_status IN ('bounced','complained') AND created_at > ?", since);
  return notifyInternal(env, "csi6_weekly_summary", ref, `Last 7 days. Founder emails sent: ${sent}. Failed: ${failed}. Bounced or reported: ${bounced}. Feedback received: ${fb} (low scores: ${low}). Open assistance requests: ${help}.`);
}
export { lc };
