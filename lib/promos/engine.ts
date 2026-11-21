// Promotion engine: PURE (no database, no clock of its own). Given the priced cart lines, the promotions that may apply and facts about
// the buyer, it returns exactly what is taken off each line. Used by the cart price API and by createOrder, so the cart never promises
// a price that checkout refuses. The browser never supplies a discount amount.
//
// STACKING RULES (shown in the admin UI, keep in sync with `STACKING_RULES`):
//  1. A verified partner code (50%) applies ALONE: no public promotion is combined with it.
//  2. Otherwise every eligible promotion is priced on its own; the one saving the most is applied first (ties: the code the buyer typed).
//  3. If that first promotion is "combinable", other combinable promotions are added on top, best first, each on what is still unpaid.
//     A non-combinable promotion is always applied alone.
//  4. Discounts only touch eligible lines, are whole cents, and never take a line below $0.

import type { VolumeSettings } from "@/lib/sales/settings";

export type PromoKind = "percent" | "fixed";
export type Promo = {
  id: number; name: string; title: string; code: string | null; description: string;
  kind: PromoKind; value: number; // percent 1-100, or cents
  productSlugs: string[]; categorySlugs: string[]; packageNames: string[]; // empty = no restriction
  minCartCents: number; maxDiscountCents: number | null;
  startsAt: number | null; endsAt: number | null; // epoch seconds, UTC
  usageLimit: number | null; perCustomerLimit: number | null;
  firstPurchaseOnly: boolean; partnerOnly: boolean; automatic: boolean; combinable: boolean;
  status: "draft" | "active" | "paused";
  bannerPlaces: string[];
  /** a personal code (Second Purchase Offer): valid only with this email address; origin "reward" marks those codes */
  boundEmail?: string | null; origin?: "admin" | "reward" | "negotiation";
};
/** Facts the database supplies about one promotion for this buyer. null = unknown (no email yet). */
export type PromoFacts = { totalUses: number; customerUses: number | null; firstPurchase: boolean | null; partner: boolean | null; /** true/false once the buyer email is known; null before; true for codes not bound to an email */ emailMatch?: boolean | null };
export type Candidate = { promo: Promo; facts: PromoFacts };
export type EngineLine = { slug: string; categorySlug: string; packageName: string; priceCents: number };
export type Applied = {
  promotionId: number | null; code: string; title: string; kind: PromoKind; percent: number; cents: number;
  source: "code" | "automatic" | "partner" | "volume"; lineCents: number[]; combinable: boolean;
  /** may the Buy More, Save More discount be added on top of this one */
  stacksVolume?: boolean;
  /** a BeigePilot negotiation offer (CLAUDE.md section 122): capped at NEGOTIATION_MAX_PERCENT here, whatever the stored value says */
  negotiation?: boolean;
};
export type EngineInput = {
  candidates: Candidate[]; enteredCode?: string;
  partner?: { code: string; percent: number };
  nowSec: number; emailKnown: boolean;
  /** Buy More, Save More settings (omitted = feature off) and whether personal reward codes may combine with it */
  volume?: VolumeSettings; rewardCombineVolume?: boolean;
};
export type VolumeInfo = {
  enabled: boolean; tiers: { min: number; percent: number }[];
  /** distinct eligible lists in the cart */ count: number;
  /** tier reached now (0 = none) */ percent: number;
  /** next tier: how many more lists unlock which percentage */ next: { need: number; percent: number } | null;
  /** true when the discount is part of the price; false when a code replaced it */ applied: boolean; replacedByCode: boolean;
};
export type EngineResult = {
  applied: Applied[]; discountCents: number; payCents: number[];
  /** message about the code the buyer typed when it did not (fully) apply; "" when fine */
  codeError: string;
  /** some applied promotion still needs the buyer's email to be verified (first purchase, per-customer limit, partner only) */
  needsEmail: boolean;
  volume?: VolumeInfo;
};

export const STACKING_RULES = [
  "A verified Data Reseller Partner code (50%) always applies on its own. Public promotions are never combined with it.",
  "When several promotions qualify, the one that saves the buyer the most is applied.",
  "A promotion marked \"combinable\" can be stacked with other combinable promotions. A non-combinable promotion is always applied alone.",
  "Discounts apply only to the lists a promotion covers, and the total can never go below $0.",
  "Percentage discounts are rounded to the nearest cent. \"Maximum discount\" caps the total saving of one promotion.",
];

/** Hard ceiling for any BeigePilot negotiation offer. Enforced in the pricing engine itself, so no setting or database row can exceed it. */
export const NEGOTIATION_MAX_PERCENT = 20;
export const NEGOTIATION_KEPT_VOLUME = "Your current bundle or volume savings are already better than the AI offer, so I've kept the larger discount for you.";
export const normalizePromoCode = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, "");
export const PROMO_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;

export type Window = "scheduled" | "live" | "expired";
export function promoWindow(p: Pick<Promo, "startsAt" | "endsAt">, nowSec: number): Window {
  if (p.startsAt !== null && nowSec < p.startsAt) return "scheduled";
  if (p.endsAt !== null && nowSec >= p.endsAt) return "expired";
  return "live";
}

/** Reasons a promotion cannot be used. The text is safe to show the buyer. */
export type Refusal = "invalid" | "scheduled" | "expired" | "limit" | "customer" | "first" | "partner";
export const REFUSAL_TEXT: Record<Refusal, string> = {
  invalid: "This code is not valid.",
  scheduled: "This code is not active yet.",
  expired: "This code has expired.",
  limit: "This code has reached its usage limit.",
  customer: "You have already used this code the maximum number of times.",
  first: "This code is for first purchases only.",
  partner: "This code is for approved Data Reseller Partners.",
};

export function refusal(p: Promo, f: PromoFacts, nowSec: number): Refusal | null {
  if (p.status !== "active") return "invalid";
  const w = promoWindow(p, nowSec);
  if (w === "scheduled") return "scheduled";
  if (w === "expired") return "expired";
  if (p.usageLimit !== null && f.totalUses >= p.usageLimit) return "limit";
  if (p.perCustomerLimit !== null && f.customerUses !== null && f.customerUses >= p.perCustomerLimit) return "customer";
  if (p.firstPurchaseOnly && f.firstPurchase === false) return "first";
  if (p.partnerOnly && f.partner === false) return "partner";
  if (p.boundEmail && f.emailMatch === false) return "invalid"; // same text as an unknown code: a personal code is never confirmed to others
  return null;
}

const needsEmail = (p: Promo, f: PromoFacts) =>
  (p.firstPurchaseOnly && f.firstPurchase === null) || (p.partnerOnly && f.partner === null) || (p.perCustomerLimit !== null && f.customerUses === null) || (!!p.boundEmail && f.emailMatch === null);

export function lineEligible(p: Promo, l: EngineLine): boolean {
  return (p.productSlugs.length === 0 || p.productSlugs.includes(l.slug))
    && (p.categorySlugs.length === 0 || p.categorySlugs.includes(l.categorySlug))
    && (p.packageNames.length === 0 || p.packageNames.includes(l.packageName));
}

/** Spreads `total` cents over the lines in proportion to `weights`, exactly (largest remainder), never above a line's weight. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const t = Math.min(total, sum);
  const raw = weights.map((w) => (w * t) / sum);
  const out = raw.map((x) => Math.floor(x));
  let left = t - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) { if (left <= 0) break; if (out[i] < weights[i]) { out[i]++; left--; } }
  return out;
}

/** Cents one promotion takes off, per line, given what each line still costs. `cartSubtotal` decides the minimum-spend rule. */
export function promoCents(p: Promo, lines: EngineLine[], remaining: number[], cartSubtotal: number): number[] {
  if (cartSubtotal < p.minCartCents) return lines.map(() => 0);
  const eligible = lines.map((l, i) => (lineEligible(p, l) ? remaining[i] : 0));
  const base = eligible.reduce((a, b) => a + b, 0);
  if (base <= 0) return lines.map(() => 0);
  const neg = p.origin === "negotiation";
  let total = p.kind === "percent" || neg ? Math.round((base * Math.min(neg ? NEGOTIATION_MAX_PERCENT : 100, Math.max(0, p.value))) / 100) : p.value;
  if (p.maxDiscountCents !== null) total = Math.min(total, p.maxDiscountCents);
  return allocate(Math.min(total, base), eligible);
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

function applyPromos(lines: EngineLine[], input: EngineInput): EngineResult {
  const price = lines.map((l) => l.priceCents);
  const subtotal = sum(price);
  const none: EngineResult = { applied: [], discountCents: 0, payCents: price, codeError: "", needsEmail: false };
  if (lines.length === 0) return none;

  // Rule 1: a verified partner code applies alone.
  if (input.partner) {
    const pct = Math.min(100, Math.max(0, Math.floor(input.partner.percent)));
    const cents = price.map((p) => p - Math.round((p * (100 - pct)) / 100));
    const total = sum(cents);
    const entered = input.enteredCode ? normalizePromoCode(input.enteredCode) : "";
    const typedOther = entered && entered !== input.partner.code;
    return {
      applied: total > 0 ? [{ promotionId: null, code: input.partner.code, title: "Data Reseller Partner discount", kind: "percent", percent: pct, cents: total, source: "partner", lineCents: cents, combinable: false }] : [],
      discountCents: total, payCents: price.map((p, i) => p - cents[i]),
      codeError: typedOther ? "Partner discounts cannot be combined with other codes." : "", needsEmail: false,
    };
  }

  const entered = input.enteredCode ? normalizePromoCode(input.enteredCode) : "";
  let codeError = "";
  let enteredPromo: Candidate | undefined;
  if (entered) {
    enteredPromo = input.candidates.find((c) => c.promo.code === entered);
    if (!enteredPromo) codeError = REFUSAL_TEXT.invalid;
    else {
      const r = refusal(enteredPromo.promo, enteredPromo.facts, input.nowSec);
      if (r) { codeError = REFUSAL_TEXT[r]; enteredPromo = undefined; }
    }
  }

  // Everything that may apply: the typed code + live automatic promotions.
  const pool: { c: Candidate; src: "code" | "automatic" }[] = [];
  if (enteredPromo) pool.push({ c: enteredPromo, src: "code" });
  for (const c of input.candidates) {
    if (!c.promo.automatic || c.promo.id === enteredPromo?.promo.id) continue;
    if (refusal(c.promo, c.facts, input.nowSec)) continue;
    pool.push({ c, src: "automatic" });
  }
  // Rule 2: price each on its own, best saving first (typed code wins ties).
  const scored = pool
    .map((x) => ({ ...x, own: promoCents(x.c.promo, lines, price, subtotal) }))
    .filter((x) => sum(x.own) > 0)
    .sort((a, b) => sum(b.own) - sum(a.own) || (a.src === "code" ? -1 : 0) - (b.src === "code" ? -1 : 0) || a.c.promo.id - b.c.promo.id);

  if (enteredPromo && !scored.some((x) => x.c.promo.id === enteredPromo.promo.id)) {
    const p = enteredPromo.promo;
    codeError = subtotal < p.minCartCents ? `Spend at least $${(p.minCartCents / 100).toFixed(2)} to use this code.` : "This code does not apply to the lists in your cart.";
  }
  if (scored.length === 0) return { ...none, codeError };

  // Rule 3: first one, then combinable extras on what is left.
  const chosen: typeof scored = [scored[0]];
  if (scored[0].c.promo.combinable) for (const x of scored.slice(1)) if (x.c.promo.combinable) chosen.push(x);
  const remaining = [...price];
  const applied: Applied[] = [];
  let needs = false;
  for (const x of chosen) {
    const p = x.c.promo;
    const cents = chosen.length === 1 ? x.own : promoCents(p, lines, remaining, subtotal);
    const total = sum(cents);
    if (total <= 0) continue;
    cents.forEach((c, i) => { remaining[i] -= c; });
    if (needsEmail(p, x.c.facts)) needs = true;
    applied.push({ promotionId: p.id, code: p.code ?? "", title: p.title, kind: p.kind, percent: p.kind === "percent" ? p.value : 0, cents: total, source: x.src, lineCents: cents, combinable: p.combinable, negotiation: p.origin === "negotiation", stacksVolume: p.origin === "negotiation" ? false : p.origin === "reward" ? !!input.rewardCombineVolume : !!input.volume?.stackWithPromos });
  }
  const notApplied = enteredPromo && !applied.some((a) => a.promotionId === enteredPromo.promo.id);
  if (notApplied) codeError = "A better offer is already applied to your cart. Offers cannot be combined.";
  return { applied, discountCents: sum(applied.map((a) => a.cents)), payCents: remaining, codeError, needsEmail: needs };
}

/** Distinct eligible lists -> tier. Pure. Excluded products and categories neither count nor get a discount. */
export function volumeInfo(lines: EngineLine[], v: VolumeSettings | undefined): VolumeInfo {
  if (!v || !v.enabled) return { enabled: false, tiers: [], count: 0, percent: 0, next: null, applied: false, replacedByCode: false };
  const eligible = lines.filter((l) => !v.excludedProducts.includes(l.slug) && !v.excludedCategories.includes(l.categorySlug));
  const count = new Set(eligible.map((l) => l.slug)).size; // distinct lists, never quantities
  const tiers = [...v.tiers].sort((a, b) => a.min - b.min);
  const reached = [...tiers].reverse().find((t) => count >= t.min);
  const next = tiers.find((t) => t.min > count);
  return { enabled: true, tiers, count, percent: reached?.percent ?? 0, next: next ? { need: next.min - count, percent: next.percent } : null, applied: false, replacedByCode: false };
}

/**
 * Promotion priority (CLAUDE.md section 113): a partner code applies alone; a code/promotion that applies replaces the Buy More, Save More
 * discount unless the settings say it may stack; with no code, the volume discount applies. Same function for the cart, checkout and team requests.
 */
export function applyPromotions(lines: EngineLine[], input: EngineInput): EngineResult {
  const base = applyPromos(lines, input);
  const info = volumeInfo(lines, input.volume);
  // A negotiation offer never stacks: the single greater saving wins (CLAUDE.md section 122).
  const neg = base.applied.find((a) => a.negotiation);
  if (neg && info.enabled && info.percent > 0) {
    const v = input.volume!;
    const volCents = lines.reduce((n, l) => n + (v.excludedProducts.includes(l.slug) || v.excludedCategories.includes(l.categorySlug) ? 0 : Math.round((l.priceCents * info.percent) / 100)), 0);
    if (volCents >= neg.cents) {
      const again = applyPromotions(lines, { ...input, enteredCode: undefined, candidates: input.candidates.filter((c) => c.promo.origin !== "negotiation") });
      return { ...again, codeError: NEGOTIATION_KEPT_VOLUME };
    }
  }
  if (!info.enabled) return base;
  if (base.applied.some((a) => a.source === "partner")) return { ...base, volume: info };
  const stack = base.applied.every((a) => a.stacksVolume);
  if (base.applied.length > 0 && !stack) return { ...base, volume: { ...info, replacedByCode: info.percent > 0 } };
  if (info.percent <= 0) return { ...base, volume: info };
  const v = input.volume!;
  const lineCents = lines.map((l, i) => (v.excludedProducts.includes(l.slug) || v.excludedCategories.includes(l.categorySlug) ? 0 : Math.round((base.payCents[i] * info.percent) / 100)));
  const cents = lineCents.reduce((a, b) => a + b, 0);
  if (cents <= 0) return { ...base, volume: info };
  const applied: Applied = { promotionId: null, code: "VOLUME", title: "Buy More, Save More", kind: "percent", percent: info.percent, cents, source: "volume", lineCents, combinable: true, stacksVolume: true };
  return { ...base, applied: [...base.applied, applied], discountCents: base.discountCents + cents, payCents: base.payCents.map((p, i) => p - lineCents[i]), volume: { ...info, applied: true } };
}
