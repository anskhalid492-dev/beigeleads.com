import { z } from "zod";
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
};

/** Cents to pay for a list price after a percent discount. Whole cents, rounded to nearest. */
export const discounted = (priceCents: number, percent: number) => Math.round((priceCents * (100 - percent)) / 100);

export const productSellable = (p: Product, ctx: CartContext) => (p.status === "live" && !p.placeholderData) || ctx.allowPlaceholder;

/** Pure. Prices a cart from the catalog. The same rules createOrder uses, so the cart never promises what checkout refuses. */
export function priceCart(input: unknown, ctx: CartContext, hasSample: (categorySlug: string) => boolean = () => false): CartPricing {
  const items = normalizeItems(input);
  const lines: PricedLine[] = [];
  const dropped: CartItem[] = [];
  const pct = ctx.discount ? Math.min(100, Math.max(0, Math.floor(ctx.discount.percent))) : 0;
  for (const i of items) {
    const p = getProduct(i.slug);
    const pk = (p ? offeredPackages(p) : []).find((x) => x.name === i.pkg);
    if (!p || !pk) { dropped.push(i); continue; }
    const c = getCategory(p.categorySlug);
    const k = getCountry(p.countrySlug);
    const sellable = productSellable(p, ctx);
    lines.push({
      slug: p.slug, name: p.name, categoryName: c?.name ?? "", categorySlug: p.categorySlug, coverage: k?.name ?? "",
      packageName: pk.name, records: pk.records, priceCents: pk.priceUsdCents, payCents: discounted(pk.priceUsdCents, pct), fields: p.fields,
      packages: offeredPackages(p).map((x) => ({ name: x.name, records: x.records, priceCents: x.priceUsdCents })),
      placeholder: p.placeholderData,
      purchasable: sellable && ctx.checkoutOpen,
      reason: !sellable ? "This list is not on sale yet." : !ctx.checkoutOpen ? "Checkout is not open yet." : "",
      hasSample: hasSample(p.categorySlug),
    });
  }
  const subtotalCents = lines.reduce((s, l) => s + l.priceCents, 0);
  const totalCents = lines.reduce((s, l) => s + l.payCents, 0);
  return { lines, subtotalCents, discountPercent: pct, discountCents: subtotalCents - totalCents, discountCode: pct > 0 ? (ctx.discount?.code ?? "") : "", totalCents, checkoutOpen: ctx.checkoutOpen, canCheckout: lines.length > 0 && lines.every((l) => l.purchasable), dropped, placeholderPrices: lines.some((l) => l.placeholder) };
}

export type Suggestion = { slug: string; name: string; categoryName: string; coverage: string; packageName: string; records: number; priceCents: number; reason: string };

/** Complementary REAL products: not already in the cart, same country first, then other niches. Never more than `limit`. */
export function suggestFor(items: CartItem[], limit = 3): Suggestion[] {
  const inCart = new Set(items.map((i) => i.slug));
  const owned = items.map((i) => getProduct(i.slug)).filter((p): p is Product => !!p);
  const countries = new Set(owned.map((p) => p.countrySlug));
  const cats = new Set(owned.map((p) => p.categorySlug));
  return getProducts()
    .filter((p) => !inCart.has(p.slug) && offeredPackages(p).length > 0)
    .map((p) => {
      const pk = offeredPackages(p).find((x) => x.highlighted) ?? offeredPackages(p)[0];
      const sameCountry = countries.has(p.countrySlug);
      const sameCat = cats.has(p.categorySlug);
      return {
        score: Number(sameCountry) * 2 + Number(!sameCat),
        s: { slug: p.slug, name: p.name, categoryName: getCategory(p.categorySlug)?.name ?? "", coverage: getCountry(p.countrySlug)?.name ?? "", packageName: pk.name, records: pk.records, priceCents: pk.priceUsdCents, reason: sameCountry ? `Same coverage as your cart (${getCountry(p.countrySlug)?.name ?? ""})` : "Another audience you can reach" },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
