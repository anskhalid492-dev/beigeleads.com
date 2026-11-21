// Budget planning for BeigePilot. Pure: every price comes from the catalog through the same priceCart the cart and checkout use,
// so an estimate can never promise what the cart will not honour. Nothing here adds anything to a cart.
import { getProduct, offeredPackages, type Product } from "@/lib/catalog";
import { priceCart } from "@/lib/cart/model";
import type { VolumeSettings } from "@/lib/sales/settings";

export type Pick = { slug: string; pkg: string; records: number; priceCents: number };
export type BudgetItem = { slug: string; affordable: Pick[]; best: Pick };
export type Plan = { slugs: Pick[]; subtotalCents: number; discountCents: number; totalCents: number; volumeApplied: boolean };

const forSale = (p: Product) => p.status === "live" && !p.placeholderData;

/** For each product that is really for sale, the packages that fit the budget. `best` = the one with the most contacts. */
export function affordableItems(products: readonly Product[], budgetCents: number, minRecords = 0): BudgetItem[] {
  const out: BudgetItem[] = [];
  for (const p of products) {
    if (!forSale(p)) continue;
    const ok = offeredPackages(p).filter((k) => k.priceUsdCents <= budgetCents && k.records >= minRecords).map((k) => ({ slug: p.slug, pkg: k.name, records: k.records, priceCents: k.priceUsdCents }));
    if (ok.length) out.push({ slug: p.slug, affordable: ok, best: ok.reduce((a, b) => (b.records > a.records || (b.records === a.records && b.priceCents < a.priceCents) ? b : a)) });
  }
  return out;
}

/** What the cart would charge for these picks (volume discount only when `volume` is given and enabled). */
export function estimate(picks: readonly { slug: string; pkg: string }[], volume?: VolumeSettings): { subtotalCents: number; totalCents: number; discountCents: number; volumeApplied: boolean } {
  const r = priceCart(picks.map((x) => ({ slug: x.slug, pkg: x.pkg })), { checkoutOpen: true, allowPlaceholder: false, volume });
  return { subtotalCents: r.subtotalCents, totalCents: r.totalCents, discountCents: r.discountCents, volumeApplied: r.discountCents > 0 && !!r.volume };
}

/** Up to `count` different databases whose estimated total (with the real volume discount when allowed) stays within the budget.
 * Greedy: take the cheapest package of each product in the given order, then upgrade packages while the total still fits. */
export function planBundle(items: readonly BudgetItem[], budgetCents: number, count: number, volume?: VolumeSettings): Plan | null {
  const chosen: Pick[] = [];
  for (const it of items) {
    if (chosen.length >= count) break;
    const cheapest = it.affordable.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
    if (estimate([...chosen, cheapest], volume).totalCents <= budgetCents) chosen.push(cheapest);
  }
  if (chosen.length < 2) return null;
  // Upgrade pass: bigger package for a line when the whole total still fits.
  for (let i = 0; i < chosen.length; i++) {
    const it = items.find((x) => x.best.slug === chosen[i].slug);
    if (!it) continue;
    for (const k of [...it.affordable].sort((a, b) => b.records - a.records)) {
      if (k.records <= chosen[i].records) break;
      const t = chosen.map((c, j) => (j === i ? k : c));
      if (estimate(t, volume).totalCents <= budgetCents) { chosen[i] = k; break; }
    }
  }
  const e = estimate(chosen, volume);
  return { slugs: chosen, ...e };
}

/** The cheapest package of a product that is for sale, and how far over the budget it is. For the "nothing fits" answer. */
export function cheapestOver(products: readonly Product[], budgetCents: number): { slug: string; pkg: string; priceCents: number; overCents: number } | null {
  let best: { slug: string; pkg: string; priceCents: number; overCents: number } | null = null;
  for (const p of products) {
    if (!forSale(p)) continue;
    const pk = offeredPackages(p);
    if (!pk.length) continue;
    const k = pk.reduce((a, b) => (b.priceUsdCents < a.priceUsdCents ? b : a));
    if (!best || k.priceUsdCents < best.priceCents) best = { slug: p.slug, pkg: k.name, priceCents: k.priceUsdCents, overCents: k.priceUsdCents - budgetCents };
  }
  return best;
}

export const validPick = (slug: string, pkg: string): Pick | null => {
  const p = getProduct(slug);
  if (!p || !forSale(p)) return null;
  const k = offeredPackages(p).find((x) => x.name.toLowerCase() === pkg.trim().toLowerCase());
  return k ? { slug: p.slug, pkg: k.name, records: k.records, priceCents: k.priceUsdCents } : null;
};
