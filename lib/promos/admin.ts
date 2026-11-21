// Promotions admin: validation, create/edit/duplicate/delete, status changes and real analytics (no invented numbers).
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";
import { getCategories, getProducts } from "@/lib/catalog";
import { schema, type getDbFromEnv } from "@/lib/db";
import { isTestNetwork, optionForWallet } from "@/lib/payments/options";
import { isPartnerCode } from "@/lib/partners/types";
import { PROMO_CODE_RE, normalizePromoCode, promoWindow, type Promo } from "./engine";
import { rowToPromo } from "./store";

type Db = ReturnType<typeof getDbFromEnv>;
export class PromoError extends Error {}

export const PACKAGE_TIERS = ["Starter", "Professional", "Complete"] as const;
export const BANNER_PLACES = [["home", "Homepage"], ["lists", "Lists directory"], ["product", "Eligible product pages"], ["cart", "Cart page"]] as const;
export const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"] as const;

/** Local wall-clock time ("2026-12-01T09:00") in an IANA zone -> epoch seconds (UTC). Throws on a bad value. */
export function zonedToEpoch(local: string, tz: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new PromoError("Enter a valid date and time.");
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (t: number) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(t));
    const g = (k: string) => Number(parts.find((p) => p.type === k)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - t;
  };
  let t = asUtc - offsetAt(asUtc);
  t = asUtc - offsetAt(t); // second pass fixes the guess across a DST change
  return Math.floor(t / 1000);
}
/** Epoch seconds -> "YYYY-MM-DDTHH:mm" wall-clock in a zone (for the edit form). */
export function epochToZoned(sec: number | null, tz: string): string {
  if (sec === null) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(sec * 1000));
  const g = (k: string) => parts.find((p) => p.type === k)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

const money = (label: string) => z.preprocess((v) => (v === "" || v === undefined || v === null ? null : Number(v)), z.number({ error: `${label} must be a number.` }).min(0).max(100000).nullable());
const intOrNull = (label: string, max = 1_000_000) => z.preprocess((v) => (v === "" || v === undefined || v === null ? null : Number(v)), z.number({ error: `${label} must be a whole number.` }).int().min(1).max(max).nullable());
const list = z.array(z.string().trim().min(1).max(80)).max(200).default([]);

export const promoInput = z.object({
  name: z.string().trim().min(2, "Give the campaign an internal name.").max(80),
  title: z.string().trim().min(2, "Write the title customers will see.").max(60),
  description: z.string().trim().max(300).default(""),
  kind: z.enum(["percent", "fixed"]),
  /** percent 1-100, or dollars for fixed (converted to cents) */
  value: z.preprocess((v) => Number(v), z.number({ error: "Enter the discount amount." }).positive("The discount must be above zero.").max(100000)),
  mode: z.enum(["code", "automatic"]),
  code: z.string().trim().max(30).default(""),
  productSlugs: list, categorySlugs: list, packageNames: list,
  minCart: money("Minimum cart value"), maxDiscount: money("Maximum discount"),
  startsLocal: z.string().default(""), endsLocal: z.string().default(""),
  timezone: z.enum(TIMEZONES).default("UTC"),
  usageLimit: intOrNull("Total usage limit"), perCustomerLimit: intOrNull("Per-customer limit", 1000),
  eligibility: z.enum(["everyone", "first", "partners"]).default("everyone"),
  combinable: z.coerce.boolean().default(false),
  bannerPlaces: z.array(z.enum(["home", "lists", "product", "cart"])).default([]),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
});
export type PromoInput = z.infer<typeof promoInput>;

const catalogSlugs = () => ({ products: new Set(getProducts().map((p) => p.slug)), categories: new Set(getCategories().map((c) => c.slug)) });

/** Validates the whole promotion and returns the row to store. Throws PromoError with a message an admin can act on. */
export function toRow(i: PromoInput): Omit<typeof schema.promotions.$inferInsert, "id" | "createdAt"> {
  if (i.kind === "percent" && (i.value < 1 || i.value > 100 || !Number.isInteger(i.value))) throw new PromoError("A percentage must be a whole number from 1 to 100.");
  const cents = i.kind === "fixed" ? Math.round(i.value * 100) : Math.round(i.value);
  if (i.kind === "fixed" && cents < 1) throw new PromoError("A fixed discount must be at least $0.01.");
  const cat = catalogSlugs();
  const badProduct = i.productSlugs.find((s) => !cat.products.has(s));
  if (badProduct) throw new PromoError(`"${badProduct}" is not a list in the catalog.`);
  const badCat = i.categorySlugs.find((s) => !cat.categories.has(s));
  if (badCat) throw new PromoError(`"${badCat}" is not an industry in the catalog.`);
  const badPkg = i.packageNames.find((s) => !(PACKAGE_TIERS as readonly string[]).includes(s));
  if (badPkg) throw new PromoError(`"${badPkg}" is not a package tier.`);
  let code: string | null = null;
  if (i.mode === "code") {
    code = normalizePromoCode(i.code);
    if (!PROMO_CODE_RE.test(code)) throw new PromoError("Use 3-30 letters, numbers, - or _ for the code (for example WELCOME20).");
    if (isPartnerCode(code)) throw new PromoError("That code format is reserved for personal partner codes. Choose another.");
  }
  const startsAt = i.startsLocal ? zonedToEpoch(i.startsLocal, i.timezone) : null;
  const endsAt = i.endsLocal ? zonedToEpoch(i.endsLocal, i.timezone) : null;
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) throw new PromoError("The end date must be after the start date.");
  if (i.eligibility === "partners" && i.mode === "automatic") throw new PromoError("A partner-only promotion needs a code: partners enter it with their own email.");
  return {
    name: i.name, title: i.title, code, description: i.description || null, kind: i.kind, value: cents,
    productSlugs: JSON.stringify(i.productSlugs), categorySlugs: JSON.stringify(i.categorySlugs), packageNames: JSON.stringify(i.packageNames),
    minCartCents: Math.round((i.minCart ?? 0) * 100), maxDiscountCents: i.maxDiscount ? Math.round(i.maxDiscount * 100) : null,
    startsAt, endsAt, timezone: i.timezone, usageLimit: i.usageLimit, perCustomerLimit: i.perCustomerLimit,
    firstPurchaseOnly: i.eligibility === "first" ? 1 : 0, partnerOnly: i.eligibility === "partners" ? 1 : 0,
    automatic: i.mode === "automatic" ? 1 : 0, combinable: i.combinable ? 1 : 0, status: i.status,
    bannerPlaces: JSON.stringify(i.bannerPlaces), updatedAt: Math.floor(Date.now() / 1000),
  };
}

async function codeTaken(db: Db, code: string | null, exceptId?: number) {
  if (!code) return false;
  const [r] = await db.select({ id: schema.promotions.id }).from(schema.promotions).where(eq(schema.promotions.code, code)).limit(1);
  return !!r && r.id !== exceptId;
}

export async function createPromo(db: Db, i: PromoInput): Promise<number> {
  const row = toRow(i);
  if (await codeTaken(db, row.code ?? null)) throw new PromoError("Another promotion already uses that code.");
  const [r] = await db.insert(schema.promotions).values(row).returning({ id: schema.promotions.id });
  return r.id;
}
export async function updatePromo(db: Db, id: number, i: PromoInput): Promise<void> {
  const row = toRow(i);
  if (await codeTaken(db, row.code ?? null, id)) throw new PromoError("Another promotion already uses that code.");
  await db.update(schema.promotions).set(row).where(eq(schema.promotions.id, id));
}
export async function setPromoStatus(db: Db, id: number, status: "draft" | "active" | "paused"): Promise<void> {
  await db.update(schema.promotions).set({ status, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.promotions.id, id));
}
/** Copy as a DRAFT with no code (a code must be unique) so nothing goes live by accident. */
export async function duplicatePromo(db: Db, id: number): Promise<number> {
  const [r] = await db.select().from(schema.promotions).where(eq(schema.promotions.id, id));
  if (!r) throw new PromoError("Promotion not found.");
  const { id: _id, ...rest } = r; void _id;
  const [n] = await db.insert(schema.promotions).values({ ...rest, name: `${r.name} (copy)`.slice(0, 80), code: null, automatic: r.automatic, status: "draft", createdAt: new Date(), updatedAt: Math.floor(Date.now() / 1000) }).returning({ id: schema.promotions.id });
  return n.id;
}
/** A promotion that was ever used keeps its history: it can be paused but not deleted. */
export async function deletePromo(db: Db, id: number): Promise<void> {
  const [u] = await db.select({ n: sql<number>`count(*)` }).from(schema.promotionRedemptions).where(eq(schema.promotionRedemptions.promotionId, id));
  if (Number(u?.n ?? 0) > 0) throw new PromoError("This promotion has been used by real orders, so its history is kept. Pause it instead.");
  await db.delete(schema.promotions).where(eq(schema.promotions.id, id));
}

export type Row = { promo: Promo; shown: "draft" | "paused" | "scheduled" | "active" | "expired"; uses: number; reserved: number; discountCents: number; revenueCents: number };
export type Stats = {
  rows: Row[];
  active: number; scheduled: number; expired: number;
  redemptions: number; discountCents: number; revenueCents: number;
  top: { code: string; name: string; uses: number }[];
  partner: { uses: number; orders: number; discountCents: number; revenueCents: number };
  testExcluded: number;
};

/** Public status of a promotion for the table: what is true right now. */
export function shownStatus(p: Promo, nowSec: number): Row["shown"] {
  if (p.status === "draft") return "draft";
  if (p.status === "paused") return "paused";
  const w = promoWindow(p, nowSec);
  return w === "live" ? "active" : w;
}

/** Real numbers only. Revenue = totals of PAID orders that used a promotion (test-network payments are left out and counted separately). */
export async function loadStats(db: Db, range: { from?: number; to?: number } = {}, nowSec = Math.floor(Date.now() / 1000)): Promise<Stats | null> {
  try {
    const promos = (await db.select().from(schema.promotions)).map(rowToPromo).filter((p) => p.origin !== "reward" && p.origin !== "negotiation"); // reward codes and BeigePilot offers have their own admin pages
    const reds = await db.select().from(schema.promotionRedemptions);
    const orderIds = [...new Set(reds.filter((r) => r.status === "redeemed").map((r) => r.orderId))];
    const real = new Set<string>();
    let testExcluded = 0;
    for (let i = 0; i < orderIds.length; i += 90) {
      const slice = orderIds.slice(i, i + 90);
      const att = await db.select({ orderId: schema.paymentAttempts.orderId, coin: schema.paymentAttempts.coin, network: schema.paymentAttempts.network }).from(schema.paymentAttempts).where(and(inArray(schema.paymentAttempts.orderId, slice), eq(schema.paymentAttempts.status, "paid")));
      for (const a of att) { const o = optionForWallet(a.coin, a.network); if (o && isTestNetwork(o, a.network)) testExcluded++; else real.add(a.orderId); }
    }
    const inRange = (r: (typeof reds)[number]) => r.status === "redeemed" && real.has(r.orderId) && (range.from === undefined || (r.redeemedAt ?? 0) >= range.from) && (range.to === undefined || (r.redeemedAt ?? 0) < range.to);
    const rows: Row[] = promos.map((p) => {
      const mine = reds.filter((r) => r.promotionId === p.id);
      const done = mine.filter(inRange);
      // Revenue is counted once per order even when two promotions stacked on it.
      return { promo: p, shown: shownStatus(p, nowSec), uses: done.length, reserved: mine.filter((r) => r.status === "reserved").length, discountCents: done.reduce((a, r) => a + r.discountCents, 0), revenueCents: done.reduce((a, r) => a + r.orderTotalCents, 0) };
    });
    const doneAll = reds.filter(inRange);
    const revenueByOrder = new Map(doneAll.map((r) => [r.orderId, r.orderTotalCents]));
    const [pu] = await db.select({ uses: sql<number>`coalesce(sum(${schema.partnerDiscounts.uses}),0)` }).from(schema.partnerDiscounts);
    const pOrders = await db.select({ id: schema.orders.id, total: schema.orders.totalUsdCents, disc: schema.orders.discountCents, sub: schema.orders.subtotalCents }).from(schema.orders).where(and(eq(schema.orders.status, "paid"), like(schema.orders.discountCode, "PARTNER-%")));
    return {
      rows, active: rows.filter((r) => r.shown === "active").length, scheduled: rows.filter((r) => r.shown === "scheduled").length, expired: rows.filter((r) => r.shown === "expired").length,
      redemptions: doneAll.length, discountCents: doneAll.reduce((a, r) => a + r.discountCents, 0), revenueCents: [...revenueByOrder.values()].reduce((a, b) => a + b, 0),
      top: rows.filter((r) => r.uses > 0).sort((a, b) => b.uses - a.uses).slice(0, 5).map((r) => ({ code: r.promo.code ?? "(automatic)", name: r.promo.name, uses: r.uses })),
      partner: { uses: Number(pu?.uses ?? 0), orders: pOrders.length, discountCents: pOrders.reduce((a, o) => a + (o.disc ?? ((o.sub ?? o.total) - o.total)), 0), revenueCents: pOrders.reduce((a, o) => a + o.total, 0) },
      testExcluded,
    };
  } catch { return null; }
}

export const randomCode = (prefix = "SAVE") => {
  const A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const b = crypto.getRandomValues(new Uint8Array(5));
  return `${prefix}-${Array.from(b, (x) => A[x % A.length]).join("")}`;
};
