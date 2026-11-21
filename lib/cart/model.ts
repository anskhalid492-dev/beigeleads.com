import { z } from "zod";
import { applyPromotions, type Applied, type Candidate, type VolumeInfo } from "@/lib/promos/engine";
import type { VolumeSettings } from "@/lib/sales/settings";
import { getCategory, getCountry, getProduct, getProducts, offeredPackages, type Product } from "@/lib/catalog";
import { MAX_CART_BUNDLES, overlapReason, priceBundle, type BundleDef, type PricedBundle } from "@/lib/bundles/pricing";

/** What the browser stores: ONLY the product and the chosen package. Prices, names and totals always come from the server. */
export type CartItem = { slug: string; pkg: string };
export const MAX_CART_ITEMS = 10;

export const cartItemSchema = z.object({ slug: z.string().trim().min(1).max(80), pkg: z.string().trim().min(1).max(40) });
export const cartItemsSchema = z.array(cartItemSchema).max(MAX_CART_ITEMS * 3);
/** Curated bundles in the cart are slugs only; the server reads the bundle, its lists and its price. */
export const bundleSlugsSchema = z.array(z.string().trim().min(1).max(80)).max(MAX_CART_BUNDLES * 2);
export function normalizeBundleSlugs(raw: unknown): string[] {
  const p = bundleSlugsSchema.safeParse(raw);
  return p.success ? [...new Set(p.data)].slice(0, MAX_CART_BUNDLES) : [];
}

/** Cleans anything read from storage or a request: valid shape, one line per product (the last choice wins), capped. */
export function normalizeItems(raw: unknown): CartItem[] {
  const parsed = cartItemsSchema.safeParse(raw);
  if (!parsed.success) return [];
  const byProduct = new Map<string, CartItem>();
  for (const raw0 of parsed.data) { const i = { ...raw0, slug: getProduct(raw0.slug)?.slug ?? raw0.slug }; byProduct.delete(i.slug); byProduct.set(i.slug, i); } // a renamed product keeps working from an old cart
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
  /** real masked rows (own sample or the site-wide default), filled in by the price API */
  sample?: { business: string; city: string; email: string; phone: string }[];
};
/** The optional Email Verification service line. A service, not a database: no promotion, volume or bundle logic touches it. */
export type PricedVerification = { name: string; limit: number; priceCents: number; purchasable: boolean; reason: string };
/** What the cart shows in the optional verification offer (loaded from the admin settings on the server). */
export type VerificationUpsell = { headline: string; description: string; placement: "after_items" | "in_summary"; packages: { name: string; limit: number; priceCents: number; featured: boolean }[] };
export type CartPricing = {
  lines: PricedLine[];
  /** the Email Verification service in this cart (undefined = none) */
  service?: PricedVerification;
  /** curated bundles in the cart, each with its lists and its own price (never discounted again) */
  bundles: PricedBundle[];
  /** how much the bundles save compared with buying their lists one by one */
  bundleSavingsCents: number;
  /** bundle slugs in the request that are not published any more (removed from the cart by the client) */
  droppedBundles: string[];
  /** list prices added up, before any discount (bundle lists at their individual prices) */
  subtotalCents: number;
  /** partner discount applied to this cart (0 = none), the amount it takes off, and the code that earned it */
  discountPercent: number; discountCents: number; discountCode: string;
  /** every discount applied (partner or promotions) with the amount it takes off, and what to tell the buyer about a code that did not apply */
  applied: Applied[]; codeError: string; needsEmail: boolean;
  /** Buy More, Save More ladder, current tier and what the next one needs (undefined = feature off) */
  volume?: VolumeInfo;
  /** what the buyer pays */
  totalCents: number; checkoutOpen: boolean; canCheckout: boolean;
  /** items in the request that no longer exist in the catalog (removed from the cart by the client) */
  dropped: CartItem[];
  placeholderPrices: boolean;
};
export type CartContext = {
  checkoutOpen: boolean; allowPlaceholder: boolean;
  /** Curated bundles: the cart's bundle slugs and the PUBLISHED bundle definitions loaded on the server. Omitted = no bundles. */
  bundles?: { slugs: string[]; defs: BundleDef[] };
  /** Already VALIDATED by resolveDiscount (the browser never supplies this). One discount per order, never stacked. */
  discount?: { code: string; percent: number };
  /** Promotions loaded from the database for this request (never from the browser). Omitted = no promotions. */
  promo?: { candidates: Candidate[]; enteredCode?: string; nowSec: number; emailKnown: boolean };
  /** Buy More, Save More settings (loaded on the server; omitted = feature off) */
  volume?: VolumeSettings; rewardCombineVolume?: boolean;
  /** Email Verification: the selected package name and the packages from the server-side settings. Omitted = no service. */
  verification?: { pkg: string | null; enabled: boolean; packages: { name: string; limit: number; priceCents: number }[] };
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
  // Curated bundles. They are priced on their own: no promotion, partner code or Buy More, Save More discount touches them, and
  // their lists do not count toward volume thresholds (only `lines` go to the promotion engine below).
  const droppedBundles: string[] = [];
  const bundles: PricedBundle[] = [];
  const defOf = new Map<string, BundleDef>();
  for (const slug of normalizeBundleSlugs(ctx.bundles?.slugs ?? [])) {
    const def = ctx.bundles?.defs.find((d) => d.slug === slug && d.status === "published");
    if (!def) { droppedBundles.push(slug); continue; }
    defOf.set(slug, def);
    bundles.push(priceBundle(def, { checkoutOpen: ctx.checkoutOpen, allowPlaceholder: ctx.allowPlaceholder }));
  }
  const owner = new Map<string, string>(); // list slug -> name of the first bundle that holds it
  for (const b of bundles) {
    const def = defOf.get(b.slug)!;
    const conflict = (name: string) => { b.purchasable = false; b.reason = name; };
    for (const c of b.components) {
      const first = owner.get(c.slug);
      if (first && b.purchasable) conflict(overlapReason(first, b.name));
      else if (!first) owner.set(c.slug, b.name);
    }
    for (const x of def.excluded) {
      const other = bundles.find((o) => o !== b && o.components.some((c) => c.slug === x)) ?? null;
      const alone = lines.find((l) => l.slug === x);
      if ((other || alone) && b.purchasable) conflict(`${b.name} cannot be bought together with ${other?.name ?? alone?.name}.`);
    }
  }
  for (const l of lines) {
    const holder = owner.get(l.slug);
    if (holder && l.purchasable) { l.purchasable = false; l.reason = overlapReason(holder, l.name); }
  }
  const bundlesList = bundles.reduce((n, b) => n + b.listCents, 0);
  const bundlesPay = bundles.reduce((n, b) => n + b.priceCents, 0);
  const subtotalCents = lines.reduce((s, l) => s + l.priceCents, 0);
  const r = applyPromotions(
    lines.map((l) => ({ slug: l.slug, categorySlug: l.categorySlug, packageName: l.packageName, priceCents: l.priceCents })),
    { candidates: ctx.promo?.candidates ?? [], enteredCode: ctx.promo?.enteredCode, partner: ctx.discount, nowSec: ctx.promo?.nowSec ?? Math.floor(Date.now() / 1000), emailKnown: ctx.promo?.emailKnown ?? false, volume: ctx.volume, rewardCombineVolume: ctx.rewardCombineVolume },
  );
  lines.forEach((l, i) => { l.payCents = r.payCents[i]; });
  const goodsCents = lines.reduce((s, l) => s + l.payCents, 0) + bundlesPay;
  let service: PricedVerification | undefined;
  const vp = ctx.verification;
  if (vp?.pkg) {
    const pk = vp.packages.find((x) => x.name === vp.pkg);
    if (pk) service = { name: pk.name, limit: pk.limit, priceCents: pk.priceCents, purchasable: vp.enabled && ctx.checkoutOpen, reason: !vp.enabled ? "Email verification is not available right now." : !ctx.checkoutOpen ? "Checkout is not open yet." : "" };
  }
  const totalCents = goodsCents + (service?.priceCents ?? 0);
  const single = r.applied.length === 1 && r.applied[0].kind === "percent" ? r.applied[0].percent : 0;
  return {
    lines, bundles, service, bundleSavingsCents: bundlesList - bundlesPay, droppedBundles, subtotalCents: subtotalCents + bundlesList, discountPercent: single, discountCents: subtotalCents + bundlesList - goodsCents, discountCode: r.applied.map((a) => a.code).filter(Boolean).join(", "),
    applied: r.applied, codeError: r.codeError, needsEmail: r.needsEmail, volume: r.volume,
    totalCents, checkoutOpen: ctx.checkoutOpen, canCheckout: lines.length + bundles.length + (service ? 1 : 0) > 0 && lines.every((l) => l.purchasable) && bundles.every((b) => b.purchasable) && (!service || service.purchasable), dropped,
    placeholderPrices: lines.some((l) => l.placeholder) || bundles.some((b) => b.components.some((c) => getProduct(c.slug)?.placeholderData)),
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
  const channels = new Set(owned.map((p) => p.channel).filter(Boolean));
  const regions = new Set(owned.map((p) => p.region).filter(Boolean));
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
        score: Number(sameCat) * 8 + Number(sameCountry) * 4 + Number(!!p.channel && channels.has(p.channel)) * 2 + Number(!!p.region && regions.has(p.region)),
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
