import { describe, expect, it } from "vitest";
import { MAX_CART_ITEMS, normalizeItems, priceCart, suggestFor } from "@/lib/cart/model";
import { rate } from "@/lib/cart/stats";
import { getProducts } from "@/lib/catalog";

const P = getProducts();
const a = P[0], b = P[1];
const open = { checkoutOpen: true, allowPlaceholder: true };

describe("cart items", () => {
  it("keeps one line per product (last choice wins) and drops junk", () => {
    const items = normalizeItems([{ slug: a.slug, pkg: a.packages[0].name }, { slug: a.slug, pkg: a.packages[1].name }, { slug: b.slug, pkg: b.packages[0].name }]);
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.slug === a.slug)?.pkg).toBe(a.packages[1].name);
    expect(normalizeItems("nope")).toEqual([]);
    expect(normalizeItems([{ slug: 1 }])).toEqual([]);
  });
  it("never keeps more than the cap", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ slug: `p${i}`, pkg: "x" }));
    expect(normalizeItems(many).length).toBeLessThanOrEqual(MAX_CART_ITEMS);
  });
});

describe("server pricing", () => {
  it("prices from the catalog and ignores anything the browser says about money", () => {
    const pk = a.packages[0];
    const r = priceCart([{ slug: a.slug, pkg: pk.name, price: 1, priceCents: 1 }], open);
    expect(r.lines[0].priceCents).toBe(pk.priceUsdCents);
    expect(r.totalCents).toBe(pk.priceUsdCents);
  });
  it("totals several lists exactly", () => {
    const r = priceCart([{ slug: a.slug, pkg: a.packages[0].name }, { slug: b.slug, pkg: b.packages[1].name }], open);
    expect(r.totalCents).toBe(a.packages[0].priceUsdCents + b.packages[1].priceUsdCents);
    expect(r.lines).toHaveLength(2);
  });
  it("drops unknown products and packages instead of pricing them", () => {
    const r = priceCart([{ slug: "nope", pkg: "x" }, { slug: a.slug, pkg: "Not a package" }], open);
    expect(r.lines).toHaveLength(0);
    expect(r.dropped).toHaveLength(2);
    expect(r.totalCents).toBe(0);
    expect(r.canCheckout).toBe(false);
  });
  it("blocks checkout while it is closed or the product is not on sale, with a reason", () => {
    const closed = priceCart([{ slug: a.slug, pkg: a.packages[0].name }], { checkoutOpen: false, allowPlaceholder: true });
    expect(closed.canCheckout).toBe(false);
    expect(closed.lines[0].reason).toMatch(/not open/i);
    const notSale = priceCart([{ slug: a.slug, pkg: a.packages[0].name }], { checkoutOpen: true, allowPlaceholder: false });
    if (a.status !== "live" || a.placeholderData) { expect(notSale.canCheckout).toBe(false); expect(notSale.lines[0].reason).toMatch(/not on sale/i); }
    expect(priceCart([{ slug: a.slug, pkg: a.packages[0].name }], open).canCheckout).toBe(true);
  });
});

describe("cross-sell", () => {
  it("suggests only real products that are not in the cart", () => {
    const s = suggestFor([{ slug: a.slug, pkg: a.packages[0].name }]);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(x.slug).not.toBe(a.slug);
      const real = P.find((p) => p.slug === x.slug)!;
      expect(real.packages.some((pk) => pk.name === x.packageName && pk.priceUsdCents === x.priceCents)).toBe(true);
    }
  });
  it("suggests nothing when everything is already in the cart", () => {
    expect(suggestFor(P.map((p) => ({ slug: p.slug, pkg: p.packages[0].name })))).toEqual([]);
  });
});

describe("funnel rates", () => {
  it("never divides by zero or invents a number", () => {
    expect(rate(3, 0)).toBeNull();
    expect(rate(1, 4)).toBe(25);
  });
});
