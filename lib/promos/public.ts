// What visitors may see about promotions: product-page prices and banners. Only promotions that are REALLY live right now are exposed,
// and a promo CODE is revealed only when the admin turned a banner on for it. Read through one cached KV value (no D1 read per visit).
import { eq, inArray, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { applyPromotions, lineEligible, promoWindow, type Promo } from "./engine";
import { rowToPromo } from "./store";

const KEY = "promos:pub:v1";
const TTL = 60;

/** Live, publicly shown promotions. Excludes partner-only, first-purchase-only, exhausted and not-currently-live ones. */
export async function getPublicPromos(env: CloudflareEnv, nowSec = Math.floor(Date.now() / 1000)): Promise<Promo[]> {
  let list: Promo[] | null = null;
  try { const raw = await env.CACHE.get(KEY); if (raw) list = JSON.parse(raw) as Promo[]; } catch { /* cache unavailable: read the database */ }
  if (!list) {
    try {
      const rows = await getDbFromEnv(env).select().from(schema.promotions).where(eq(schema.promotions.status, "active"));
      const used = await getDbFromEnv(env).select({ id: schema.promotionRedemptions.promotionId, n: sql<number>`count(*)` }).from(schema.promotionRedemptions)
        .where(inArray(schema.promotionRedemptions.status, ["reserved", "redeemed"])).groupBy(schema.promotionRedemptions.promotionId);
      const n = new Map(used.map((u) => [u.id, Number(u.n)]));
      list = rows.map(rowToPromo)
        .filter((p) => !p.partnerOnly && !p.firstPurchaseOnly && (p.automatic || p.bannerPlaces.length > 0) && (p.usageLimit === null || (n.get(p.id) ?? 0) < p.usageLimit))
        .map((p) => ({ ...p, code: p.automatic || p.bannerPlaces.length > 0 ? p.code : null }));
      await env.CACHE.put(KEY, JSON.stringify(list), { expirationTtl: TTL }).catch(() => undefined);
    } catch { return []; }
  }
  return list.filter((p) => promoWindow(p, nowSec) === "live");
}
export const clearPublicPromos = (env: CloudflareEnv) => env.CACHE.delete(KEY).catch(() => undefined);

export type PlaceName = "home" | "lists" | "product" | "cart";
export type Banner = { id: number; title: string; text: string; code: string | null; endsAt: number | null };

/** The one banner to show in a place, or null. On product pages only promotions that cover that product count. */
export function bannerFor(promos: Promo[], place: PlaceName, product?: { slug: string; categorySlug: string }): Banner | null {
  const pick = promos
    .filter((p) => p.bannerPlaces.includes(place))
    .filter((p) => place !== "product" || !product || lineEligible(p, { slug: product.slug, categorySlug: product.categorySlug, packageName: p.packageNames[0] ?? "", priceCents: 0 }))
    .sort((a, b) => (b.kind === "percent" ? b.value : 0) - (a.kind === "percent" ? a.value : 0) || a.id - b.id)[0];
  if (!pick) return null;
  const how = pick.code ? ` Use code ${pick.code} at checkout.` : " Applied automatically at checkout.";
  return { id: pick.id, title: pick.title, text: `${pick.title}.${how}`, code: pick.code, endsAt: pick.endsAt };
}

export type ShownPrice = { originalCents: number; nowCents: number; saveCents: number; savePercent: number; code: string | null; automatic: boolean; title: string };

/** What a package costs after the best AUTOMATIC promotion, and separately with the best advertised code. null = no promotion covers it. */
export function shownPrice(promos: Promo[], product: { slug: string; categorySlug: string }, pkg: { name: string; priceUsdCents: number }, nowSec = Math.floor(Date.now() / 1000)): { auto: ShownPrice | null; code: ShownPrice | null } {
  const line = [{ slug: product.slug, categorySlug: product.categorySlug, packageName: pkg.name, priceCents: pkg.priceUsdCents }];
  const facts = { totalUses: 0, customerUses: null, firstPurchase: null, partner: null };
  const mk = (code: string | null, automatic: boolean, r: ReturnType<typeof applyPromotions>): ShownPrice | null =>
    r.discountCents > 0 ? { originalCents: pkg.priceUsdCents, nowCents: r.payCents[0], saveCents: r.discountCents, savePercent: Math.round((r.discountCents / pkg.priceUsdCents) * 100), code, automatic, title: r.applied[0]?.title ?? "" } : null;
  const auto = mk(null, true, applyPromotions(line, { candidates: promos.filter((p) => p.automatic).map((promo) => ({ promo, facts })), nowSec, emailKnown: false }));
  let best: ShownPrice | null = null;
  for (const p of promos.filter((x) => !x.automatic && x.code && x.bannerPlaces.includes("product"))) {
    const s = mk(p.code, false, applyPromotions(line, { candidates: [{ promo: p, facts }], enteredCode: p.code ?? "", nowSec, emailKnown: false }));
    if (s && (!best || s.saveCents > best.saveCents)) best = s;
  }
  return { auto, code: best && (!auto || best.nowCents < auto.nowCents) ? best : null };
}
