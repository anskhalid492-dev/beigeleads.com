import { eq } from "drizzle-orm";
import { schema, getDbFromEnv } from "@/lib/db";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { listOff } from "@/lib/system-emails/enabled";
import { sendEmail } from "@/lib/forms/email";
import { sendCreatorConfirmation } from "@/lib/creators/submit";
import { sendContactConfirmation } from "@/lib/contact/submit";
import { deliverOrder } from "@/lib/delivery/deliver";
import { categoryOf, SENDER_CATEGORIES } from "./senders";

type Env = CloudflareEnv;

/* ---------- Event registry (real data: the template list + the delivery log) ---------- */
export type EventRow = { key: string; name: string; description: string; recipient: string; group: string; connected: boolean; canDisable: boolean; enabled: boolean; lastAt: number | null; lastResult: string; count30: number };
export async function eventRegistry(env: Env): Promise<EventRow[]> {
  const off = await listOff(getDbFromEnv(env));
  let last = new Map<string, { at: number; status: string; ds: string; n: number }>();
  try {
    const rs = await env.DB.prepare(`SELECT l.template_key AS k, l.created_at AS at, l.status AS status, l.delivery_status AS ds,
      (SELECT COUNT(*) FROM email_delivery_logs x WHERE x.template_key = l.template_key AND x.source = 'live' AND x.created_at > unixepoch() - 2592000) AS n
      FROM email_delivery_logs l WHERE l.source = 'live' AND l.id = (SELECT MAX(id) FROM email_delivery_logs y WHERE y.template_key = l.template_key AND y.source = 'live')`).all<{ k: string; at: number; status: string; ds: string; n: number }>();
    last = new Map(rs.results.map((r) => [r.k, r]));
  } catch { /* log table missing */ }
  return TEMPLATES.map((t) => {
    const l = last.get(t.key);
    const group = SENDER_CATEGORIES.find((c) => c.id === categoryOf(t.key))?.label ?? "";
    return { key: t.key, name: t.name, description: t.event, recipient: t.audience === "admin" ? "Team (you)" : "Customer", group, connected: t.connection === "connected", canDisable: !!t.canDisable, enabled: !off.has(t.key), lastAt: l?.at ?? null, lastResult: l ? (l.ds || (l.status === "sent" ? "sent" : "failed")) : "", count30: l?.n ?? 0 };
  });
}

/* ---------- Usage (local statistics only) ---------- */
export type Usage = { ready: boolean; acceptedToday: number; deliveredToday: number; sentMonth: number; failed30: number; bounced30: number; complained30: number; delivered30: number; accepted30: number; rate: number | null };
export async function usage(env: Env): Promise<Usage> {
  const z: Usage = { ready: false, acceptedToday: 0, deliveredToday: 0, sentMonth: 0, failed30: 0, bounced30: 0, complained30: 0, delivered30: 0, accepted30: 0, rate: null };
  try {
    const r = await env.DB.prepare(`SELECT
      SUM(CASE WHEN status='sent' AND created_at >= unixepoch('now','start of day') THEN 1 ELSE 0 END) AS accT,
      SUM(CASE WHEN delivery_status='delivered' AND created_at >= unixepoch('now','start of day') THEN 1 ELSE 0 END) AS delT,
      SUM(CASE WHEN status='sent' AND created_at >= unixepoch('now','start of month') THEN 1 ELSE 0 END) AS mon,
      SUM(CASE WHEN (status='failed' OR delivery_status='failed') AND created_at > unixepoch() - 2592000 THEN 1 ELSE 0 END) AS fail,
      SUM(CASE WHEN delivery_status='bounced' AND created_at > unixepoch() - 2592000 THEN 1 ELSE 0 END) AS bnc,
      SUM(CASE WHEN delivery_status='complained' AND created_at > unixepoch() - 2592000 THEN 1 ELSE 0 END) AS cmp,
      SUM(CASE WHEN delivery_status='delivered' AND created_at > unixepoch() - 2592000 THEN 1 ELSE 0 END) AS del,
      SUM(CASE WHEN status='sent' AND created_at > unixepoch() - 2592000 THEN 1 ELSE 0 END) AS acc
      FROM email_delivery_logs WHERE source='live'`).first<Record<string, number | null>>();
    const n = (k: string) => Number(r?.[k] ?? 0);
    const u: Usage = { ready: true, acceptedToday: n("accT"), deliveredToday: n("delT"), sentMonth: n("mon"), failed30: n("fail"), bounced30: n("bnc"), complained30: n("cmp"), delivered30: n("del"), accepted30: n("acc"), rate: null };
    const tracked = u.delivered30 + u.bounced30 + u.complained30;
    u.rate = tracked > 0 ? Math.round((u.delivered30 / tracked) * 1000) / 10 : null;
    return u;
  } catch { return z; }
}

/* ---------- Activity ---------- */
export type LogRow = { id: number; template_key: string; source: string; recipient: string; subject: string; reference: string; status: string; provider_id: string; error: string; created_at: number; delivery_status?: string; delivery_detail?: string; status_at?: number | null };
export type ActivityFilter = { q?: string; event?: string; status?: string; from?: string; to?: string; page?: number };
export const ACTIVITY_PAGE = 25;
const STATUS_SQL: Record<string, string> = {
  accepted: "status='sent' AND delivery_status=''", sent: "delivery_status='sent'", delivered: "delivery_status='delivered'", delayed: "delivery_status='delivery_delayed'",
  bounced: "delivery_status='bounced'", complained: "delivery_status='complained'", failed: "(status='failed' OR delivery_status='failed')",
};
export const ACTIVITY_STATUSES = Object.keys(STATUS_SQL);
export async function activity(env: Env, f: ActivityFilter): Promise<{ rows: LogRow[]; total: number }> {
  const where: string[] = ["source IN ('live','test')"], args: (string | number)[] = [];
  if (f.q) { where.push("(recipient LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' OR reference LIKE ? ESCAPE '\\' OR provider_id LIKE ? ESCAPE '\\')"); const p = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`).slice(0, 60)}%`; args.push(p, p, p, p); }
  if (f.event && TEMPLATES.some((t) => t.key === f.event)) { where.push("template_key = ?"); args.push(f.event); }
  if (f.status && STATUS_SQL[f.status]) where.push(STATUS_SQL[f.status]!);
  const ts = (d?: string, end = false) => { const m = /^\d{4}-\d{2}-\d{2}$/.test(d ?? "") ? Date.parse(`${d}T00:00:00Z`) / 1000 + (end ? 86400 : 0) : null; return m; };
  const a = ts(f.from), b = ts(f.to, true);
  if (a) { where.push("created_at >= ?"); args.push(a); }
  if (b) { where.push("created_at < ?"); args.push(b); }
  const w = where.join(" AND "), page = Math.max(1, f.page ?? 1);
  try {
    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM email_delivery_logs WHERE ${w}`).bind(...args).first<{ n: number }>())?.n ?? 0;
    const rows = (await env.DB.prepare(`SELECT * FROM email_delivery_logs WHERE ${w} ORDER BY id DESC LIMIT ${ACTIVITY_PAGE} OFFSET ${(page - 1) * ACTIVITY_PAGE}`).bind(...args).all<LogRow>()).results;
    return { rows, total };
  } catch { return { rows: [], total: 0 }; }
}

/* ---------- Retry ---------- */
export const MAX_RETRIES = 3;
const RETRYABLE: Record<string, string> = { creator_inquiry_received: "creator confirmation", contact_received: "contact confirmation", product_delivery: "database delivery" };
export type RetryState = { allowed: boolean; reason: string; tries: number };

/** Pure-ish: decides from the log row + history whether a retry is allowed. Never retries permanent problems. */
export async function retryState(env: Env, log: LogRow): Promise<RetryState> {
  const tries = (await env.DB.prepare("SELECT COUNT(*) AS n FROM email_retry_log WHERE log_id = ?").bind(log.id).first<{ n: number }>().catch(() => ({ n: 0 })))?.n ?? 0;
  const no = (reason: string): RetryState => ({ allowed: false, reason, tries });
  if (log.source !== "live") return no("Test emails are not retried.");
  if (["bounced", "complained"].includes(log.delivery_status ?? "")) return no("This address bounced or marked the email as spam. It is never retried automatically.");
  const failed = log.status === "failed" || log.delivery_status === "failed";
  if (!failed) return no("Only emails that failed can be retried.");
  if (!RETRYABLE[log.template_key]) return no("This email has no safe retry here. Use the screen of the request or order it belongs to.");
  if (!log.reference) return no("No reference is stored for this email, so the original cannot be identified.");
  if (tries >= MAX_RETRIES) return no(`Already retried ${MAX_RETRIES} times.`);
  const later = await env.DB.prepare("SELECT COUNT(*) AS n FROM email_delivery_logs WHERE template_key = ? AND reference = ? AND status = 'sent' AND source = 'live' AND id > ?").bind(log.template_key, log.reference, log.id).first<{ n: number }>();
  if ((later?.n ?? 0) > 0) return no("A later attempt for the same item was already accepted by Resend.");
  return { allowed: true, reason: "", tries };
}

export async function retryEmail(env: Env, actor: string, logId: number, reason: string): Promise<{ ok: boolean; message: string }> {
  const why = reason.trim().slice(0, 200);
  if (why.length < 3) return { ok: false, message: "Give a short reason for the retry." };
  const log = await env.DB.prepare("SELECT * FROM email_delivery_logs WHERE id = ?").bind(logId).first<LogRow>().catch(() => null);
  if (!log) return { ok: false, message: "Email not found." };
  const st = await retryState(env, log);
  if (!st.allowed) return { ok: false, message: st.reason };
  // Claim one attempt first so a double click cannot start two.
  const claim = await env.DB.prepare("INSERT INTO email_retry_log (log_id, template_key, reference, reason, actor, result) SELECT ?, ?, ?, ?, ?, 'started' WHERE (SELECT COUNT(*) FROM email_retry_log WHERE log_id = ? AND result = 'started' AND created_at > unixepoch() - 60) = 0").bind(log.id, log.template_key, log.reference, why, actor, log.id).run();
  if (!claim.meta.changes) return { ok: false, message: "A retry for this email was just started. Wait a minute." };
  const rid = claim.meta.last_row_id;
  let result = "failed", detail = "";
  try {
    const db = getDbFromEnv(env);
    const send = (m: Parameters<typeof sendEmail>[1]) => sendEmail(env, m);
    if (log.template_key === "creator_inquiry_received") {
      const row = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.reference, log.reference)).limit(1))[0];
      if (!row) detail = "The inquiry no longer exists."; else { const s = await sendCreatorConfirmation(db, env, send, row); result = s === "sent" ? "sent" : "failed"; detail = s; }
    } else if (log.template_key === "contact_received") {
      const row = await db.query.contactInquiries.findFirst({ where: (t, { eq: e }) => e(t.reference, log.reference) });
      if (!row) detail = "The inquiry no longer exists."; else { const s = await sendContactConfirmation(db, env, send, row); result = s === "sent" ? "sent" : "failed"; detail = s; }
    } else if (log.template_key === "product_delivery") {
      // deliverOrder is itself idempotent: it never sends twice and never touches payment.
      const r = await deliverOrder(env, log.reference);
      result = r === "sent" || r === "already-sent" ? "sent" : "failed"; detail = r;
    }
  } catch (e) { detail = e instanceof Error ? e.message.slice(0, 120) : "error"; }
  await env.DB.prepare("UPDATE email_retry_log SET result = ?, detail = ? WHERE id = ?").bind(result, detail.slice(0, 200), rid).run();
  await env.DB.prepare("INSERT INTO settings_audit_log (actor, category, setting_key, old_value, new_value, result) VALUES (?, 'resend', 'retry', ?, ?, ?)").bind(actor, `${log.template_key}:${log.reference}`, why, result).run().catch(() => {});
  return { ok: result === "sent", message: result === "sent" ? "Resend accepted the email again." : `The retry did not succeed (${detail || "no detail"}).` };
}
export async function retryHistory(env: Env, logId: number): Promise<{ reason: string; actor: string; result: string; detail: string; created_at: number }[]> {
  try { return (await env.DB.prepare("SELECT reason, actor, result, detail, created_at FROM email_retry_log WHERE log_id = ? ORDER BY id DESC").bind(logId).all<{ reason: string; actor: string; result: string; detail: string; created_at: number }>()).results; } catch { return []; }
}
export const isFresh = (t: number | null, days = 30) => t !== null && Date.now() / 1000 - t < days * 86400;
