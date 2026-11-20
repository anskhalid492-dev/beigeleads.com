import { z } from "zod";
import { applyPromotions, type Applied, type Candidate } from "@/lib/promos/engine";
import { getCategory, getCountry, getProduct, getProducts, offeredPackages, type Product } from "@/lib/catalog";

/** What the browser stores: ONLY the product and the chosen package. Prices, names and totals always come from the server. */
export type CartItem = { slug: string; pkg: string };
export const MAX_CART_ITEMS = 10;

export const cartItemSchema = z.object({ slug: z.string().trim().min(1).max(80), pkg: z.string().trim().min(1).max(40) });
export const cartItemsSchema = z.array(cartItemSchema).max(MAX_CART_ITEMS * 3);

/** Cleans anything read from storage or a request: valid shape, one line per product (the last choice wins), capped. */
export function normalizeItems(raw: unknown): CartItem[] {
  const parsed = cartItemsSchema.safeParse(raw);
  if (!parsed.success) return [];
  const byProduct = new Map<string, CartItem>();
  for (const i of parsed.data) { byProduct.delete(i.slug); byProduct.set(i.slug, i); }
  return [...byProduct.values()].slice(-MAX_CART_ITEMS);
}

export type PricedLine = {
  slug: string; name: string; categoryName: string; categorySlug: string; coverage: string;
  packageName: string; records: number; priceCents: number;
  /** what the buyer pays for this line: priceCents minus the partner discount (equal when there is none) */
  payCents: number;
  fields: readonly string[];
  /** every package of this product so the buyer can switch (names, sizes, prices all from the catalog) */
  packages: { name: string; records: number; priceCents: number }[];
  placeholder: boolean;
  /** false = cannot be bought right now (product not on sale, or checkout closed); `reason` says why */
  purchasable: boolean; reason: string;
  hasSample: boolean;
};
export type CartPricing = {
  lines: PricedLine[];
  /** list prices added up, before any discount */
  subtotalCents: number;
  /** partner discount applied to this cart (0 = none), the amount it takes off, and the code that earned it */
  discountPercent: number; discountCents: number; discountCode: string;
  /** every discount applied (partner or promotions) with the amount it takes off, and what to tell the buyer about a code that did not apply */
  applied: Applied[]; codeError: string; needsEmail: boolean;
  /** what the buyer pays */
  totalCents: number; checkoutOpen: boolean; canCheckout: boolean;
  /** items in the request that no longer exist in the catalog (removed from the cart by the client) */
  dropped: CartItem[];
  placeholderPrices: boolean;
};
export type CartContext = {
  checkoutOpen: boolean; allowPlaceholder: boolean;
  /** Already VALIDATED by resolveDiscount (the browser never supplies this). One discount per order, never stacked. */
  discount?: { code: string; percent: number };
  /** Promotions loaded from the database for this request (never from the browser). Omitted = no promotions. */
  promo?: { candidates: Candidate[]; enteredCode?: string; nowSec: number; emailKnown: boolean };
};

/** Cents to pay for a list price after a percent discount. Whole cents, rounded to nearest. */
export const discounted = (priceCents: number, percent: number) => Math.round((priceCents * (100 - percent)) / 100);

export const productSellable = (p: Product, ctx: CartContext) => (p.status === "live" && !p.placeholderData) || ctx.allowPlaceholder;

/** Pure. Prices a cart from the catalog. The same rules createOrder uses, so the cart never promises what checkout refuses. */
export function priceCart(input: unknown, ctx: CartContext, hasSample: (categorySlug: string) => boolean = () => false): CartPricing {
  const items = normalizeItems(input);
  const lines: PricedLine[] = [];
  const dropped: CartItem[] = [];
  for (const i of items) {
    const p = getProduct(i.slug);
    const pk = (p ? offeredPackages(p) : []).find((x) => x.name === i.pkg);
    if (!p || !pk) { dropped.push(i); continue; }
    const c = getCategory(p.categorySlug);
    const k = getCountry(p.countrySlug);
    const sellable = productSellable(p, ctx);
    lines.push({
      slug: p.slug, name: p.name, categoryName: c?.name ?? "", categorySlug: p.categorySlug, coverage: k?.name ?? "",
      packageName: pk.name, records: pk.records, priceCents: pk.priceUsdCents, payCents: pk.priceUsdCents, fields: p.fields,
      packages: offeredPackages(p).map((x) => ({ name: x.name, records: x.records, priceCents: x.priceUsdCents })),
      placeholder: p.placeholderData,
      purchasable: sellable && ctx.checkoutOpen,
      reason: !sellable ? "This list is not on sale yet." : !ctx.checkoutOpen ? "Checkout is not open yet." : "",
      hasSample: hasSample(p.categorySlug),
    });
  }
  const subtotalCents = lines.reduce((s, l) => s + l.priceCents, 0);
  const r = applyPromotions(
    lines.map((l) => ({ slug: l.slug, categorySlug: l.categorySlug, packageName: l.packageName, priceCents: l.priceCents })),
    { candidates: ctx.promo?.candidates ?? [], enteredCode: ctx.promo?.enteredCode, partner: ctx.discount, nowSec: ctx.promo?.nowSec ?? Math.floor(Date.now() / 1000), emailKnown: ctx.promo?.emailKnown ?? false },
  );
  lines.forEach((l, i) => { l.payCents = r.payCents[i]; });
  const totalCents = lines.reduce((s, l) => s + l.payCents, 0);
  const single = r.applied.length === 1 && r.applied[0].kind === "percent" ? r.applied[0].percent : 0;
  return {
    lines, subtotalCents, discountPercent: single, discountCents: subtotalCents - totalCents, discountCode: r.applied.map((a) => a.code).filter(Boolean).join(", "),
    applied: r.applied, codeError: r.codeError, needsEmail: r.needsEmail,
    totalCents, checkoutOpen: ctx.checkoutOpen, canCheckout: lines.length > 0 && lines.every((l) => l.purchasable), dropped, placeholderPrices: lines.some((l) => l.placeholder),
  };
}

export type Suggestion = {
  slug: string; name: string; categoryName: string; categorySlug: string; coverage: string; countryCode: string;
  packageName: string; records: number; priceCents: number;
  /** total records of the list, only when it is a real, verified figure (never a placeholder) */
  recordCount: number | null;
  /** price of the smallest package offered */
  startPriceCents: number;
  reason: string;
};

/** A product that is really on sale: live and not running on placeholder figures. */
export const isRealProduct = (p: Product) => p.status === "live" && !p.placeholderData;

/**
 * Complementary REAL products (live, no placeholder data), never ones already in the cart. Same country first, then other niches.
 * Placeholder lists are never suggested: a suggestion is an invitation to buy.
 */
export function suggestFor(items: CartItem[], limit = 3): Suggestion[] {
  const inCart = new Set(items.map((i) => i.slug));
  const owned = items.map((i) => getProduct(i.slug)).filter((p): p is Product => !!p);
  const countries = new Set(owned.map((p) => p.countrySlug));
  const cats = new Set(owned.map((p) => p.categorySlug));
  return getProducts()
    .filter((p) => !inCart.has(p.slug) && isRealProduct(p) && offeredPackages(p).length > 0)
    .map((p) => {
      const pks = offeredPackages(p);
      const pk = pks.find((x) => x.highlighted) ?? pks[0];
      const sameCountry = countries.has(p.countrySlug);
      const sameCat = cats.has(p.categorySlug);
      const k = getCountry(p.countrySlug);
      const reason = owned.length === 0 ? "" : sameCat ? "Same industry, another market" : sameCountry ? `Same market (${k?.name ?? ""}), another audience` : "Another market you can reach";
      return {
        score: Number(sameCat) * 3 + Number(sameCountry) * 2,
        s: {
          slug: p.slug, name: p.name, categoryName: getCategory(p.categorySlug)?.name ?? "", categorySlug: p.categorySlug, coverage: k?.name ?? "", countryCode: k?.code ?? "",
          packageName: pk.name, records: pk.records, priceCents: pk.priceUsdCents, recordCount: p.recordCount, startPriceCents: Math.min(...pks.map((x) => x.priceUsdCents)), reason,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
