// Database Bundles: PURE pricing and availability. Used by the cart price API, createOrder, the public pages and the admin preview,
// so a bundle never shows a price that checkout refuses. A bundle stores references to catalog products + packages (nothing is
// copied); every name, size and price is read from the catalog here. The bundle price is either "percent off the list prices
// added up" or a fixed dollar price. Nothing here invents a record count: totals are shown only when every list has a real size.
import { getCategory, getCountry, getProduct, offeredPackages, type Product } from "@/lib/catalog";

export type BundleItem = { slug: string; pkg: string };
export type BundleDef = {
  id: number; slug: string; name: string; shortDescription: string; description: string; categorySlug: string;
  label: string; image: string; items: BundleItem[]; priceMode: "percent" | "fixed"; discountPercent: number; fixedPriceCents: number;
  featured: boolean; status: "draft" | "published"; /** product slugs that cannot be in the same order as this bundle */ excluded: string[];
  seoTitle: string; metaDescription: string; sortOrder: number;
};
export type BundleContext = { checkoutOpen: boolean; allowPlaceholder: boolean };
export type BundleComponent = {
  slug: string; name: string; categoryName: string; categorySlug: string; coverage: string; packageName: string;
  /** contacts in the chosen package (0 = unknown / full list) */ records: number; listCents: number;
  /** this list's share of the bundle price (sums exactly to the bundle price) */ shareCents: number;
  available: boolean; reason: string;
};
export type PricedBundle = {
  slug: string; name: string; shortDescription: string; description: string; image: string; label: string; categorySlug: string; featured: boolean;
  components: BundleComponent[]; listCents: number; priceCents: number; savingsCents: number; savingsPercent: number;
  /** only when EVERY list has a real, known size */ totalRecords: number | null;
  purchasable: boolean; reason: string;
};

export const MAX_BUNDLE_ITEMS = 12;
export const MIN_BUNDLE_ITEMS = 2;
export const MAX_CART_BUNDLES = 5;

const sellable = (p: Product, ctx: BundleContext) => (p.status === "live" && !p.placeholderData) || ctx.allowPlaceholder;

/** Splits `price` over parts in proportion to `weights` using whole cents; the parts always add up to `price` exactly (largest remainder, ties to the first). */
export function allocate(price: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (sum <= 0) { const base = Math.floor(price / weights.length); const out = weights.map(() => base); out[0] += price - base * weights.length; return out; }
  const exact = weights.map((w) => (price * w) / sum);
  const out = exact.map((x) => Math.floor(x));
  let left = price - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k].i]++;
  return out;
}

/** The bundle price for a list total, or null when the settings cannot give a real saving (price not below the list total, or not positive). */
export function bundlePriceFor(d: Pick<BundleDef, "priceMode" | "discountPercent" | "fixedPriceCents">, listCents: number): number | null {
  const price = d.priceMode === "percent" ? Math.round((listCents * (100 - d.discountPercent)) / 100) : d.fixedPriceCents;
  return price > 0 && price < listCents ? price : null;
}

export function priceBundle(def: BundleDef, ctx: BundleContext): PricedBundle {
  const comps: BundleComponent[] = def.items.map((i) => {
    const p = getProduct(i.slug);
    const pk = p ? offeredPackages(p).find((x) => x.name === i.pkg) : undefined;
    const k = p ? getCountry(p.countrySlug) : undefined;
    const real = !!p && !p.placeholderData;
    let reason = "";
    if (!p) reason = "This list is no longer in the catalog.";
    else if (!pk) reason = `The ${i.pkg} package is no longer offered for ${p.name}.`;
    else if (!sellable(p, ctx)) reason = `${p.name} is not on sale right now.`;
    const records = pk ? (pk.records > 0 ? pk.records : real && p?.recordCount ? p.recordCount : 0) : 0;
    return {
      slug: i.slug, name: p?.name ?? i.slug, categoryName: p ? (getCategory(p.categorySlug)?.name ?? "") : "", categorySlug: p?.categorySlug ?? "", coverage: k?.name ?? "",
      packageName: i.pkg, records, listCents: pk?.priceUsdCents ?? 0, shareCents: 0, available: reason === "", reason,
    };
  });
  const listCents = comps.reduce((s, c) => s + c.listCents, 0);
  const price = bundlePriceFor(def, listCents);
  const priceCents = price ?? listCents;
  const shares = allocate(priceCents, comps.map((c) => c.listCents));
  comps.forEach((c, n) => { c.shareCents = shares[n]; });
  const broken = comps.find((c) => !c.available);
  let reason = broken ? broken.reason : price === null ? "This bundle is being updated." : !ctx.checkoutOpen ? "Checkout is not open yet." : "";
  if (comps.length < MIN_BUNDLE_ITEMS && !reason) reason = "This bundle is being updated.";
  const known = comps.length > 0 && comps.every((c) => c.records > 0 && getProduct(c.slug) && !getProduct(c.slug)!.placeholderData);
  const savingsCents = Math.max(0, listCents - priceCents);
  return {
    slug: def.slug, name: def.name, shortDescription: def.shortDescription, description: def.description, image: def.image, label: def.label, categorySlug: def.categorySlug, featured: def.featured,
    components: comps, listCents, priceCents, savingsCents, savingsPercent: listCents > 0 ? Math.round((savingsCents / listCents) * 100) : 0,
    totalRecords: known ? comps.reduce((s, c) => s + c.records, 0) : null, purchasable: reason === "", reason,
  };
}

/** Why a bundle cannot go live. Empty = it can be published. */
export function publishProblems(def: BundleDef, ctx: BundleContext): string[] {
  const out: string[] = [];
  if (def.items.length < MIN_BUNDLE_ITEMS) out.push(`Add at least ${MIN_BUNDLE_ITEMS} databases.`);
  if (new Set(def.items.map((i) => i.slug)).size !== def.items.length) out.push("A database can be in a bundle only once.");
  const p = priceBundle(def, { ...ctx, checkoutOpen: true });
  for (const c of p.components) if (!c.available) out.push(c.reason);
  if (p.components.every((c) => c.available) && bundlePriceFor(def, p.listCents) === null) out.push("The bundle price must be above $0 and below the individual prices added up.");
  if (!def.shortDescription.trim()) out.push("Write a short description.");
  return out;
}

/** Cart rule: lists that are in two bundles or in a bundle and also on their own cannot be bought twice in one order. */
export function overlapReason(bundleName: string, otherName: string): string {
  return `${otherName} is already part of ${bundleName}. Remove one of them to continue.`;
}
