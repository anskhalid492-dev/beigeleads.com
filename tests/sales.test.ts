import { describe, expect, it } from "vitest";
import { applyPromotions, volumeInfo, type EngineLine } from "@/lib/promos/engine";
import { DEFAULT_VOLUME, cleanTiers } from "@/lib/sales/settings";
import { makeCode, rewardTerms } from "@/lib/sales/reward";

const L = (slug: string, cat = "c", cents = 10_000): EngineLine => ({ slug, categorySlug: cat, packageName: "Starter", priceCents: cents });
const price = (lines: EngineLine[], volume = DEFAULT_VOLUME) => applyPromotions(lines, { candidates: [], nowSec: 1, emailKnown: false, volume });

describe("Buy More, Save More tiers (15 / 35 / 45)", () => {
  it.each([[1, 0], [2, 15], [3, 35], [4, 35], [5, 45], [8, 45]])("%i databases -> %i%%", (n, pct) => {
    const lines = Array.from({ length: n }, (_, i) => L(`p${i}`));
    const r = price(lines);
    expect(r.volume?.percent).toBe(pct);
    expect(r.discountCents).toBe(Math.round(n * 10_000 * pct / 100));
  });
  it("progress message data: next tier and how many more", () => {
    expect(volumeInfo([L("a")], DEFAULT_VOLUME).next).toEqual({ need: 1, percent: 15 });
    expect(volumeInfo([L("a"), L("b"), L("c")], DEFAULT_VOLUME).next).toEqual({ need: 2, percent: 45 });
    expect(volumeInfo(Array.from({ length: 5 }, (_, i) => L(`p${i}`)), DEFAULT_VOLUME).next).toBeNull();
  });
  it("the same database twice counts once", () => { expect(volumeInfo([L("a"), L("a")], DEFAULT_VOLUME).count).toBe(1); });
  it("excluded products and categories neither count nor get a discount", () => {
    const v = { ...DEFAULT_VOLUME, excludedProducts: ["b"], excludedCategories: ["x"] };
    const r = price([L("a"), L("b"), L("c", "x")], v);
    expect(r.volume?.count).toBe(1); expect(r.discountCents).toBe(0);
  });
  it("off = no discount; tiers are editable and sorted", () => {
    expect(price([L("a"), L("b")], { ...DEFAULT_VOLUME, enabled: false }).discountCents).toBe(0);
    expect(cleanTiers([{ min: 5, percent: 20 }, { min: 2, percent: 5 }, { min: 2, percent: 7 }])).toEqual([{ min: 2, percent: 7 }, { min: 5, percent: 20 }]);
    expect(price([L("a"), L("b")], { ...DEFAULT_VOLUME, tiers: [{ min: 2, percent: 5 }] }).volume?.percent).toBe(5);
  });
  it("total is never negative and whole cents", () => {
    const r = price([L("a", "c", 333), L("b", "c", 333)]);
    expect(Number.isInteger(r.discountCents)).toBe(true);
    expect(r.payCents.every((p) => p >= 0)).toBe(true);
  });
});

describe("reward code + terms", () => {
  it("format BEIGE-XXXXXX, no look-alike characters, varied", () => {
    const s = new Set(Array.from({ length: 200 }, makeCode));
    expect(s.size).toBeGreaterThan(190);
    for (const c of s) expect(c).toMatch(/^BEIGE-[A-HJ-NP-Z2-9]{6}$/);
  });
  it("terms state the real cap and the no-combining rule", () => {
    const t = rewardTerms({ percent: 50, maxDiscountCents: 10_000, combineVolume: false, productSlugs: [], categorySlugs: [] }, 1_800_000_000);
    expect(t).toContain("$100"); expect(t).toContain("Cannot be combined");
  });
});
