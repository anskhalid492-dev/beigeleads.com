// Promotion engine (pure): percentages, fixed amounts, scope, minimum spend, limits, windows, stacking, rounding, partner exclusivity.
import { describe, expect, it } from "vitest";
import { allocate, applyPromotions, normalizePromoCode, promoWindow, refusal, type Candidate, type EngineLine, type Promo, type PromoFacts } from "@/lib/promos/engine";

const NOW = 1_800_000_000;
const facts = (o: Partial<PromoFacts> = {}): PromoFacts => ({ totalUses: 0, customerUses: 0, firstPurchase: true, partner: false, ...o });
const promo = (o: Partial<Promo> = {}): Promo => ({
  id: 1, name: "n", title: "Save 20%", code: "SAVE20", description: "", kind: "percent", value: 20,
  productSlugs: [], categorySlugs: [], packageNames: [], minCartCents: 0, maxDiscountCents: null, startsAt: null, endsAt: null,
  usageLimit: null, perCustomerLimit: null, firstPurchaseOnly: false, partnerOnly: false, automatic: false, combinable: false, status: "active", bannerPlaces: [], ...o,
});
const cand = (p: Partial<Promo> = {}, f: Partial<PromoFacts> = {}): Candidate => ({ promo: promo(p), facts: facts(f) });
const L = (slug: string, cat: string, pkg: string, priceCents: number): EngineLine => ({ slug, categorySlug: cat, packageName: pkg, priceCents });
const one = [L("a", "dentists", "Complete", 29900)];
const run = (lines: EngineLine[], candidates: Candidate[], code?: string, extra: object = {}) => applyPromotions(lines, { candidates, enteredCode: code, nowSec: NOW, emailKnown: true, ...extra });

describe("the owner's example", () => {
  it("SAVE20 on $299 = -$59.80, total $239.20", () => {
    const r = run(one, [cand()], "save20");
    expect(r.discountCents).toBe(5980);
    expect(r.payCents).toEqual([23920]);
    expect(r.codeError).toBe("");
    expect(r.applied[0]).toMatchObject({ code: "SAVE20", percent: 20, source: "code" });
  });
  it("codes are case-insensitive and whitespace-tolerant", () => {
    expect(normalizePromoCode("  sa ve20 ")).toBe("SAVE20");
    expect(run(one, [cand()], " Save20 ").discountCents).toBe(5980);
  });
});

describe("codes", () => {
  it("unknown, paused/draft, expired, scheduled and exhausted codes are refused with a reason and charge full price", () => {
    expect(run(one, [cand()], "NOPE")).toMatchObject({ discountCents: 0, codeError: "This code is not valid." });
    expect(run(one, [cand({ endsAt: NOW - 1 })], "SAVE20").codeError).toBe("This code has expired.");
    expect(run(one, [cand({ startsAt: NOW + 10 })], "SAVE20").codeError).toBe("This code is not active yet.");
    expect(run(one, [cand({ usageLimit: 5 }, { totalUses: 5 })], "SAVE20").codeError).toBe("This code has reached its usage limit.");
    expect(run(one, [cand({ perCustomerLimit: 1 }, { customerUses: 1 })], "SAVE20").codeError).toContain("maximum number of times");
    const r = run(one, [cand({ status: "paused" })], "SAVE20");
    expect(r.payCents).toEqual([29900]);
  });
  it("an automatic promotion needs no code; a code-only promotion does not apply by itself", () => {
    expect(run(one, [cand({ automatic: true })]).discountCents).toBe(5980);
    expect(run(one, [cand({ automatic: false })]).discountCents).toBe(0);
  });
  it("window helper", () => {
    expect(promoWindow({ startsAt: NOW + 1, endsAt: null }, NOW)).toBe("scheduled");
    expect(promoWindow({ startsAt: null, endsAt: NOW }, NOW)).toBe("expired");
    expect(promoWindow({ startsAt: NOW - 5, endsAt: NOW + 5 }, NOW)).toBe("live");
  });
  it("first-purchase and partner-only are refused when the facts say no, and flagged when the email is unknown", () => {
    expect(refusal(promo({ firstPurchaseOnly: true }), facts({ firstPurchase: false }), NOW)).toBe("first");
    expect(refusal(promo({ partnerOnly: true }), facts({ partner: false }), NOW)).toBe("partner");
    const r = run(one, [cand({ firstPurchaseOnly: true }, { firstPurchase: null })], "SAVE20", { emailKnown: false });
    expect(r.discountCents).toBe(5980);
    expect(r.needsEmail).toBe(true);
  });
});

describe("amounts", () => {
  it("fixed amounts never exceed the eligible total or go below zero", () => {
    expect(run(one, [cand({ kind: "fixed", value: 5000 })], "SAVE20").payCents).toEqual([24900]);
    expect(run([L("a", "x", "Starter", 900)], [cand({ kind: "fixed", value: 5000 })], "SAVE20").payCents).toEqual([0]);
  });
  it("maximum discount caps a percentage", () => {
    expect(run(one, [cand({ maxDiscountCents: 2500 })], "SAVE20").discountCents).toBe(2500);
  });
  it("minimum spend: Spend $200, get $30 off", () => {
    const c = [cand({ kind: "fixed", value: 3000, minCartCents: 20000 })];
    expect(run([L("a", "x", "Starter", 9900)], c, "SAVE20").codeError).toContain("Spend at least $200.00");
    expect(run([L("a", "x", "Starter", 9900), L("b", "x", "Professional", 19900)], c, "SAVE20").discountCents).toBe(3000);
  });
  it("percentages round to whole cents and line discounts add up exactly", () => {
    const lines = [L("a", "x", "Starter", 9901), L("b", "x", "Starter", 9901), L("c", "x", "Starter", 9901)];
    const r = run(lines, [cand({ value: 33 })], "SAVE20");
    expect(r.discountCents).toBe(Math.round((9901 * 3 * 33) / 100));
    expect(r.applied[0].lineCents.reduce((a, b) => a + b, 0)).toBe(r.discountCents);
    expect(r.payCents.every((x) => Number.isInteger(x) && x >= 0)).toBe(true);
  });
  it("allocate is exact and bounded", () => {
    expect(allocate(100, [60, 30, 30]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(allocate(100, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(3);
    expect(allocate(500, [100, 100])).toEqual([100, 100]);
    expect(allocate(0, [5, 5])).toEqual([0, 0]);
  });
});

describe("scope", () => {
  const lines = [L("a", "dentists", "Starter", 9900), L("b", "ski-shops", "Complete", 29900)];
  it("product, category and package restrictions only touch eligible lines", () => {
    expect(run(lines, [cand({ productSlugs: ["b"] })], "SAVE20").applied[0].lineCents).toEqual([0, 5980]);
    expect(run(lines, [cand({ categorySlugs: ["dentists"] })], "SAVE20").applied[0].lineCents).toEqual([1980, 0]);
    expect(run(lines, [cand({ packageNames: ["Complete"] })], "SAVE20").applied[0].lineCents).toEqual([0, 5980]);
  });
  it("a code that matches nothing in the cart says so and charges full price", () => {
    const r = run(lines, [cand({ productSlugs: ["zzz"] })], "SAVE20");
    expect(r.discountCents).toBe(0);
    expect(r.codeError).toContain("does not apply");
  });
});

describe("stacking", () => {
  it("two non-combinable promotions: only the better one applies", () => {
    const r = run(one, [cand({ id: 1, code: "A", value: 10, automatic: true }), cand({ id: 2, code: "B", value: 30 })], "B");
    expect(r.applied).toHaveLength(1);
    expect(r.applied[0].code).toBe("B");
  });
  it("the typed code loses to a better automatic offer and the buyer is told", () => {
    const r = run(one, [cand({ id: 1, code: "A", value: 40, automatic: true }), cand({ id: 2, code: "B", value: 10 })], "B");
    expect(r.applied.map((a) => a.code)).toEqual(["A"]);
    expect(r.codeError).toContain("better offer");
  });
  it("combinable promotions stack on what is left, and never below zero", () => {
    const r = run(one, [cand({ id: 1, code: "A", value: 50, combinable: true, automatic: true }), cand({ id: 2, code: "B", value: 50, combinable: true })], "B");
    expect(r.applied).toHaveLength(2);
    expect(r.discountCents).toBe(14950 + 7475); // 50% of 29900, then 50% of the remaining 14950
    expect(r.payCents[0]).toBeGreaterThanOrEqual(0);
  });
  it("a combinable promotion is not stacked onto a non-combinable winner", () => {
    const r = run(one, [cand({ id: 1, code: "A", value: 50, automatic: true }), cand({ id: 2, code: "B", value: 10, combinable: true })], "B");
    expect(r.applied.map((a) => a.code)).toEqual(["A"]);
  });
  it("a verified partner code applies alone: public promotions are ignored", () => {
    const r = run(one, [cand({ automatic: true, value: 20 })], undefined, { partner: { code: "PARTNER-AAAA-BBBB", percent: 50 } });
    expect(r.applied).toHaveLength(1);
    expect(r.applied[0].source).toBe("partner");
    expect(r.payCents).toEqual([14950]);
    expect(run(one, [cand()], "SAVE20", { partner: { code: "PARTNER-AAAA-BBBB", percent: 50 } }).codeError).toContain("cannot be combined");
  });
});
