// DFY Outbound: orders, stages, onboarding, capacity approval, infrastructure/lead/copy/metrics tracking, ownership, renewals.
// Everything operational is MANUAL work by the BeigeLeads team: no step here buys a domain, creates an inbox, verifies a lead or sends a message.
// A gate only opens from a real admin entry (verified assets, approved capacity) or a real customer action (copy approval).
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { sendOnce } from "@/lib/system-emails/triggers";
import { checkCapacity } from "./capacity";
import { onboardingSchema } from "./onboarding";
import { loadDfySettings, messageCeiling, range, type DfyPackage } from "./settings";
import { LAUNCH_STAGES, LABEL, canMove, isStage, live, type Stage } from "./state";
import { dfyToken, dfyTokenHash } from "./token";

export const SITE = "https://beigeleads.com";
type Db = ReturnType<typeof getDbFromEnv>;
export type DfyRow = typeof schema.dfyOrders.$inferSelect;
const now = () => Math.floor(Date.now() / 1000);
const DAY = 86400;
export const CYCLE_DAYS = 30;
export const pageUrl = (t: string) => `${SITE}/dfy-outbound/order/${t}`;
export const adminUrl = (id: string) => `${SITE}/admin/dfy/${id}`;
/** Rules every campaign must follow. Shown to the customer and the admin; the team stops contacts by hand when one of these happens. */
export const STOP_RULES = ["a prospect replies", "a prospect unsubscribes or opts out", "an address bounces", "a prospect becomes ineligible (for example a suppressed or wrongly targeted contact)"];

export function newDfyId(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8));
  return `DFY-${[...r].map((x) => a[x % a.length]).join("")}`;
}

/** Row inserted with the BeigeLeads order (same D1 batch). Allocation numbers are a SNAPSHOT of what was sold. */
export async function dfyInsertRow(env: CloudflareEnv, orderId: string, email: string, pkg: DfyPackage, ownership: { selected: boolean; cents: number }) {
  const id = newDfyId();
  return {
    row: { id, orderId, email, packageName: pkg.name, monthlyCents: pkg.monthlyCents, ownership: ownership.selected ? 1 : 0, ownershipCents: ownership.selected ? ownership.cents : 0, leads: pkg.leads, initialSends: pkg.initialSends, followups: pkg.followups, ceiling: messageCeiling(pkg.leads, pkg.followups), domainsEst: range(pkg.domainsMin, pkg.domainsMax), inboxesEst: range(pkg.inboxesMin, pkg.inboxesMax), reporting: pkg.reporting, support: pkg.support, status: "awaiting_payment", tokenHash: await dfyTokenHash(await dfyToken(env, id)) },
    cycle: { orderId, dfyId: id, cycle: 1, kind: "initial", amountCents: pkg.monthlyCents + (ownership.selected ? ownership.cents : 0) },
  };
}

export async function log(db: Db, id: string, actor: string, action: string, detail = "") {
  await db.insert(schema.dfyEvents).values({ dfyId: id, actor, action, detail: detail.slice(0, 500) }).catch(() => undefined);
}
export const getDfy = async (db: Db, id: string) => (await db.select().from(schema.dfyOrders).where(eq(schema.dfyOrders.id, id)))[0] ?? null;
export async function getDfyByToken(env: CloudflareEnv, token: string): Promise<DfyRow | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  try { return (await getDbFromEnv(env).select().from(schema.dfyOrders).where(eq(schema.dfyOrders.tokenHash, await dfyTokenHash(token))))[0] ?? null; } catch { return null; }
}
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateStr = (s: number) => new Date(s * 1000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

async function mail(env: CloudflareEnv, d: DfyRow, key: string, reference: string, detail = ""): Promise<string> {
  try {
    return await sendOnce(env, getDbFromEnv(env), key, d.email, { order_number: d.id, package_name: d.packageName, dfy_url: pageUrl(await dfyToken(env, d.id)), dfy_detail: detail.slice(0, 200), renewal_date: d.renewsAt ? dateStr(d.renewsAt) : "", order_total: usd(d.monthlyCents) }, reference);
  } catch { return "failed"; }
}

// ------------------------------------------------------------------------------------------------ payment

/** Called when a BeigeLeads order is paid (and by the cron). Idempotent. First payment starts onboarding; a paid renewal extends the term. */
export async function fulfillOnPaid(env: CloudflareEnv, orderId: string): Promise<boolean> {
  try {
    const db = getDbFromEnv(env);
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId));
    if (o?.status !== "paid") return false;
    const [cy] = await db.select().from(schema.dfyCycles).where(eq(schema.dfyCycles.orderId, orderId));
    if (!cy) return false;
    const stamp = now();
    const claimed = await db.update(schema.dfyCycles).set({ paidAt: stamp }).where(and(eq(schema.dfyCycles.orderId, orderId), isNull(schema.dfyCycles.paidAt))).returning();
    if (claimed.length === 0) return false; // already handled
    const d = await getDfy(db, cy.dfyId);
    if (!d) return false;
    if (cy.kind === "initial") {
      const moved = await db.update(schema.dfyOrders).set({ status: "awaiting_onboarding", paidAt: stamp, renewsAt: stamp + CYCLE_DAYS * DAY, updatedAt: stamp }).where(and(eq(schema.dfyOrders.id, d.id), eq(schema.dfyOrders.status, "awaiting_payment"))).returning();
      await log(db, d.id, "system", "paid", `First payment confirmed (${usd(cy.amountCents)})`);
      const fresh = moved[0] ?? (await getDfy(db, d.id)) ?? d;
      await mail(env, fresh, "dfy_payment_confirmed", `${d.id}:paid`);
      await mail(env, fresh, "dfy_onboarding_invite", `${d.id}:invite`);
      await notifyOwner(env, `New DFY Outbound order ${d.id}`, `${d.packageName} is paid. Open ${adminUrl(d.id)}. Operational work has not started: confirm capacity first.`).catch(() => undefined);
    } else {
      const base = Math.max(d.renewsAt ?? stamp, stamp);
      const resume = d.status === "paused" ? (isStage(d.pausedFrom) ? d.pausedFrom : "infrastructure_planning") : d.status === "renewal_pending" ? "campaign_active" : d.status;
      await db.update(schema.dfyOrders).set({ renewsAt: base + CYCLE_DAYS * DAY, cycle: cy.cycle, status: resume, pausedFrom: "", updatedAt: stamp }).where(eq(schema.dfyOrders.id, d.id));
      await log(db, d.id, "system", "renewal_paid", `Cycle ${cy.cycle} paid (${usd(cy.amountCents)})`);
      await mail(env, { ...d, renewsAt: base + CYCLE_DAYS * DAY }, "dfy_payment_confirmed", `${d.id}:cycle${cy.cycle}`);
    }
    return true;
  } catch { return false; }
}

// ------------------------------------------------------------------------------------------------ onboarding (customer)

export type Submit = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };
export async function submitOnboarding(env: CloudflareEnv, token: string, raw: unknown): Promise<Submit> {
  const d = await getDfyByToken(env, token);
  if (!d) return { ok: false, error: "This link is not valid." };
  if (!d.paidAt) return { ok: false, error: "Payment is not confirmed yet. You can send your details as soon as it is." };
  if (d.status !== "awaiting_onboarding") return { ok: false, error: d.status === "cancelled" ? "This order is closed." : "Your onboarding was already submitted. Use support to change it." };
  const p = onboardingSchema.safeParse(raw);
  if (!p.success) { const f: Record<string, string> = {}; for (const i of p.error.issues) f[String(i.path[0] ?? "form")] ||= i.message; return { ok: false, error: Object.values(f)[0] ?? "Check the form.", fields: f }; }
  const { website2: _h, ...data } = p.data; void _h;
  const db = getDbFromEnv(env);
  const up = await db.update(schema.dfyOrders).set({ onboardingJson: JSON.stringify(data), onboardingAt: now(), status: "onboarding_submitted", updatedAt: now() }).where(and(eq(schema.dfyOrders.id, d.id), eq(schema.dfyOrders.status, "awaiting_onboarding"))).returning();
  if (up.length === 0) return { ok: false, error: "Your onboarding was already submitted." };
  await log(db, d.id, "customer", "onboarding_submitted");
  await mail(env, up[0], "dfy_onboarding_submitted", `${d.id}:onb`);
  await notifyOwner(env, `DFY onboarding submitted: ${d.id}`, `Open ${adminUrl(d.id)}.`).catch(() => undefined);
  return { ok: true };
}

// ------------------------------------------------------------------------------------------------ stages (admin)

export type Res = { ok: true; message: string } | { ok: false; error: string };
export const assetsOf = (db: Db, id: string) => db.select().from(schema.dfyAssets).where(eq(schema.dfyAssets.dfyId, id)).orderBy(schema.dfyAssets.id);
export const latestCopy = async (db: Db, id: string) => {
  const all = await db.select().from(schema.dfyCopy).where(eq(schema.dfyCopy.dfyId, id)).orderBy(schema.dfyCopy.step, schema.dfyCopy.variant, desc(schema.dfyCopy.version));
  const seen = new Set<string>(); return all.filter((r) => { const k = `${r.step}:${r.variant}`; if (seen.has(k)) return false; seen.add(k); return true; });
};

/** What must be true before the campaign can be ready or live. Each item comes from a real admin entry or customer action. */
export async function launchGates(db: Db, d: DfyRow): Promise<string[]> {
  const out: string[] = [];
  if (!d.capacityApproved) out.push("The capacity plan is not approved.");
  const assets = await assetsOf(db, d.id);
  if (!assets.some((a) => a.kind === "domain" && a.status === "verified")) out.push("No domain is verified.");
  if (!assets.some((a) => a.kind === "inbox" && a.status === "verified")) out.push("No inbox is verified.");
  const copy = await latestCopy(db, d.id);
  if (copy.length === 0 || copy.some((c) => c.status !== "approved")) out.push("The sequence copy is not fully approved by the customer.");
  return out;
}

export async function moveStage(env: CloudflareEnv, id: string, to: string, actor: string, detail = ""): Promise<Res> {
  const db = getDbFromEnv(env);
  const d = await getDfy(db, id);
  if (!d) return { ok: false, error: "Order not found." };
  if (!isStage(to) || !isStage(d.status)) return { ok: false, error: "Unknown stage." };
  if (!canMove(d.status, to)) return { ok: false, error: `${LABEL[d.status]} cannot move to ${LABEL[to]}.` };
  if (!d.paidAt && to !== "cancelled") return { ok: false, error: "The order is not paid." };
  if (LAUNCH_STAGES.includes(to)) {
    const blockers = await launchGates(db, d);
    if (blockers.length) return { ok: false, error: `Not ready for ${LABEL[to]}: ${blockers.join(" ")}` };
  }
  const up = await db.update(schema.dfyOrders).set({ status: to, updatedAt: now() }).where(and(eq(schema.dfyOrders.id, id), eq(schema.dfyOrders.status, d.status))).returning();
  if (up.length === 0) return { ok: false, error: "The order changed. Reload and try again." };
  await log(db, id, actor, "stage", `${LABEL[d.status]} -> ${LABEL[to]}${detail ? `: ${detail}` : ""}`);
  const tpl: Partial<Record<Stage, string>> = { infrastructure_planning: "dfy_infra_planning", campaign_active: "dfy_campaign_launched" };
  const k = tpl[to];
  if (k) await mail(env, up[0], k, `${id}:${to}`, detail);
  if (to === "cancelled") await mail(env, up[0], "dfy_cancelled", `${id}:cancel`, detail);
  return { ok: true, message: `Moved to ${LABEL[to]}.` };
}

export async function pause(env: CloudflareEnv, id: string, actor: string, reason = ""): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id);
  if (!d) return { ok: false, error: "Order not found." };
  if (d.status === "paused" || d.status === "cancelled" || d.status === "completed" || d.status === "awaiting_payment") return { ok: false, error: "This order cannot be paused now." };
  await db.update(schema.dfyOrders).set({ status: "paused", pausedFrom: d.status, updatedAt: now() }).where(eq(schema.dfyOrders.id, id));
  await log(db, id, actor, "paused", reason); return { ok: true, message: "Service paused. No sending should happen while paused." };
}
export async function resume(env: CloudflareEnv, id: string, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id);
  if (!d || d.status !== "paused") return { ok: false, error: "The order is not paused." };
  if (d.renewsAt && d.renewsAt < now()) return { ok: false, error: "The current term has ended. Resume after the renewal is paid." };
  const to = isStage(d.pausedFrom) ? d.pausedFrom : "infrastructure_planning";
  await db.update(schema.dfyOrders).set({ status: to, pausedFrom: "", updatedAt: now() }).where(eq(schema.dfyOrders.id, id));
  await log(db, id, actor, "resumed", LABEL[to]); return { ok: true, message: `Resumed at ${LABEL[to]}.` };
}

// ------------------------------------------------------------------------------------------------ capacity

export type CapacityForm = { domains: number; inboxes: number; perInboxDaily: number; sendingDays: number; plannedMessages: number; note: string };
export async function evaluate(env: CloudflareEnv, d: DfyRow, f: CapacityForm) {
  const [dmin, dmax] = d.domainsEst.split("–").map(Number); const [imin, imax] = d.inboxesEst.split("–").map(Number);
  return checkCapacity({ leads: d.leads, initialSends: d.initialSends, followups: d.followups, inboxes: f.inboxes, domains: f.domains, perInboxDaily: f.perInboxDaily, sendingDays: f.sendingDays, inboxesMin: imin || 0, inboxesMax: imax || imin || 0, domainsMin: dmin || 0, domainsMax: dmax || dmin || 0, plannedMessages: f.plannedMessages });
}
/** Saves the confirmed plan. `accept` = the admin has read the listed differences and approves anyway (recorded). Without it, any issue keeps the gate closed. */
export async function saveCapacity(env: CloudflareEnv, id: string, f: CapacityForm, approve: boolean, accept: boolean, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id);
  if (!d) return { ok: false, error: "Order not found." };
  const r = await evaluate(env, d, f);
  if (approve && !r.ok && !accept) return { ok: false, error: `Capacity issues: ${r.issues.join(" ")} Tick "I accept these differences" to approve anyway.` };
  if (approve && (f.inboxes <= 0 || f.domains <= 0)) return { ok: false, error: "Enter the real number of domains and inboxes before approving." };
  const json = JSON.stringify({ ...f, issues: r.issues, monthlyCapacity: r.monthlyCapacity, accepted: approve && !r.ok, by: actor, at: now() });
  await db.update(schema.dfyOrders).set({ capacityJson: json, capacityApproved: approve ? 1 : 0, updatedAt: now() }).where(eq(schema.dfyOrders.id, id));
  await log(db, id, actor, approve ? "capacity_approved" : "capacity_saved", r.issues.join(" ").slice(0, 300));
  return { ok: true, message: approve ? "Capacity plan approved." : "Capacity plan saved (not approved)." };
}

// ------------------------------------------------------------------------------------------------ infrastructure, leads, copy, metrics

export const ASSET_STATUS = ["planned", "purchased", "configured", "verified", "failed"] as const;
export async function addAsset(db: Db, id: string, kind: "domain" | "inbox", name: string, actor: string): Promise<Res> {
  const n = name.trim().toLowerCase().slice(0, 200);
  if (!n) return { ok: false, error: "Enter a name." };
  if (/\s/.test(n) && kind === "domain") return { ok: false, error: "A domain has no spaces." };
  await db.insert(schema.dfyAssets).values({ dfyId: id, kind, name: n }); await log(db, id, actor, "asset_added", `${kind} ${n}`);
  return { ok: true, message: "Added." };
}
/** "verified" needs a note that says how it was verified (for example a DNS/auth check). Nothing is verified by this code itself. */
export async function setAssetStatus(db: Db, id: string, assetId: number, status: string, note: string, actor: string): Promise<Res> {
  if (!(ASSET_STATUS as readonly string[]).includes(status)) return { ok: false, error: "Unknown status." };
  if (status === "verified" && note.trim().length < 5) return { ok: false, error: "Write how you verified it (for example: SPF, DKIM and DMARC checked on 21 Nov) before marking it verified." };
  const up = await db.update(schema.dfyAssets).set({ status, note: note.trim().slice(0, 300), verifiedAt: status === "verified" ? now() : null }).where(and(eq(schema.dfyAssets.id, assetId), eq(schema.dfyAssets.dfyId, id))).returning();
  if (!up.length) return { ok: false, error: "Item not found." };
  await log(db, id, actor, "asset_status", `${up[0].kind} ${up[0].name}: ${status}`);
  return { ok: true, message: "Saved." };
}
/** Tells the customer a group is done, but only when every item of that kind is really verified. */
export async function announceInfra(env: CloudflareEnv, id: string, kind: "domain" | "inbox", detail: string, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id); if (!d) return { ok: false, error: "Order not found." };
  const items = (await assetsOf(db, id)).filter((a) => a.kind === kind);
  if (items.length === 0 || items.some((a) => a.status !== "verified")) return { ok: false, error: `Every ${kind} must be verified first.` };
  const r = await mail(env, d, kind === "domain" ? "dfy_domains_done" : "dfy_inboxes_done", `${id}:${kind}:${items.length}`, detail);
  await log(db, id, actor, "announce", `${kind}: ${r}`); return r === "sent" || r === "already-sent" ? { ok: true, message: "Customer notified." } : { ok: false, error: `Email not sent (${r}).` };
}

export type CopyIn = { step: number; kind: "initial" | "followup"; variant: string; subject: string; body: string };
export async function saveCopy(db: Db, id: string, c: CopyIn, actor: string): Promise<Res> {
  if (!Number.isInteger(c.step) || c.step < 1 || c.step > 20) return { ok: false, error: "Step must be 1-20." };
  if (c.kind === "initial" && c.step !== 1) return { ok: false, error: "The initial message is step 1. Follow-ups are step 2 and up." };
  if (c.kind === "followup" && c.step < 2) return { ok: false, error: "Follow-ups start at step 2." };
  const body = c.body.trim(), subject = c.subject.trim();
  if (body.length < 10) return { ok: false, error: "Write the message." };
  const variant = (c.variant.trim().toUpperCase() || "A").slice(0, 2);
  const [last] = await db.select({ v: sql<number>`max(${schema.dfyCopy.version})` }).from(schema.dfyCopy).where(and(eq(schema.dfyCopy.dfyId, id), eq(schema.dfyCopy.step, c.step), eq(schema.dfyCopy.variant, variant)));
  await db.insert(schema.dfyCopy).values({ dfyId: id, step: c.step, kind: c.kind, variant, version: (last?.v ?? 0) + 1, subject: subject.slice(0, 200), body: body.slice(0, 5000), status: "draft" });
  await log(db, id, actor, "copy_saved", `step ${c.step}${variant}`); return { ok: true, message: "Saved as a new version." };
}
export async function submitCopy(env: CloudflareEnv, id: string, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id); if (!d) return { ok: false, error: "Order not found." };
  const cur = await latestCopy(db, id);
  if (cur.length === 0) return { ok: false, error: "Write the sequence first." };
  const ids = cur.filter((c) => c.status === "draft" || c.status === "changes_requested").map((c) => c.id);
  if (ids.length === 0) return { ok: false, error: "Nothing new to submit." };
  await db.update(schema.dfyCopy).set({ status: "submitted" }).where(inArray(schema.dfyCopy.id, ids));
  await log(db, id, actor, "copy_submitted", `${ids.length} message(s)`);
  await mail(env, d, "dfy_copy_ready", `${id}:copy:${Date.now()}`);
  return { ok: true, message: "Sent to the customer for approval." };
}
/** Customer approves or asks for changes. Only submitted copy can be approved. */
export async function reviewCopy(env: CloudflareEnv, token: string, decision: "approve" | "changes", note: string): Promise<Res> {
  const d = await getDfyByToken(env, token); if (!d) return { ok: false, error: "This link is not valid." };
  if (!d.paidAt || d.status === "cancelled") return { ok: false, error: "This order is not active." };
  const db = getDbFromEnv(env);
  const sub = (await latestCopy(db, d.id)).filter((c) => c.status === "submitted");
  if (sub.length === 0) return { ok: false, error: "There is no copy waiting for your approval." };
  if (decision === "changes" && note.trim().length < 5) return { ok: false, error: "Tell us what to change." };
  await db.update(schema.dfyCopy).set({ status: decision === "approve" ? "approved" : "changes_requested", clientNote: decision === "changes" ? note.trim().slice(0, 1000) : "" }).where(inArray(schema.dfyCopy.id, sub.map((c) => c.id)));
  await log(db, d.id, "customer", decision === "approve" ? "copy_approved" : "copy_changes", note.slice(0, 200));
  if (decision === "approve") { const all = await latestCopy(db, d.id); if (all.every((c) => c.status === "approved")) await mail(env, d, "dfy_campaign_approved", `${d.id}:approved:${Date.now()}`); }
  await notifyOwner(env, `DFY copy ${decision === "approve" ? "approved" : "needs changes"}: ${d.id}`, `Open ${adminUrl(d.id)}.`).catch(() => undefined);
  return { ok: true, message: decision === "approve" ? "Thank you. Your approval is recorded." : "Thanks. We will revise the copy." };
}

export type MetricsIn = { period: string; sourced: number; verified: number; approved: number; contacted: number; initialSends: number; followupSends: number; failures: number; replies: number; interested: number; optouts: number; meetings: number; note: string };
export async function addMetrics(db: Db, id: string, m: MetricsIn, actor: string): Promise<Res> {
  const nums = [m.sourced, m.verified, m.approved, m.contacted, m.initialSends, m.followupSends, m.failures, m.replies, m.interested, m.optouts, m.meetings];
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 100_000_000)) return { ok: false, error: "Every number must be a whole number of 0 or more." };
  if (m.verified > m.sourced) return { ok: false, error: "Verified cannot be higher than sourced." };
  if (m.interested > m.replies) return { ok: false, error: "Interested replies cannot be higher than replies." };
  if (!m.period.trim()) return { ok: false, error: "Enter the period (for example 2026-11 or 2026-W47)." };
  await db.insert(schema.dfyMetrics).values({ dfyId: id, period: m.period.trim().slice(0, 20), sourced: m.sourced, verified: m.verified, approved: m.approved, contacted: m.contacted, initialSends: m.initialSends, followupSends: m.followupSends, failures: m.failures, replies: m.replies, interested: m.interested, optouts: m.optouts, meetings: m.meetings, note: m.note.trim().slice(0, 1000) });
  await log(db, id, actor, "metrics_added", m.period); return { ok: true, message: "Saved (not visible to the customer until published)." };
}
export async function publishReport(env: CloudflareEnv, id: string, metricId: number, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id); if (!d) return { ok: false, error: "Order not found." };
  const up = await db.update(schema.dfyMetrics).set({ published: 1 }).where(and(eq(schema.dfyMetrics.id, metricId), eq(schema.dfyMetrics.dfyId, id))).returning();
  if (!up.length) return { ok: false, error: "Report not found." };
  await log(db, id, actor, "report_published", up[0].period);
  await mail(env, d, "dfy_report_available", `${id}:report:${metricId}`); return { ok: true, message: "Report published and the customer notified." };
}

// ------------------------------------------------------------------------------------------------ ownership

export const OWN_STATUS = ["not_started", "preparing", "ready", "transferred", "restricted"] as const;
export type OwnershipForm = { status: string; assets: string; agreement: string; restrictions: string; acknowledged: boolean; date: string; feePaid: boolean };
export async function saveOwnership(env: CloudflareEnv, id: string, f: OwnershipForm, actor: string): Promise<Res> {
  const db = getDbFromEnv(env); const d = await getDfy(db, id); if (!d) return { ok: false, error: "Order not found." };
  if (!d.ownership) return { ok: false, error: "This customer did not buy the ownership option." };
  if (!(OWN_STATUS as readonly string[]).includes(f.status)) return { ok: false, error: "Unknown status." };
  if (f.status === "transferred" && (!f.date || !f.assets.trim())) return { ok: false, error: "Enter the transfer date and the assets covered before marking it transferred." };
  let prev: { status?: string } = {}; try { prev = JSON.parse(d.ownershipJson || "{}") as { status?: string }; } catch { /* none */ }
  await db.update(schema.dfyOrders).set({ ownershipJson: JSON.stringify({ ...f, feePaid: !!d.paidAt }), updatedAt: now() }).where(eq(schema.dfyOrders.id, id));
  await log(db, id, actor, "ownership", f.status);
  if (prev.status !== f.status && f.status === "ready") await mail(env, d, "dfy_ownership_ready", `${id}:own:ready`, "");
  if (prev.status !== f.status && f.status === "transferred") await mail(env, d, "dfy_ownership_done", `${id}:own:done`, "");
  return { ok: true, message: "Saved." };
}

// ------------------------------------------------------------------------------------------------ cron

/** Every 15 minutes: renewal reminders (once per cycle) and a pause when a term ended unpaid. */
export async function sweepDfy(env: CloudflareEnv): Promise<void> {
  try {
    const db = getDbFromEnv(env); const s = await loadDfySettings(env); const t = now();
    // Safety net: a paid order whose first-payment hook did not run (idempotent).
    const unpaid = await db.all<{ order_id: string }>(sql`SELECT c.order_id FROM dfy_cycles c JOIN orders o ON o.id = c.order_id WHERE c.paid_at IS NULL AND o.status = 'paid' LIMIT 20`);
    for (const u of unpaid) await fulfillOnPaid(env, u.order_id);
    const due = await db.select().from(schema.dfyOrders).where(and(sql`${schema.dfyOrders.renewsAt} is not null`, sql`${schema.dfyOrders.paidAt} is not null`, sql`${schema.dfyOrders.status} not in ('cancelled','completed','awaiting_payment','paused')`));
    for (const d of due) {
      const renews = d.renewsAt as number;
      if (d.cancelRequested) continue;
      if (renews - s.renewalReminderDays * DAY <= t && d.reminderSentFor < d.cycle + 1) {
        const r = await mail(env, d, "dfy_renewal_reminder", `${d.id}:renew:${d.cycle + 1}`);
        if (r === "sent" || r === "already-sent") { await db.update(schema.dfyOrders).set({ reminderSentFor: d.cycle + 1 }).where(eq(schema.dfyOrders.id, d.id)); await log(db, d.id, "system", "renewal_reminder", dateStr(renews)); }
      }
      if (renews < t) {
        const up = await db.update(schema.dfyOrders).set({ status: "paused", pausedFrom: d.status, updatedAt: t }).where(and(eq(schema.dfyOrders.id, d.id), eq(schema.dfyOrders.renewsAt, renews), sql`${schema.dfyOrders.status} <> 'paused'`)).returning();
        if (up[0]) { await log(db, d.id, "system", "paused_unpaid", "Renewal not paid by the end of the term"); await mail(env, up[0], "dfy_payment_failed", `${d.id}:unpaid:${d.cycle + 1}`, "The renewal was not paid in time."); await notifyOwner(env, `DFY paused (renewal unpaid): ${d.id}`, adminUrl(d.id)).catch(() => undefined); }
      }
    }
  } catch { /* the next run tries again */ }
}
export { live, LABEL };
