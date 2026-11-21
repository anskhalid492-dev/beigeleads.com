// Team Purchase Requests (CLAUDE.md section 114). A buyer asks a manager to approve and pay. The request stores a PRICE SNAPSHOT for
// display; on approval the order is created through the normal checkout (createOrder re-prices everything on the server), so the
// manager pays the real current price and a request can never mark anything paid. Paid = the order is paid on the network.
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { hydrateCatalog } from "@/lib/catalog-db";
import { normalizeItems, priceCart } from "@/lib/cart/model";
import { createOrder, CheckoutError } from "@/lib/checkout/create";
import { getDbFromEnv, schema } from "@/lib/db";
import { sha256Hex } from "@/lib/forms/hash";
import { loadCandidates } from "@/lib/promos/store";
import { sendOnce } from "@/lib/system-emails/triggers";
import { fmtDay, fmtUsd } from "./reward";
import { loadSalesSettings } from "./settings";

type Db = ReturnType<typeof getDbFromEnv>;
export const SITE = "https://beigeleads.com";
import { MAX_ITEMS, REMINDER_HOURS, REQUEST_DAYS } from "./team-constants";
export { MAX_ITEMS, REMINDER_HOURS, REQUEST_DAYS };
export type Snap = { slug: string; name: string; pkg: string; records: number; cents: number };
export type Status = "pending" | "viewed" | "approved" | "declined" | "expired" | "paid" | "cancelled";
const OPEN: Status[] = ["pending", "viewed"];
const lower = (s: string) => s.trim().toLowerCase();
const on = (v: string | undefined) => v === "true";

const tokenHash = (env: CloudflareEnv, token: string) => sha256Hex(`${env.HASH_SALT ?? ""}:pr:${token}`);
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
const newRef = () => `TR-${[...crypto.getRandomValues(new Uint8Array(5))].map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("")}`;
const snapOf = (json: string): Snap[] => { try { const a = JSON.parse(json) as Snap[]; return Array.isArray(a) ? a : []; } catch { return []; } };
const itemsText = (s: Snap[]) => s.map((x) => `${x.name} (${x.pkg})`).join("; ");
const effective = (r: { status: string; expiresAt: number }, now = Math.floor(Date.now() / 1000)): Status => (OPEN.includes(r.status as Status) && r.expiresAt <= now ? "expired" : (r.status as Status));

async function priceFor(env: CloudflareEnv, db: Db, items: { slug: string; pkg: string }[], email?: string) {
  await hydrateCatalog(env);
  const sales = await loadSalesSettings(env);
  return priceCart(items, {
    checkoutOpen: on(env.CHECKOUT_ENABLED), allowPlaceholder: on(env.CHECKOUT_ALLOW_PLACEHOLDER), volume: sales.volume, rewardCombineVolume: sales.reward.combineVolume,
    promo: { candidates: email ? await loadCandidates(db, email) : [], nowSec: Math.floor(Date.now() / 1000), emailKnown: !!email },
  });
}

const vars = (r: typeof schema.purchaseRequests.$inferSelect, extra: Record<string, string> = {}) => ({
  requester_name: r.requesterName, manager_name: r.managerName || "", request_note: r.note, request_items: itemsText(snapOf(r.itemsJson)),
  request_total: fmtUsd(r.totalCents), request_reference: r.reference, request_expiry: fmtDay(r.expiresAt), ...extra,
});

async function send(env: CloudflareEnv, db: Db, r: typeof schema.purchaseRequests.$inferSelect, key: string, to: "requester" | "manager", extra: Record<string, string> = {}, ref = `${r.reference}:${key}`) {
  const res = await sendOnce(env, db, key, to === "requester" ? r.requesterEmail : r.managerEmail, vars(r, extra), ref);
  return res === "sent" || res === "already-sent";
}

export type CreateIn = { requesterName: string; requesterEmail: string; managerName: string; managerEmail: string; note: string; items: { slug: string; pkg: string }[] };
export type CreateOut = { ok: true; reference: string; existing: boolean } | { ok: false; error: string };

export async function createRequest(env: CloudflareEnv, input: CreateIn): Promise<CreateOut> {
  const db = getDbFromEnv(env);
  const items = normalizeItems(input.items);
  if (items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (items.length > MAX_ITEMS) return { ok: false, error: `A request can hold up to ${MAX_ITEMS} databases.` };
  const requesterEmail = lower(input.requesterEmail), managerEmail = lower(input.managerEmail);
  if (requesterEmail === managerEmail) return { ok: false, error: "Enter your manager's email address, not your own." };
  const priced = await priceFor(env, db, items);
  if (priced.dropped.length > 0) return { ok: false, error: "A database in your cart does not exist any more. Review your cart." };
  const bad = priced.lines.find((l) => !l.purchasable);
  if (bad) return { ok: false, error: `${bad.name}: ${bad.reason}` };
  const snap: Snap[] = priced.lines.map((l) => ({ slug: l.slug, name: l.name, pkg: l.packageName, records: l.records, cents: l.payCents }));
  const key = JSON.stringify(snap.map((s) => `${s.slug}:${s.pkg}`).sort());
  const now = Math.floor(Date.now() / 1000);
  // The same open request again (same people, same databases) returns the existing one: no second row, no second email.
  const open = await db.select().from(schema.purchaseRequests).where(and(eq(schema.purchaseRequests.requesterEmail, requesterEmail), eq(schema.purchaseRequests.managerEmail, managerEmail), inArray(schema.purchaseRequests.status, OPEN), sql`${schema.purchaseRequests.expiresAt} > ${now}`));
  const same = open.find((o) => JSON.stringify(snapOf(o.itemsJson).map((s) => `${s.slug}:${s.pkg}`).sort()) === key);
  if (same) return { ok: true, reference: same.reference, existing: true };

  const token = newToken();
  const th = await tokenHash(env, token);
  const reference = newRef();
  let row: typeof schema.purchaseRequests.$inferSelect | undefined;
  try {
    [row] = await db.insert(schema.purchaseRequests).values({
      reference, tokenHash: th, requesterName: input.requesterName.trim(), requesterEmail, managerName: input.managerName.trim(), managerEmail, note: input.note.trim().slice(0, 500),
      itemsJson: JSON.stringify(snap), subtotalCents: priced.subtotalCents, discountCents: priced.discountCents, totalCents: priced.totalCents, dedupeKey: reference,
      createdAt: now, expiresAt: now + REQUEST_DAYS * 86400,
    }).returning();
  } catch { return { ok: false, error: "We could not save your request. Please try again." }; }
  if (!row) return { ok: false, error: "We could not save your request. Please try again." };
  // Saved first; the real email results are stored. A failed email never discards the request (admin can resend).
  const url = `${SITE}/purchase-request/${token}`;
  const m = await send(env, db, row, "team_request_manager", "manager", { request_url: url });
  const q = await send(env, db, row, "team_request_sent", "requester");
  await db.update(schema.purchaseRequests).set({ managerEmailStatus: m ? "sent" : "failed", requesterEmailStatus: q ? "sent" : "failed" }).where(eq(schema.purchaseRequests.id, row.id)).catch(() => undefined);
  return { ok: true, reference, existing: false };
}

export type ManagerView = {
  reference: string; requesterName: string; managerName: string; note: string; items: Snap[]; snapshotCents: number; currentCents: number;
  status: Status; expiresAt: number; orderId: string | null; declineReason: string | null;
};
type Found = { r: typeof schema.purchaseRequests.$inferSelect; eff: Status };
async function find(env: CloudflareEnv, token: string): Promise<Found | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const db = getDbFromEnv(env);
  const [r] = await db.select().from(schema.purchaseRequests).where(eq(schema.purchaseRequests.tokenHash, await tokenHash(env, token)));
  return r ? { r, eff: effective(r) } : null;
}
/** Only exists to tell the page the request is real; reveals nothing before the manager confirms the email. */
export async function requestExists(env: CloudflareEnv, token: string) { try { return !!(await find(env, token)); } catch { return false; } }

const MISMATCH = "That email address does not match this request.";
export async function managerView(env: CloudflareEnv, token: string, email: string): Promise<{ ok: true; view: ManagerView } | { ok: false; error: string }> {
  const f = await find(env, token); if (!f) return { ok: false, error: "This request link is not valid, or a newer email replaced it." };
  if (lower(email) !== f.r.managerEmail) return { ok: false, error: MISMATCH };
  const db = getDbFromEnv(env);
  if (f.r.status === "pending") await db.update(schema.purchaseRequests).set({ status: "viewed", viewedAt: Math.floor(Date.now() / 1000) }).where(and(eq(schema.purchaseRequests.id, f.r.id), eq(schema.purchaseRequests.status, "pending"))).catch(() => undefined);
  const snap = snapOf(f.r.itemsJson);
  let current = f.r.totalCents;
  try { const p = await priceFor(env, db, snap.map((s) => ({ slug: s.slug, pkg: s.pkg })), f.r.managerEmail); if (p.dropped.length === 0) current = p.totalCents; } catch { /* snapshot stays */ }
  return { ok: true, view: { reference: f.r.reference, requesterName: f.r.requesterName, managerName: f.r.managerName, note: f.r.note, items: snap, snapshotCents: f.r.totalCents, currentCents: current, status: f.eff === "pending" ? "viewed" : f.eff, expiresAt: f.r.expiresAt, orderId: f.r.orderId, declineReason: f.r.declineReason } };
}

export type ApproveOut = { ok: true; orderId: string } | { ok: false; error: string; changedTotalCents?: number };
/** Approve and pay: opens the normal checkout order for the MANAGER. Nothing is marked paid here. */
export async function managerApprove(env: CloudflareEnv, token: string, email: string, coin: string, seenTotalCents: number): Promise<ApproveOut> {
  const f = await find(env, token); if (!f) return { ok: false, error: "This request link is not valid, or a newer email replaced it." };
  const { r } = f;
  if (lower(email) !== r.managerEmail) return { ok: false, error: MISMATCH };
  const db = getDbFromEnv(env);
  if (r.orderId && (f.eff === "approved" || f.eff === "paid")) {
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, r.orderId));
    if (o && ["pending", "paid", "partial", "late_payment"].includes(o.status)) return { ok: true, orderId: r.orderId };
  }
  if (f.eff === "declined" || f.eff === "cancelled") return { ok: false, error: "This request was closed and can no longer be approved." };
  if (f.eff === "expired") return { ok: false, error: "This request expired. Ask the team member to send a new one." };
  const snap = snapOf(r.itemsJson);
  const priced = await priceFor(env, db, snap.map((s) => ({ slug: s.slug, pkg: s.pkg })), r.managerEmail);
  if (priced.dropped.length > 0) return { ok: false, error: "A database in this request is not available any more. Ask the team member to send a new request." };
  // The price may have changed since the request was made: the manager must see and accept the real one.
  if (priced.totalCents !== seenTotalCents) return { ok: false, error: "The total changed. Review the new total and approve again.", changedTotalCents: priced.totalCents };
  let orderId: string;
  try { orderId = await createOrder(env, { email: r.managerEmail, items: snap.map((s) => ({ productSlug: s.slug, packageName: s.pkg })), option: coin }); }
  catch (e) { return { ok: false, error: e instanceof CheckoutError ? e.message : "We could not open the payment. Please try again." }; }
  const now = Math.floor(Date.now() / 1000);
  await db.update(schema.purchaseRequests).set({ status: "approved", decidedAt: now, orderId }).where(and(eq(schema.purchaseRequests.id, r.id), inArray(schema.purchaseRequests.status, [...OPEN, "approved"]))).catch(() => undefined);
  await send(env, db, r, "team_request_approved", "requester");
  return { ok: true, orderId };
}

export async function managerDecline(env: CloudflareEnv, token: string, email: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const f = await find(env, token); if (!f) return { ok: false, error: "This request link is not valid, or a newer email replaced it." };
  if (lower(email) !== f.r.managerEmail) return { ok: false, error: MISMATCH };
  if (f.eff === "declined") return { ok: true };
  if (!OPEN.includes(f.eff)) return { ok: false, error: f.eff === "expired" ? "This request already expired." : "This request can no longer be declined." };
  const db = getDbFromEnv(env);
  const up = await db.update(schema.purchaseRequests).set({ status: "declined", decidedAt: Math.floor(Date.now() / 1000), declineReason: reason.trim().slice(0, 300) || null }).where(and(eq(schema.purchaseRequests.id, f.r.id), inArray(schema.purchaseRequests.status, OPEN))).returning({ id: schema.purchaseRequests.id });
  if (up.length === 0) return { ok: false, error: "This request can no longer be declined." };
  await send(env, db, { ...f.r, declineReason: reason.trim().slice(0, 300) || null }, "team_request_declined", "requester", { decline_reason: reason.trim().slice(0, 300) });
  return { ok: true };
}

/** Cron (every 15 minutes): expire old requests, remind managers after 48 h. Each email goes out once. */
export async function sweepRequests(env: CloudflareEnv): Promise<{ expired: number; reminded: number }> {
  let expired = 0, reminded = 0;
  try {
    const db = getDbFromEnv(env); const now = Math.floor(Date.now() / 1000);
    const late = await db.select().from(schema.purchaseRequests).where(and(inArray(schema.purchaseRequests.status, OPEN), lt(schema.purchaseRequests.expiresAt, now + 1))).limit(100);
    for (const r of late) {
      const up = await db.update(schema.purchaseRequests).set({ status: "expired" }).where(and(eq(schema.purchaseRequests.id, r.id), inArray(schema.purchaseRequests.status, OPEN))).returning({ id: schema.purchaseRequests.id });
      if (up.length) { expired++; if (await send(env, db, r, "team_request_expired", "requester")) await db.update(schema.purchaseRequests).set({ expiredNotifiedAt: now }).where(eq(schema.purchaseRequests.id, r.id)); }
    }
    const due = await db.select().from(schema.purchaseRequests).where(and(inArray(schema.purchaseRequests.status, OPEN), sql`${schema.purchaseRequests.reminderAt} IS NULL`, sql`${schema.purchaseRequests.createdAt} <= ${now - REMINDER_HOURS * 3600}`, sql`${schema.purchaseRequests.expiresAt} > ${now}`)).limit(100);
    for (const r of due) {
      // The secure link is only in the first email (we store a hash). The reminder points to the same link through the first email, so it sends a new token.
      const token = newToken();
      await db.update(schema.purchaseRequests).set({ tokenHash: await tokenHash(env, token), reminderAt: now }).where(and(eq(schema.purchaseRequests.id, r.id), sql`${schema.purchaseRequests.reminderAt} IS NULL`));
      if (await send(env, db, r, "team_request_reminder", "manager", { request_url: `${SITE}/purchase-request/${token}` })) reminded++;
    }
  } catch { /* the next run tries again */ }
  return { expired, reminded };
}

/** Called from deliverOrder once an order is really paid. Marks the request paid and tells both people once. Never throws. */
export async function onOrderPaid(env: CloudflareEnv, orderId: string): Promise<void> {
  try {
    const db = getDbFromEnv(env);
    const [r] = await db.select().from(schema.purchaseRequests).where(eq(schema.purchaseRequests.orderId, orderId));
    if (!r) return;
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId));
    if (o?.status !== "paid") return; // never trust a redirect: only the order's own paid status counts
    const now = Math.floor(Date.now() / 1000);
    await db.update(schema.purchaseRequests).set({ status: "paid" }).where(eq(schema.purchaseRequests.id, r.id));
    await send(env, db, r, "team_request_paid_requester", "requester");
    await send(env, db, r, "team_request_paid_manager", "manager", { order_url: `${SITE}/checkout/${orderId}` });
    await db.update(schema.purchaseRequests).set({ paidNotifiedAt: now }).where(and(eq(schema.purchaseRequests.id, r.id), sql`${schema.purchaseRequests.paidNotifiedAt} IS NULL`));
  } catch { /* delivery must not depend on this */ }
}

export type AdminRow = { id: number; reference: string; requester: string; manager: string; items: Snap[]; totalCents: number; status: Status; createdAt: number; expiresAt: number; orderId: string | null; requesterEmailStatus: string; managerEmailStatus: string; declineReason: string | null };
export async function listRequests(db: Db, limit = 200): Promise<AdminRow[] | null> {
  try {
    const rows = await db.select().from(schema.purchaseRequests).orderBy(desc(schema.purchaseRequests.id)).limit(limit);
    const ids = rows.map((r) => r.orderId).filter((x): x is string => !!x);
    const orders = ids.length ? await db.select({ id: schema.orders.id, status: schema.orders.status }).from(schema.orders).where(inArray(schema.orders.id, ids)) : [];
    return rows.map((r) => {
      const paid = r.orderId ? orders.find((o) => o.id === r.orderId)?.status === "paid" : false;
      return { id: r.id, reference: r.reference, requester: `${r.requesterName} <${r.requesterEmail}>`, manager: `${r.managerName || "-"} <${r.managerEmail}>`, items: snapOf(r.itemsJson), totalCents: r.totalCents, status: paid ? "paid" : effective(r), createdAt: r.createdAt, expiresAt: r.expiresAt, orderId: r.orderId, requesterEmailStatus: r.requesterEmailStatus, managerEmailStatus: r.managerEmailStatus, declineReason: r.declineReason };
    });
  } catch { return null; }
}
export async function cancelRequest(db: Db, id: number): Promise<boolean> {
  const up = await db.update(schema.purchaseRequests).set({ status: "cancelled", decidedAt: Math.floor(Date.now() / 1000) }).where(and(eq(schema.purchaseRequests.id, id), inArray(schema.purchaseRequests.status, OPEN))).returning({ id: schema.purchaseRequests.id });
  return up.length > 0;
}
/** Admin: send the manager a fresh secure link (the old link stops working). Only for open requests. */
export async function resendManager(env: CloudflareEnv, id: number): Promise<"sent" | "failed" | "closed"> {
  const db = getDbFromEnv(env);
  const [r] = await db.select().from(schema.purchaseRequests).where(eq(schema.purchaseRequests.id, id));
  if (!r || !OPEN.includes(effective(r))) return "closed";
  const token = newToken();
  await db.update(schema.purchaseRequests).set({ tokenHash: await tokenHash(env, token) }).where(eq(schema.purchaseRequests.id, id));
  const ok = await send(env, db, r, "team_request_manager", "manager", { request_url: `${SITE}/purchase-request/${token}` }, `${r.reference}:manager:resend:${Date.now()}`);
  await db.update(schema.purchaseRequests).set({ managerEmailStatus: ok ? "sent" : "failed" }).where(eq(schema.purchaseRequests.id, id)).catch(() => undefined);
  return ok ? "sent" : "failed";
}
