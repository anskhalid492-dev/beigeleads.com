// Promotions: database access. Every read used by the cart/checkout NEVER throws (before migration 0034 the result is "no promotions").
import { and, eq, inArray, sql } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import type { Applied, Candidate, Promo, PromoFacts } from "./engine";

type Db = ReturnType<typeof getDbFromEnv>;
type Row = typeof schema.promotions.$inferSelect;

const list = (raw: string): string[] => { try { const j = JSON.parse(raw) as unknown; return Array.isArray(j) ? j.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };

export function rowToPromo(r: Row): Promo {
  return {
    id: r.id, name: r.name, title: r.title, code: r.code, description: r.description ?? "", kind: r.kind, value: r.value,
    productSlugs: list(r.productSlugs), categorySlugs: list(r.categorySlugs), packageNames: list(r.packageNames),
    minCartCents: r.minCartCents, maxDiscountCents: r.maxDiscountCents, startsAt: r.startsAt, endsAt: r.endsAt,
    usageLimit: r.usageLimit, perCustomerLimit: r.perCustomerLimit,
    firstPurchaseOnly: !!r.firstPurchaseOnly, partnerOnly: !!r.partnerOnly, automatic: !!r.automatic, combinable: !!r.combinable,
    status: r.status, bannerPlaces: list(r.bannerPlaces),
    boundEmail: r.boundEmail ? r.boundEmail.toLowerCase() : null, origin: r.origin === "reward" ? "reward" : r.origin === "negotiation" ? "negotiation" : "admin",
  };
}

/** Active promotions with the buyer-specific facts the engine needs. `email` unknown (cart before checkout) leaves those facts null. */
export async function loadCandidates(db: Db, email?: string): Promise<Candidate[]> {
  try {
    const rows = await db.select().from(schema.promotions).where(eq(schema.promotions.status, "active"));
    if (rows.length === 0) return [];
    const counted = await db.select({ id: schema.promotionRedemptions.promotionId, n: sql<number>`count(*)` }).from(schema.promotionRedemptions)
      .where(inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"])).groupBy(schema.promotionRedemptions.promotionId);
    const total = new Map(counted.map((c) => [c.id, Number(c.n)]));
    const mail = email?.trim().toLowerCase();
    let perCustomer = new Map<number, number>();
    let first: boolean | null = null;
    let partner: boolean | null = null;
    if (mail) {
      const mine = await db.select({ id: schema.promotionRedemptions.promotionId, n: sql<number>`count(*)` }).from(schema.promotionRedemptions)
        .where(and(eq(schema.promotionRedemptions.email, mail), inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"]))).groupBy(schema.promotionRedemptions.promotionId);
      perCustomer = new Map(mine.map((c) => [c.id, Number(c.n)]));
      const [paid] = await db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(and(eq(sql`lower(${schema.orders.email})`, mail), eq(schema.orders.status, "paid")));
      first = Number(paid?.n ?? 0) === 0;
      const [p] = await db.select({ id: schema.partnerDiscounts.id }).from(schema.partnerDiscounts)
        .innerJoin(schema.partnerApplications, eq(schema.partnerApplications.id, schema.partnerDiscounts.applicationId))
        .where(and(eq(schema.partnerDiscounts.email, mail), eq(schema.partnerDiscounts.active, 1), eq(schema.partnerApplications.status, "approved"))).limit(1);
      partner = !!p;
    }
    return rows.map((r) => {
      const facts: PromoFacts = { totalUses: total.get(r.id) ?? 0, customerUses: mail ? (perCustomer.get(r.id) ?? 0) : null, firstPurchase: first, partner, emailMatch: r.boundEmail ? (mail ? mail === r.boundEmail.toLowerCase() : null) : true };
      return { promo: rowToPromo(r), facts };
    });
  } catch { return []; }
}

export type ReserveResult = { ok: true } | { ok: false; reason: "limit" | "customer" | "error" };

/**
 * Called right after the order rows exist. Inserts one `reserved` row per applied promotion (idempotent: unique per order + promotion),
 * then re-counts. If another buyer took the last use in the meantime the caller rolls the order back, so a limit cannot be exceeded by a race.
 */
export async function reserveRedemptions(db: Db, orderId: string, email: string, applied: Applied[], orderTotalCents: number): Promise<ReserveResult> {
  const promos = applied.filter((a): a is Applied & { promotionId: number } => a.promotionId !== null);
  if (promos.length === 0) return { ok: true };
  const mail = email.trim().toLowerCase();
  try {
    for (const a of promos) {
      await db.insert(schema.promotionRedemptions).values({ promotionId: a.promotionId, orderId, email: mail, code: a.code || null, discountCents: a.cents, orderTotalCents }).onConflictDoNothing();
    }
    const rows = await db.select().from(schema.promotions).where(inArray(schema.promotions.id, promos.map((a) => a.promotionId)));
    for (const p of rows) {
      const [all] = await db.select({ n: sql<number>`count(*)` }).from(schema.promotionRedemptions).where(and(eq(schema.promotionRedemptions.promotionId, p.id), inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"])));
      if (p.usageLimit !== null && Number(all?.n ?? 0) > p.usageLimit) return { ok: false, reason: "limit" };
      if (p.perCustomerLimit !== null) {
        const [mine] = await db.select({ n: sql<number>`count(*)` }).from(schema.promotionRedemptions).where(and(eq(schema.promotionRedemptions.promotionId, p.id), eq(schema.promotionRedemptions.email, mail), inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"])));
        if (Number(mine?.n ?? 0) > p.perCustomerLimit) return { ok: false, reason: "customer" };
      }
    }
    return { ok: true };
  } catch { return { ok: false, reason: "error" }; }
}

/** Removes the reservation of an order that is being rolled back. */
export async function dropReservations(db: Db, orderId: string): Promise<void> {
  try { await db.delete(schema.promotionRedemptions).where(eq(schema.promotionRedemptions.orderId, orderId)); } catch { /* table missing: nothing to drop */ }
}

/** Payment confirmed: the redemption becomes final. Safe to call twice (only reserved/released rows change). */
export async function markRedeemed(db: Db, orderId: string): Promise<number> {
  try {
    const r = await db.update(schema.promotionRedemptions).set({ status: "redeemed", redeemedAt: Math.floor(Date.now() / 1000) })
      .where(and(eq(schema.promotionRedemptions.orderId, orderId), inArray(schema.promotionRedemptions.status, ["reserved", "released"]))).returning({ id: schema.promotionRedemptions.id });
    return r.length;
  } catch { return 0; }
}

/** The order expired unpaid: the use goes back to the pool. */
export async function releaseOrder(db: Db, orderId: string): Promise<void> {
  try { await db.update(schema.promotionRedemptions).set({ status: "released" }).where(and(eq(schema.promotionRedemptions.orderId, orderId), eq(schema.promotionRedemptions.status, "reserved"))); } catch { /* table missing */ }
}
