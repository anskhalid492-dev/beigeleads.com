// Email Verification service: orders, files (private R2), manual processing, emails, reminders, retention.
// Verification is done BY HAND by the BeigeLeads team: nothing here verifies an address or marks a job Completed by itself.
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { sendEmailDetailed } from "@/lib/forms/email";
import { systemMail } from "@/lib/system-emails/mail";
import { sendOnce } from "@/lib/system-emails/triggers";
import { analyze, detectFormat, XLSX_MAX_BYTES, type Format } from "./analyze";
import { MB, loadEvSettings, type EvSettings } from "./settings";
import { LABEL, canMove, canUpload, isStatus, type EvStatus } from "./state";
import { evToken, evTokenHash } from "./token";

export const SITE = "https://beigeleads.com";
export type EvRow = typeof schema.evOrders.$inferSelect;
export type EvFile = typeof schema.evFiles.$inferSelect;
type Db = ReturnType<typeof getDbFromEnv>;
const now = () => Math.floor(Date.now() / 1000);
const DAY = 86400;

export const submitUrl = (t: string) => `${SITE}/email-list-verification/submit/${t}`;
export const statusUrl = (t: string) => `${SITE}/email-list-verification/order/${t}`;
export const adminUrl = (id: string) => `${SITE}/admin/email-verification/${id}`;
export const originalKey = (evId: string, fileId: string) => `email-verification/orders/${evId}/original/${fileId}`;
export const resultKey = (evId: string, fileId: string) => `email-verification/orders/${evId}/results/${fileId}`;
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function newEvId(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8));
  return `EV-${[...r].map((x) => a[x % a.length]).join("")}`;
}

/** Row to insert together with the BeigeLeads order (same D1 batch). The token is derived, only its hash is stored. */
export async function evInsertRow(env: CloudflareEnv, orderId: string, email: string, pkg: { name: string; limit: number; priceCents: number }) {
  const id = newEvId();
  return { id, orderId, email, packageName: pkg.name, limitCount: pkg.limit, priceCents: pkg.priceCents, status: "awaiting_payment", tokenHash: await evTokenHash(await evToken(env, id)) } as const;
}

export async function log(db: Db, id: string, actor: string, action: string, detail = "") {
  await db.insert(schema.evEvents).values({ evOrderId: id, actor, action, detail: detail.slice(0, 500) }).catch(() => undefined);
}
export const getEv = async (db: Db, id: string) => (await db.select().from(schema.evOrders).where(eq(schema.evOrders.id, id)))[0] ?? null;
export const getEvByOrder = async (db: Db, orderId: string) => (await db.select().from(schema.evOrders).where(eq(schema.evOrders.orderId, orderId)))[0] ?? null;
export async function getEvByToken(env: CloudflareEnv, token: string): Promise<EvRow | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  try { return (await getDbFromEnv(env).select().from(schema.evOrders).where(eq(schema.evOrders.tokenHash, await evTokenHash(token))))[0] ?? null; } catch { return null; }
}
export const filesOf = (db: Db, id: string) => db.select().from(schema.evFiles).where(eq(schema.evFiles.evOrderId, id)).orderBy(schema.evFiles.createdAt);
export const acceptedTotal = (files: EvFile[]) => files.filter((f) => f.kind === "original" && f.state === "accepted").reduce((n, f) => n + f.entryCount, 0);

// ------------------------------------------------------------------------------------------------ emails

async function mailVars(env: CloudflareEnv, ev: EvRow, files?: EvFile[]) {
  const token = await evToken(env, ev.id);
  const sub = files ? acceptedTotal(files) : ev.submittedCount;
  return { order_number: ev.id, package_name: ev.packageName, order_total: usd(ev.priceCents), max_emails: ev.limitCount.toLocaleString("en-US"), submitted_count: sub.toLocaleString("en-US"), submit_url: submitUrl(token), status_url: statusUrl(token), results_url: statusUrl(token), customer_email: ev.email, admin_url: adminUrl(ev.id), payment_status: ev.paidAt ? "Confirmed" : "Not confirmed" };
}
const settle = (r: string) => r === "sent" || r === "already-sent";
const supportTo = (env: CloudflareEnv, s: EvSettings) => s.supportEmail || env.NOTIFY_EMAIL || "";

/** Sends one template once per reference (idempotent, retried by the next event). Never throws. */
export async function sendEv(env: CloudflareEnv, ev: EvRow, key: string, reference: string, extra: Record<string, string> = {}, files?: EvFile[]): Promise<string> {
  try {
    const db = getDbFromEnv(env);
    const s = await loadEvSettings(env);
    const to = key === "ev_admin_new_order" ? supportTo(env, s) : ev.email;
    if (!to) return "skipped";
    return await sendOnce(env, db, key, to, { ...(await mailVars(env, ev, files)), ...extra }, reference);
  } catch { return "failed"; }
}

/** Admin "resend": always sends again (new reference), only to the order's own email. */
export async function resendEv(env: CloudflareEnv, id: string, kind: "payment" | "received" | "processing" | "results" | "reminder", actor: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const db = getDbFromEnv(env);
  const ev = await getEv(db, id);
  if (!ev) return { ok: false, error: "Order not found." };
  const map = { payment: "ev_payment_confirmed", received: "ev_file_received", processing: "ev_processing", results: "ev_results_ready", reminder: "ev_submit_reminder" } as const;
  if (kind === "results" && !(ev.status === "completed" || ev.status === "delivered")) return { ok: false, error: "Results are not ready, so no results email can be sent." };
  if ((kind === "payment" || kind === "reminder") && !ev.paidAt) return { ok: false, error: "The order is not paid." };
  const files = await filesOf(db, id);
  if (kind === "results" && !files.some((f) => f.kind === "result" && f.state === "accepted")) return { ok: false, error: "No result file is uploaded." };
  const mail = await systemMail(db, map[kind], ev.email, await mailVars(env, ev, files), { to: ev.email, subject: "", text: "" }, { reference: `${id}:resend:${Date.now()}` });
  if (!mail.templateKey) return { ok: false, error: "The email template could not be rendered. Check it in System Emails." };
  const r = await sendEmailDetailed(env, mail);
  await log(db, id, actor, "email_resent", map[kind] + (r.ok ? "" : " (failed)"));
  return r.ok ? { ok: true, message: "Email sent." } : { ok: false, error: "The email service did not accept the email." };
}

// ------------------------------------------------------------------------------------------------ payment

/** Called when a BeigeLeads order is paid (and by the cron as a safety net). Idempotent: only the first call moves the row. */
export async function fulfillOnPaid(env: CloudflareEnv, orderId: string): Promise<boolean> {
  try {
    const db = getDbFromEnv(env);
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId));
    if (o?.status !== "paid") return false;
    const moved = await db.update(schema.evOrders).set({ status: "awaiting_file", paidAt: now() }).where(and(eq(schema.evOrders.orderId, orderId), eq(schema.evOrders.status, "awaiting_payment"))).returning();
    const ev = moved[0] ?? (await getEvByOrder(db, orderId));
    if (!ev) return false;
    if (moved[0]) await log(db, ev.id, "system", "paid", "Payment confirmed");
    if (ev.status === "awaiting_file" || moved[0]) await sendEv(env, ev, "ev_payment_confirmed", `${ev.id}:paid`);
    return !!moved[0];
  } catch { return false; }
}

// ------------------------------------------------------------------------------------------------ customer upload

export type Gate = { ok: true; ev: EvRow } | { ok: false; status: number; error: string };
/** Everything the upload endpoints require: a valid token, a CONFIRMED payment, an open state, a link that has not expired. */
export async function authorizeUpload(env: CloudflareEnv, token: string): Promise<Gate> {
  const ev = await getEvByToken(env, token);
  if (!ev) return { ok: false, status: 404, error: "This link is not valid." };
  if (!ev.paidAt || ev.status === "awaiting_payment") return { ok: false, status: 402, error: "Payment is not confirmed yet. You can submit your list as soon as it is." };
  const s = await loadEvSettings(env);
  if (ev.paidAt + s.submitLinkDays * DAY < now()) return { ok: false, status: 410, error: "This submission link has expired. Contact support and quote your order number." };
  if (!isStatus(ev.status) || !canUpload(ev.status)) return { ok: false, status: 409, error: ev.status === "cancelled" || ev.status === "refunded" ? "This order is closed." : "Your list is already being processed. Contact support if you need to change it." };
  return { ok: true, ev };
}

/** True when the submission link is older than the configured validity. */
export const linkExpired = (ev: EvRow, s: EvSettings) => !!ev.paidAt && ev.paidAt + s.submitLinkDays * DAY < now();

export const maxUploadBytes = (s: EvSettings, format: Format) => Math.min(s.maxUploadMb * MB, format === "xlsx" ? XLSX_MAX_BYTES : Infinity);

/** Reads the first bytes of the stored object and checks them against the file name. */
export async function startUpload(env: CloudflareEnv, ev: EvRow, o: { filename: string; source: "upload" | "paste"; size: number; head: Uint8Array }): Promise<{ ok: true; fileId: string; key: string; format: Format } | { ok: false; status: number; error: string }> {
  const s = await loadEvSettings(env);
  const f = detectFormat(o.filename, o.head);
  if ("error" in f) return { ok: false, status: 415, error: f.error };
  if (!s.formats.includes(f.format)) return { ok: false, status: 415, error: `${f.format.toUpperCase()} files are not accepted right now.` };
  if (o.size <= 0) return { ok: false, status: 400, error: "The file is empty." };
  const max = maxUploadBytes(s, f.format);
  if (o.size > max) return { ok: false, status: 413, error: f.format === "xlsx" && max < s.maxUploadMb * MB ? "Spreadsheets can be up to 50 MB. Save the list as .csv or .txt for larger files." : `The file is too large. The maximum is ${s.maxUploadMb} MB.` };
  const fileId = crypto.randomUUID();
  const key = originalKey(ev.id, fileId);
  await getDbFromEnv(env).insert(schema.evFiles).values({ id: fileId, evOrderId: ev.id, kind: "original", state: "pending", r2Key: key, filename: o.filename.replace(/[^\w .()@+-]/g, "_").slice(0, 120), sizeBytes: o.size, format: f.format, source: o.source });
  return { ok: true, fileId, key, format: f.format };
}

export type Finalize =
  | { ok: true; count: number; total: number; limit: number; notes: string[]; status: EvStatus }
  | { ok: false; needColumn: { index: number; label: string; example: string }[]; fileId: string }
  | { ok: false; error: string; over?: { allowed: number; submitted: number; remaining: number } };

/** Counts the stored file, enforces the package limit (all accepted files together, duplicates included) and accepts or rejects it. */
export async function finalizeFile(env: CloudflareEnv, ev0: EvRow, fileId: string, column?: number): Promise<Finalize> {
  const db = getDbFromEnv(env);
  const [file] = await db.select().from(schema.evFiles).where(and(eq(schema.evFiles.id, fileId), eq(schema.evFiles.evOrderId, ev0.id)));
  if (!file || file.kind !== "original" || (file.state !== "pending" && file.state !== "needs_column")) return { ok: false, error: "This upload was not found." };
  const reject = async (error: string, over?: { allowed: number; submitted: number; remaining: number }): Promise<Finalize> => {
    await env.LISTS.delete(file.r2Key).catch(() => undefined);
    await db.update(schema.evFiles).set({ state: "rejected", deletedAt: now() }).where(eq(schema.evFiles.id, fileId));
    await log(db, ev0.id, "customer", "file_rejected", error);
    return { ok: false, error, over };
  };
  const stored = await env.LISTS.head(file.r2Key);
  if (!stored) return { ok: false, error: "The upload did not finish. Please try again." };
  const s = await loadEvSettings(env);
  if (stored.size > maxUploadBytes(s, file.format as Format)) return reject(`The file is too large. The maximum is ${s.maxUploadMb} MB.`);
  const a = await analyze(async () => { const o = await env.LISTS.get(file.r2Key); if (!o) throw new Error("gone"); return o.body; }, file.format as Format, { column });
  if (!a.ok && "needColumn" in a) {
    await db.update(schema.evFiles).set({ state: "needs_column", candidatesJson: JSON.stringify(a.needColumn) }).where(eq(schema.evFiles.id, fileId));
    return { ok: false, needColumn: a.needColumn, fileId };
  }
  if (!a.ok) return reject(a.error);
  const ev = (await getEv(db, ev0.id)) ?? ev0;
  if (!isStatus(ev.status) || !canUpload(ev.status)) return reject("Your list is already being processed. Contact support if you need to change it.");
  const all = await filesOf(db, ev.id);
  const replacing = ev.status === "needs_action";
  const others = replacing ? 0 : acceptedTotal(all.filter((f) => f.id !== fileId));
  if (others + a.count > ev.limitCount) {
    const remaining = Math.max(0, ev.limitCount - others);
    return reject(
      others > 0
        ? `This file has ${a.count.toLocaleString("en-US")} emails, but only ${remaining.toLocaleString("en-US")} of your ${ev.limitCount.toLocaleString("en-US")} remain (all files together count toward the package).`
        : `This file has ${a.count.toLocaleString("en-US")} emails. Your ${ev.packageName} package covers up to ${ev.limitCount.toLocaleString("en-US")}. Nothing was truncated; upload a smaller list, or contact us to upgrade.`,
      { allowed: ev.limitCount, submitted: a.count, remaining });
  }
  await db.update(schema.evFiles).set({ state: "accepted", entryCount: a.count, columnLabel: a.columnLabel, candidatesJson: "" }).where(eq(schema.evFiles.id, fileId));
  if (replacing) await db.update(schema.evFiles).set({ state: "replaced" }).where(and(eq(schema.evFiles.evOrderId, ev.id), eq(schema.evFiles.kind, "original"), eq(schema.evFiles.state, "accepted"), sql`${schema.evFiles.id} <> ${fileId}`));
  // Two uploads at the same moment: if together they now exceed the limit, the one that finished last is undone.
  const total = acceptedTotal(await filesOf(db, ev.id));
  if (total > ev.limitCount) {
    await db.update(schema.evFiles).set({ state: "rejected", deletedAt: now() }).where(eq(schema.evFiles.id, fileId));
    await env.LISTS.delete(file.r2Key).catch(() => undefined);
    return { ok: false, error: "The combined count of your files is above your package limit.", over: { allowed: ev.limitCount, submitted: a.count, remaining: Math.max(0, ev.limitCount - (total - a.count)) } };
  }
  const to: EvStatus = "file_submitted";
  await db.update(schema.evOrders).set({ submittedCount: total, status: to, submittedAt: ev.submittedAt ?? now(), actionReason: "" }).where(and(eq(schema.evOrders.id, ev.id), inArray(schema.evOrders.status, ["awaiting_file", "file_submitted", "needs_action"])));
  await log(db, ev.id, "customer", "file_accepted", `${file.format}, ${a.count} entries`);
  const fresh = (await getEv(db, ev.id)) ?? ev;
  await sendEv(env, fresh, "ev_file_received", `${ev.id}:file:${fileId}`, {}, await filesOf(db, ev.id));
  await sendEv(env, fresh, "ev_admin_new_order", `${ev.id}:admin:${fileId}`, {}, await filesOf(db, ev.id));
  return { ok: true, count: a.count, total, limit: ev.limitCount, notes: a.notes, status: to };
}

export async function discardPending(env: CloudflareEnv, evId: string, fileId: string) {
  const db = getDbFromEnv(env);
  const [f] = await db.select().from(schema.evFiles).where(and(eq(schema.evFiles.id, fileId), eq(schema.evFiles.evOrderId, evId)));
  if (!f || (f.state !== "pending" && f.state !== "needs_column")) return;
  await env.LISTS.delete(f.r2Key).catch(() => undefined);
  await db.update(schema.evFiles).set({ state: "rejected", deletedAt: now() }).where(eq(schema.evFiles.id, fileId));
}

// ------------------------------------------------------------------------------------------------ admin processing

export type Res = { ok: true; message: string } | { ok: false; error: string };
export async function adminSetStatus(env: CloudflareEnv, id: string, to: EvStatus, actor: string, opts: { reason?: string } = {}): Promise<Res> {
  const db = getDbFromEnv(env);
  const ev = await getEv(db, id);
  if (!ev) return { ok: false, error: "Order not found." };
  if (!isStatus(ev.status) || !canMove(ev.status, to)) return { ok: false, error: `An order that is ${LABEL[ev.status as EvStatus] ?? ev.status} cannot be set to ${LABEL[to]}.` };
  const files = await filesOf(db, id);
  if (to === "completed" && !files.some((f) => f.kind === "result" && f.state === "accepted")) return { ok: false, error: "Upload at least one result file before completing the job." };
  if (to === "processing" && acceptedTotal(files) === 0) return { ok: false, error: "No file was accepted for this order." };
  const reason = (opts.reason ?? "").trim().slice(0, 400);
  if (to === "needs_action" && reason.length < 5) return { ok: false, error: "Write what the customer needs to do (it is emailed to them)." };
  const set: Partial<typeof schema.evOrders.$inferInsert> = { status: to };
  if (to === "processing") set.processingAt = now();
  if (to === "completed") set.completedAt = now();
  if (to === "needs_action") set.actionReason = reason;
  const upd = await db.update(schema.evOrders).set(set).where(and(eq(schema.evOrders.id, id), eq(schema.evOrders.status, ev.status))).returning();
  if (!upd[0]) return { ok: false, error: "The order changed while you were working. Reload and try again." };
  await log(db, id, actor, `status:${to}`, reason);
  let mailed = "";
  if (to === "processing") mailed = await sendEv(env, upd[0], "ev_processing", `${id}:processing`, {}, files);
  if (to === "completed") mailed = await sendEv(env, upd[0], "ev_results_ready", `${id}:results`, {}, files);
  if (to === "needs_action") mailed = await sendEv(env, upd[0], "ev_action_needed", `${id}:action:${now()}`, { action_reason: reason }, files);
  const note = mailed ? (settle(mailed) ? " The customer was emailed." : mailed === "skipped" ? " No email was sent (email service or template is off)." : " The email could not be sent: use Resend on the order page.") : "";
  return { ok: true, message: `Status set to ${LABEL[to]}.${note}` };
}

export async function saveNote(env: CloudflareEnv, id: string, note: string, actor: string): Promise<Res> {
  const db = getDbFromEnv(env);
  await db.update(schema.evOrders).set({ note: note.trim().slice(0, 4000) }).where(eq(schema.evOrders.id, id));
  await log(db, id, actor, "note_saved");
  return { ok: true, message: "Note saved." };
}

/** Registers a result file that the admin route already stored in R2. */
export async function addResult(env: CloudflareEnv, id: string, o: { fileId: string; filename: string; size: number }): Promise<void> {
  await getDbFromEnv(env).insert(schema.evFiles).values({ id: o.fileId, evOrderId: id, kind: "result", state: "accepted", r2Key: resultKey(id, o.fileId), filename: o.filename.replace(/[^\w .()@+-]/g, "_").slice(0, 120), sizeBytes: o.size, format: (o.filename.split(".").pop() ?? "").toLowerCase().slice(0, 8), source: "admin" });
}
export async function removeResult(env: CloudflareEnv, id: string, fileId: string, actor: string): Promise<Res> {
  const db = getDbFromEnv(env);
  const ev = await getEv(db, id);
  if (!ev) return { ok: false, error: "Order not found." };
  if (ev.status === "completed" || ev.status === "delivered") return { ok: false, error: "The job is already completed. Result files cannot be removed." };
  const [f] = await db.select().from(schema.evFiles).where(and(eq(schema.evFiles.id, fileId), eq(schema.evFiles.evOrderId, id), eq(schema.evFiles.kind, "result")));
  if (!f) return { ok: false, error: "File not found." };
  await env.LISTS.delete(f.r2Key).catch(() => undefined);
  await db.update(schema.evFiles).set({ state: "deleted", deletedAt: now() }).where(eq(schema.evFiles.id, fileId));
  await log(db, id, actor, "result_removed", f.filename);
  return { ok: true, message: "Result file removed." };
}

// ------------------------------------------------------------------------------------------------ customer results

export function resultsOpen(ev: EvRow, s: EvSettings): boolean {
  return (ev.status === "completed" || ev.status === "delivered") && !!ev.completedAt && ev.completedAt + s.resultDownloadDays * DAY >= now();
}
/** The customer proved the order email: first download moves Completed -> Delivered (a real event). */
export async function markDelivered(env: CloudflareEnv, ev: EvRow): Promise<void> {
  if (ev.status !== "completed") return;
  const db = getDbFromEnv(env);
  const r = await db.update(schema.evOrders).set({ status: "delivered", deliveredAt: now() }).where(and(eq(schema.evOrders.id, ev.id), eq(schema.evOrders.status, "completed"))).returning({ id: schema.evOrders.id });
  if (r[0]) await log(db, ev.id, "customer", "downloaded");
}

// ------------------------------------------------------------------------------------------------ cron

/** Every 15 minutes: paid orders that were missed by the hook, reminders, retention. Never throws. */
export async function sweepEv(env: CloudflareEnv): Promise<{ fulfilled: number; reminded: number; purged: number }> {
  const out = { fulfilled: 0, reminded: 0, purged: 0 };
  try {
    const db = getDbFromEnv(env);
    const s = await loadEvSettings(env);
    const waiting = await db.all<{ order_id: string }>(sql`SELECT e.order_id FROM ev_orders e JOIN orders o ON o.id = e.order_id WHERE e.status = 'awaiting_payment' AND o.status = 'paid' LIMIT 20`);
    for (const w of waiting) if (await fulfillOnPaid(env, w.order_id)) out.fulfilled++;
    if (s.reminderHours > 0) {
      const due = await db.select().from(schema.evOrders).where(and(eq(schema.evOrders.status, "awaiting_file"), sql`${schema.evOrders.reminderSentAt} IS NULL`, sql`${schema.evOrders.paidAt} <= ${now() - s.reminderHours * 3600}`)).limit(20);
      for (const ev of due) {
        const files = await filesOf(db, ev.id);
        if (acceptedTotal(files) > 0) continue;
        if (settle(await sendEv(env, ev, "ev_submit_reminder", `${ev.id}:reminder`))) { await db.update(schema.evOrders).set({ reminderSentAt: now() }).where(eq(schema.evOrders.id, ev.id)); out.reminded++; }
      }
    }
    out.purged = await purgeExpired(env, s);
  } catch { /* the next run tries again */ }
  return out;
}

/** Deletes stored files after the retention the customer was told about. Only files, never the order record. */
export async function purgeExpired(env: CloudflareEnv, s?: EvSettings): Promise<number> {
  const db = getDbFromEnv(env);
  const cfg = s ?? await loadEvSettings(env);
  const t = now();
  const rows = await db.all<{ id: string; r2_key: string; kind: string }>(sql`
    SELECT f.id, f.r2_key, f.kind FROM ev_files f JOIN ev_orders e ON e.id = f.ev_order_id
    WHERE f.deleted_at IS NULL AND (
      (f.kind = 'original' AND COALESCE(e.completed_at, CASE WHEN e.status IN ('cancelled','refunded') THEN e.created_at END) IS NOT NULL AND COALESCE(e.completed_at, e.created_at) + ${cfg.retainOriginalDays * DAY} < ${t})
      OR (f.kind = 'result' AND COALESCE(e.delivered_at, e.completed_at) IS NOT NULL AND COALESCE(e.delivered_at, e.completed_at) + ${cfg.retainResultDays * DAY} < ${t})
      OR (f.state IN ('pending','needs_column') AND f.created_at + 86400 < ${t}))
    LIMIT 50`);
  for (const r of rows) {
    await env.LISTS.delete(r.r2_key).catch(() => undefined);
    await db.update(schema.evFiles).set({ deletedAt: t, state: sql`CASE WHEN state IN ('pending','needs_column') THEN 'rejected' ELSE 'deleted' END` }).where(eq(schema.evFiles.id, r.id));
  }
  return rows.length;
}

// ------------------------------------------------------------------------------------------------ admin lists

export async function listOrders(db: Db, o: { status?: string; q?: string; page: number; per: number }) {
  const where = [o.status && isStatus(o.status) ? sql`e.status = ${o.status}` : sql`1 = 1`, o.q ? sql`(e.id LIKE ${`%${o.q}%`} OR e.email LIKE ${`%${o.q.toLowerCase()}%`})` : sql`1 = 1`];
  const rows = await db.all<EvListRow>(sql`
    SELECT e.id, e.order_id AS orderId, e.email, e.package_name AS packageName, e.limit_count AS limitCount, e.price_cents AS priceCents, e.status, e.submitted_count AS submittedCount, e.created_at AS createdAt, e.submitted_at AS submittedAt, e.completed_at AS completedAt, o.status AS payStatus,
      (SELECT f.filename FROM ev_files f WHERE f.ev_order_id = e.id AND f.kind = 'original' AND f.state = 'accepted' ORDER BY f.created_at LIMIT 1) AS filename,
      (SELECT COALESCE(SUM(f.size_bytes),0) FROM ev_files f WHERE f.ev_order_id = e.id AND f.kind = 'original' AND f.state = 'accepted') AS sizeBytes
    FROM ev_orders e LEFT JOIN orders o ON o.id = e.order_id WHERE ${where[0]} AND ${where[1]} ORDER BY e.created_at DESC LIMIT ${o.per} OFFSET ${(o.page - 1) * o.per}`);
  const [c] = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM ev_orders e WHERE ${where[0]} AND ${where[1]}`);
  return { rows, total: c?.n ?? 0 };
}
export type EvListRow = { id: string; orderId: string; email: string; packageName: string; limitCount: number; priceCents: number; status: string; submittedCount: number; createdAt: number; submittedAt: number | null; completedAt: number | null; payStatus: string | null; filename: string | null; sizeBytes: number };

export async function statusCounts(db: Db): Promise<Record<string, number>> {
  const rows = await db.all<{ status: string; n: number }>(sql`SELECT status, COUNT(*) AS n FROM ev_orders GROUP BY status`);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
