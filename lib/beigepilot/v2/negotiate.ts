// Pilo negotiation policy (CLAUDE.md section 122). Pure. The ceiling is a CODE constant (also enforced in the pricing engine): no admin
// setting, database row or AI message can raise it. Pilo never offers unprompted: an offer needs an explicit discount request.
import { NEGOTIATION_MAX_PERCENT } from "@/lib/promos/engine";

export const ALL_LEVELS = [5, 10, 15, 20] as const;
export type NegPolicy = {
  enabled: boolean; maxPercent: number; levels: number[]; allowDirect: boolean;
  /** empty = every standard database category */ eligibleCategories: string[];
  excludedProducts: string[]; excludedCategories: string[];
  expiryMinutes: number; maxPerSession: number; maxPerIpDay: number;
  minCartCents: number; maxSavingCents: number | null;
};
export const DEFAULT_NEG: NegPolicy = { enabled: false, maxPercent: 20, levels: [5, 10, 15, 20], allowDirect: true, eligibleCategories: [], excludedProducts: [], excludedCategories: [], expiryMinutes: 60, maxPerSession: 3, maxPerIpDay: 10, minCartCents: 0, maxSavingCents: null };

const list = (v: unknown, n = 60, len = 80): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase().slice(0, len)).filter(Boolean))].slice(0, n) : []);
const int = (v: unknown, d: number, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) && v !== "" && v !== null && v !== undefined ? Math.min(max, Math.max(min, Math.round(n))) : d; };

/** Defensive parse (never throws, never returns a percentage above the ceiling). */
export function parseNeg(raw: string | undefined | null): NegPolicy {
  let o: Record<string, unknown> = {};
  try { const j = JSON.parse(raw ?? "") as unknown; if (j && typeof j === "object") o = j as Record<string, unknown>; } catch { /* defaults */ }
  const maxPercent = int(o.maxPercent, DEFAULT_NEG.maxPercent, 1, NEGOTIATION_MAX_PERCENT);
  const levels = (Array.isArray(o.levels) ? o.levels : DEFAULT_NEG.levels).map(Number).filter((n) => (ALL_LEVELS as readonly number[]).includes(n) && n <= maxPercent);
  const sorted = [...new Set(levels)].sort((a, b) => a - b);
  const cap = o.maxSavingCents === null || o.maxSavingCents === undefined || o.maxSavingCents === "" ? null : int(o.maxSavingCents, 0, 0, 100_000_000) || null;
  return {
    enabled: o.enabled === true, maxPercent, levels: sorted.length ? sorted : ALL_LEVELS.filter((n) => n <= maxPercent), allowDirect: o.allowDirect !== false,
    eligibleCategories: list(o.eligibleCategories), excludedProducts: list(o.excludedProducts), excludedCategories: list(o.excludedCategories),
    expiryMinutes: int(o.expiryMinutes, 60, 10, 1440), maxPerSession: int(o.maxPerSession, 3, 1, 5), maxPerIpDay: int(o.maxPerIpDay, 10, 1, 50),
    minCartCents: int(o.minCartCents, 0, 0, 100_000_000), maxSavingCents: cap,
  };
}

const ASK = [
  /\b(discounts?|coupons?|promo(?:tion)?s?|promo codes?|deals?|cheaper|lower (?:the )?price|better price|best price|reduce (?:the )?price|price (?:drop|break)|any offers?|special offers?|bargain|negotiate|haggle|knock off|% ?off|percent off)\b/i,
  /\b(descuentos?|rebajas?|oferta|más barato|mas barato|cupón|cupon)\b/i, /\b(remises?|r[ée]ductions?|rabais|moins cher|promo|offre)\b/i, /\b(rabatt|g[üu]nstiger|billiger|angebot|gutschein)\b/i,
  /\b(sconto|sconti|pi[ùu] economico|offerta|coupon)\b/i, /\b(desconto|descontos|mais barato|oferta|cupom)\b/i, /(خصم|تخفيض|أرخص|عرض خاص|كوبون)/, /(رعایت|ڈسکاؤنٹ|سستا|کم قیمت|چھوٹ|آفر)/,
];
/** Did the visitor EXPLICITLY ask for a discount? `requested` = a percentage they named ("can I get 30% off?"), else 0. */
export function detectDiscountAsk(text: string): { ask: boolean; requested: number } {
  const t = text.slice(0, 1500);
  const ask = ASK.some((re) => re.test(t));
  const m = t.match(/(\d{1,3})\s*(?:%|percent|por ?ciento|pour ?cent|prozent|per ?cento|por ?cento|بالمئة|فیصد)/i);
  const requested = m ? Math.min(100, Number(m[1])) : 0;
  return { ask: ask || (requested > 0 && /\b(off|discount|less|down|rabatt|sconto|desconto|descuento|remise)\b/i.test(t)), requested };
}

export type Decision = { percent: number; capped: boolean; exhausted: boolean };
/**
 * Which percentage to offer now. Progressive ladder only along the admin's levels; a direct request is honoured up to the highest level
 * that is <= what was asked (when allowed). Asking for more than the ceiling never goes above it: the answer is the top level, `capped` is true.
 * `lastPercent` = the best offer this session already received (0 = none yet).
 */
export function decide(policy: NegPolicy, lastPercent: number, requested: number): Decision {
  const levels = policy.levels.filter((l) => l <= Math.min(policy.maxPercent, NEGOTIATION_MAX_PERCENT));
  if (levels.length === 0) return { percent: 0, capped: false, exhausted: true };
  const top = levels[levels.length - 1];
  const capped = requested > top;
  if (lastPercent >= top) return { percent: top, capped, exhausted: true };
  let want: number | null = null;
  if (policy.allowDirect && requested > 0) { const fit = [...levels].reverse().find((l) => l <= Math.min(requested, top)); want = fit ?? null; }
  const ladder = levels.find((l) => l > lastPercent) ?? top;
  const percent = Math.max(want ?? 0, ladder > lastPercent ? (want && want > ladder ? want : ladder) : top);
  return { percent: Math.min(percent, top), capped, exhausted: percent >= top };
}

/** Prompt-injection guard: the model may only ASK the server for an offer; whether one exists is decided from the visitor's real last message. */
export const OFFER_REFUSAL: Record<string, string> = {
  disabled: "Special offers from me aren't available right now.",
  "no-ask": "I can only look for an offer when you ask about a discount.",
  "empty-cart": "Add a database to your cart first, then I can check whether an offer is available.",
  ineligible: "The databases in your cart aren't eligible for an extra offer.",
  limit: "I've reached the number of offers I can make in this chat.",
  busy: "I can't make another offer from this connection right now. Please try again later.",
  exhausted: "That is the best offer I can make for this cart.",
  below: "A minimum cart value applies before an offer can be made.",
  error: "I couldn't check offers just now. Please try again in a moment.",
};
