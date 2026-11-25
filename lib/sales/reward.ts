import { emailConfigured } from "@/lib/email/credentials";
// Second Purchase Offer (CLAUDE.md section 113). After a customer's FIRST paid order a personal, single-use code is created and emailed.
// The code is an ordinary row in `promotions` (origin "reward", bound to the buyer's email, usage limit 1), so the existing engine,
// reservation (reserved -> redeemed on payment -> released when the order expires) and refund-safe amounts apply unchanged.
import { and, desc, eq, inArray, or, isNull, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { loadSalesSettings, type RewardSettings } from "./settings";

type Db = ReturnType<typeof getDbFromEnv>;
export const normEmail = (e: string) => e.trim().toLowerCase();

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
/** BEIGE-XXXXXX with 6 characters from a 32-letter alphabet (about 1e9 codes), from the platform's secure random generator. */
export function makeCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return `BEIGE-${[...b].map((x) => ALPHABET[x % 32]).join("")}`;
}

export const fmtUsd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const fmtDay = (sec: number) => new Date(sec * 1000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The real rules of the offer, written from the current settings (used in the email and the admin preview). */
export function rewardTerms(s: Pick<RewardSettings, "percent" | "maxDiscountCents" | "combineVolume" | "productSlugs" | "categorySlugs">, expiresSec: number): string {
  const parts = [
    `Valid for one order until ${fmtDay(expiresSec)}.`,
    s.maxDiscountCents ? `The most you can save is ${fmtUsd(s.maxDiscountCents)}.` : "",
    s.productSlugs.length || s.categorySlugs.length ? "Applies to eligible lists only." : "Applies to ready-made lists.",
    s.combineVolume ? "" : "Cannot be combined with other offers.",
    "Personal to the email address of your order and can be used once.",
  ];
  return parts.filter(Boolean).join(" ");
}

export type IssueResult = "disabled" | "not-paid" | "below-minimum" | "not-first" | "exists" | "issued" | "error";

/** Is this order the customer's first PAID order? Counts every earlier paid order, including those from before this feature existed. */
export async function isFirstPaidOrder(db: Db, orderId: string, email: string): Promise<boolean> {
  const mail = normEmail(email);
  const [me] = await db.select({ paidAt: schema.orders.paidAt, createdAt: schema.orders.createdAt }).from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!me) return false;
  const mine = me.paidAt ?? me.createdAt;
  const rows = await db.select({ id: schema.orders.id, paidAt: schema.orders.paidAt, createdAt: schema.orders.createdAt }).from(schema.orders)
    .where(and(eq(sql`lower(${schema.orders.email})`, mail), eq(schema.orders.status, "paid")));
  return !rows.some((r) => r.id !== orderId && ((r.paidAt ?? r.createdAt).getTime() < mine.getTime() || ((r.paidAt ?? r.createdAt).getTime() === mine.getTime() && r.id < orderId)));
}

/**
 * Called when an order is paid (idempotent, safe to call again for the same order or from a retried webhook/cron run).
 * One reward per customer EVER: the unique indexes on email and first_order_id make a concurrent second call a no-op.
 */
export async function issueReward(env: CloudflareEnv, orderId: string): Promise<IssueResult> {
  try {
    const { reward } = await loadSalesSettings(env);
    const db = getDbFromEnv(env);
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    if (!order || order.status !== "paid") return "not-paid";
    const email = normEmail(order.email);
    const [already] = await db.select().from(schema.rewardCodes).where(or(eq(schema.rewardCodes.email, email), eq(schema.rewardCodes.firstOrderId, orderId)));
    if (already) { if (already.firstOrderId === orderId && already.emailStatus !== "sent") await sendRewardEmail(env, already.id, "reward_first"); return "exists"; }
    if (!reward.enabled) return "disabled";
    if (order.totalUsdCents < reward.minOrderCents) return "below-minimum";
    if (!(await isFirstPaidOrder(db, orderId, email))) return "not-first";

    const now = Math.floor(Date.now() / 1000);
    const expires = now + reward.expiryDays * 86400;
    for (let tryNo = 0; tryNo < 5; tryNo++) {
      const code = makeCode();
      // 1. claim: the unique indexes decide who issues the reward when two payment events race
      const claim = await db.insert(schema.rewardCodes).values({ email, firstOrderId: orderId, promotionId: 0, code, percent: reward.percent, maxDiscountCents: reward.maxDiscountCents, expiresAt: expires })
        .onConflictDoNothing().returning({ id: schema.rewardCodes.id });
      if (claim.length === 0) {
        const [dup] = await db.select({ id: schema.rewardCodes.id }).from(schema.rewardCodes).where(or(eq(schema.rewardCodes.email, email), eq(schema.rewardCodes.firstOrderId, orderId)));
        if (dup) return "exists"; // someone else issued it
        continue; // the random code collided: pick another
      }
      // 2. the promotion that actually prices the discount
      try {
        const [promo] = await db.insert(schema.promotions).values({
          name: `Second purchase reward ${code}`, title: "Second Purchase Offer", code, description: "Personal reward code", kind: "percent", value: reward.percent,
          productSlugs: JSON.stringify(reward.productSlugs), categorySlugs: JSON.stringify(reward.categorySlugs), packageNames: "[]",
          minCartCents: 0, maxDiscountCents: reward.maxDiscountCents, startsAt: now, endsAt: expires, usageLimit: 1, perCustomerLimit: 1,
          firstPurchaseOnly: 0, partnerOnly: 0, automatic: 0, combinable: 0, status: "active", bannerPlaces: "[]", boundEmail: email, origin: "reward",
        }).returning({ id: schema.promotions.id });
        await db.update(schema.rewardCodes).set({ promotionId: promo.id }).where(eq(schema.rewardCodes.id, claim[0].id));
      } catch {
        await db.delete(schema.rewardCodes).where(eq(schema.rewardCodes.id, claim[0].id)).catch(() => undefined);
        return "error";
      }
      await sendRewardEmail(env, claim[0].id, "reward_first");
      return "issued";
    }
    return "error";
  } catch { return "error"; } // never blocks delivery
}

type Kind = "reward_first" | "reward_reminder" | "reward_expiring";

/** Sends one reward email through the branded template (once per code and kind; real status is stored). Never claims delivery from queueing. */
export async function sendRewardEmail(env: CloudflareEnv, rewardId: number, kind: Kind): Promise<"sent" | "already-sent" | "skipped" | "failed"> {
  const db = getDbFromEnv(env);
  const [r] = await db.select().from(schema.rewardCodes).where(eq(schema.rewardCodes.id, rewardId));
  if (!r || r.status !== "active") return "skipped";
  const { reward } = await loadSalesSettings(env);
  const vars = {
    discount_code: r.code, discount_percent: `${r.percent}%`, expiration_date: fmtDay(r.expiresAt),
    discount_terms: rewardTerms({ ...reward, percent: r.percent, maxDiscountCents: r.maxDiscountCents }, r.expiresAt),
  };
  const ref = kind === "reward_first" ? `reward:${r.id}` : `reward:${r.id}:${kind}`;
  const res = await sendOnce(env, db, kind, r.email, vars, ref);
  if (kind === "reward_first") {
    const status = res === "sent" || res === "already-sent" ? "sent" : res === "failed" ? "failed" : r.emailStatus === "sent" ? "sent" : "pending";
    await db.update(schema.rewardCodes).set({ emailStatus: status, emailError: status === "failed" ? "The email service did not accept the message." : null }).where(eq(schema.rewardCodes.id, r.id)).catch(() => undefined);
  }
  return res;
}

/** Is the code still unused? A reserved or redeemed redemption stops the reminders. */
async function isUsed(db: Db, promotionId: number): Promise<boolean> {
  const [x] = await db.select({ n: sql<number>`count(*)` }).from(schema.promotionRedemptions)
    .where(and(eq(schema.promotionRedemptions.promotionId, promotionId), inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"])));
  return Number(x?.n ?? 0) > 0;
}

/** Cron (every 15 minutes): the two reminder emails, only for valid, unused, unrevoked codes. Each is sent once. */
export async function sendRewardReminders(env: CloudflareEnv): Promise<{ sent: number }> {
  let sent = 0;
  try {
    const { reward } = await loadSalesSettings(env);
    if (!reward.reminders || !(await emailConfigured(env))) return { sent };
    const db = getDbFromEnv(env);
    const now = Math.floor(Date.now() / 1000);
    const rows = await db.select().from(schema.rewardCodes)
      .where(and(eq(schema.rewardCodes.status, "active"), eq(schema.rewardCodes.emailStatus, "sent"), sql`${schema.rewardCodes.expiresAt} > ${now}`, or(isNull(schema.rewardCodes.reminder1At), isNull(schema.rewardCodes.reminder2At))))
      .limit(100);
    for (const r of rows) {
      if (await isUsed(db, r.promotionId)) continue;
      const expiryWindow = r.expiresAt - reward.expiryReminderHours * 3600;
      const due1 = r.reminder1At === null && now >= r.createdAt.getTime() / 1000 + reward.reminderDays * 86400 && now < expiryWindow;
      const due2 = r.reminder2At === null && now >= expiryWindow;
      if (due1) { const x = await sendRewardEmail(env, r.id, "reward_reminder"); if (x === "sent" || x === "already-sent") { sent += x === "sent" ? 1 : 0; await db.update(schema.rewardCodes).set({ reminder1At: now }).where(eq(schema.rewardCodes.id, r.id)); } }
      else if (due2) { const x = await sendRewardEmail(env, r.id, "reward_expiring"); if (x === "sent" || x === "already-sent") { sent += x === "sent" ? 1 : 0; await db.update(schema.rewardCodes).set({ reminder2At: now }).where(eq(schema.rewardCodes.id, r.id)); } }
    }
  } catch { /* the next run tries again */ }
  return { sent };
}

export type RewardRow = {
  id: number; email: string; firstOrderId: string; code: string; percent: number; maxDiscountCents: number | null;
  status: "active" | "used" | "expired" | "revoked"; createdAt: number; expiresAt: number; redeemedAt: number | null; redeemedOrderId: string | null;
  emailStatus: string; emailError: string | null;
};
export const maskEmail = (e: string) => { const [u, d] = e.split("@"); return `${u.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d ?? ""}`; };

export async function listRewards(db: Db, limit = 200): Promise<RewardRow[] | null> {
  try {
    const rows = await db.select().from(schema.rewardCodes).orderBy(desc(schema.rewardCodes.id)).limit(limit);
    const ids = rows.map((r) => r.promotionId).filter((n) => n > 0);
    const reds = ids.length ? await db.select().from(schema.promotionRedemptions).where(inArray(schema.promotionRedemptions.promotionId, ids)) : [];
    const now = Math.floor(Date.now() / 1000);
    return rows.map((r) => {
      const used = reds.find((x) => x.promotionId === r.promotionId && x.status === "redeemed");
      const status: RewardRow["status"] = r.status === "revoked" ? "revoked" : used ? "used" : r.expiresAt <= now ? "expired" : "active";
      return { id: r.id, email: r.email, firstOrderId: r.firstOrderId, code: r.code, percent: r.percent, maxDiscountCents: r.maxDiscountCents, status, createdAt: r.createdAt.getTime() / 1000, expiresAt: r.expiresAt, redeemedAt: used?.redeemedAt ?? null, redeemedOrderId: used?.orderId ?? null, emailStatus: r.emailStatus, emailError: r.emailError };
    });
  } catch { return null; }
}

/** Revokes a code: it can no longer be applied (the promotion is paused) and reminders stop. A paid use stays as it was. */
export async function revokeReward(db: Db, id: number): Promise<boolean> {
  const [r] = await db.select().from(schema.rewardCodes).where(eq(schema.rewardCodes.id, id));
  if (!r || r.status === "revoked") return false;
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.update(schema.rewardCodes).set({ status: "revoked", revokedAt: now }).where(eq(schema.rewardCodes.id, id)),
    db.update(schema.promotions).set({ status: "paused", updatedAt: now }).where(eq(schema.promotions.id, r.promotionId)),
  ]);
  return true;
}

/** Order confirmation message: only when a reward was really created AND its email was accepted by the email service. */
export async function rewardSentForOrder(db: Db, orderId: string): Promise<boolean> {
  try {
    const [r] = await db.select({ s: schema.rewardCodes.emailStatus, st: schema.rewardCodes.status }).from(schema.rewardCodes).where(eq(schema.rewardCodes.firstOrderId, orderId));
    return r?.s === "sent" && r.st === "active";
  } catch { return false; }
}
