// Database Bundles: pure pricing, allocation and cart rules (no database).
import { describe, expect, it } from "vitest";
import { getProducts } from "@/lib/catalog";
import { allocate, bundlePriceFor, priceBundle, publishProblems, type BundleDef } from "@/lib/bundles/pricing";
import { priceCart } from "@/lib/cart/model";

const P = getProducts();
const [a, b, c] = P;
const ctx = { checkoutOpen: true, allowPlaceholder: true };
const def = (over: Partial<BundleDef> = {}): BundleDef => ({
  id: 1, slug: "test-bundle", name: "Test Bundle", shortDescription: "Two lists.", description: "", categorySlug: "", label: "", image: "",
  items: [{ slug: a.slug, pkg: a.packages[0].name }, { slug: b.slug, pkg: b.packages[0].name }],
  priceMode: "percent", discountPercent: 20, fixedPriceCents: 0, featured: false, status: "published", excluded: [], seoTitle: "", metaDescription: "", sortOrder: 0, ...over,
});
const list = a.packages[0].priceUsdCents + b.packages[0].priceUsdCents;

describe("bundle pricing", () => {
  it("allocation always adds up to the price", () => {
    for (const [price, w] of [[1000, [1, 1, 1]], [9999, [3333, 3333, 3334]], [1, [5, 5]], [0, [1, 2]], [777, [0, 0, 0]]] as const) {
      const out = allocate(price, [...w]);
      expect(out.reduce((x, y) => x + y, 0)).toBe(price);
      expect(out.every((x) => x >= 0)).toBe(true);
    }
  });
  it("percent and fixed prices, and no price without a real saving", () => {
    expect(bundlePriceFor({ priceMode: "percent", discountPercent: 20, fixedPriceCents: 0 }, 10000)).toBe(8000);
    expect(bundlePriceFor({ priceMode: "fixed", discountPercent: 0, fixedPriceCents: 7500 }, 10000)).toBe(7500);
    expect(bundlePriceFor({ priceMode: "fixed", discountPercent: 0, fixedPriceCents: 10000 }, 10000)).toBeNull();
    expect(bundlePriceFor({ priceMode: "percent", discountPercent: 0, fixedPriceCents: 0 }, 10000)).toBeNull();
  });
  it("prices a bundle from the catalog and component shares equal the bundle price", () => {
    const p = priceBundle(def(), ctx);
    expect(p.listCents).toBe(list);
    expect(p.priceCents).toBe(Math.round(list * 0.8));
    expect(p.components.reduce((s, x) => s + x.shareCents, 0)).toBe(p.priceCents);
    expect(p.savingsCents).toBe(list - p.priceCents);
    expect(p.purchasable).toBe(true);
  });
  it("invalid packages and unavailable products are handled safely", () => {
    const bad = priceBundle(def({ items: [{ slug: a.slug, pkg: "Nope" }, { slug: b.slug, pkg: b.packages[0].name }] }), ctx);
    expect(bad.purchasable).toBe(false);
    expect(publishProblems(def({ items: [{ slug: "missing", pkg: "x" }, { slug: b.slug, pkg: b.packages[0].name }] }), ctx).length).toBeGreaterThan(0);
    expect(publishProblems(def({ items: [{ slug: a.slug, pkg: a.packages[0].name }] }), ctx).join(" ")).toMatch(/at least 2/);
    expect(publishProblems(def({ priceMode: "fixed", fixedPriceCents: list + 1 }), ctx).join(" ")).toMatch(/below/);
    expect(priceBundle(def(), { checkoutOpen: false, allowPlaceholder: true }).purchasable).toBe(false);
  });
});

describe("bundles in the cart", () => {
  const cart = (items: unknown, slugs: string[], volume = true) =>
    priceCart(items, { ...ctx, bundles: { slugs, defs: [def()] }, volume: volume ? { enabled: true, tiers: [{ min: 2, percent: 15 }, { min: 3, percent: 35 }, { min: 5, percent: 45 }], excludedProducts: [], excludedCategories: [], stackWithPromos: false } as never : undefined });
  it("a bundle keeps its own price, never gets Buy More, Save More, and its lists do not count toward thresholds", () => {
    const r = cart([{ slug: c.slug, pkg: c.packages[0].name }], ["test-bundle"]);
    expect(r.bundles).toHaveLength(1);
    expect(r.totalCents).toBe(Math.round(list * 0.8) + c.packages[0].priceUsdCents); // one other list = no volume tier
    expect(r.totalCents).toBeGreaterThan(0);
  });
  it("custom lists still get the volume discount next to a bundle", () => {
    const d = P[3];
    const r = cart([{ slug: c.slug, pkg: c.packages[0].name }, { slug: d.slug, pkg: d.packages[0].name }], ["test-bundle"]);
    const custom = Math.round((c.packages[0].priceUsdCents + d.packages[0].priceUsdCents) * 0.85);
    expect(r.totalCents).toBe(Math.round(list * 0.8) + custom);
  });
  it("a list that is already in the bundle cannot be bought again, and a removed bundle is dropped", () => {
    const r = cart([{ slug: a.slug, pkg: a.packages[0].name }], ["test-bundle"]);
    expect(r.canCheckout).toBe(false);
    const gone = priceCart([], { ...ctx, bundles: { slugs: ["test-bundle"], defs: [def({ status: "draft" })] } });
    expect(gone.droppedBundles).toEqual(["test-bundle"]);
    expect(gone.totalCents).toBe(0);
  });
  it("totals are never negative", () => {
    expect(cart([], ["test-bundle"]).totalCents).toBeGreaterThan(0);
    expect(priceCart([], ctx).totalCents).toBe(0);
  });
});
