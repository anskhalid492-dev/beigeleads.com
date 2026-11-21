// Pilo conversation memory (CLAUDE.md section 122). Pure and deterministic: it keeps ONLY what the visitor said, never guesses.
// Held in the visitor's browser (sessionStorage; localStorage only with opt-in) and re-derived on the server from the messages it receives.
import type { Lang } from "./lang";

export type Memory = {
  country: string; industry: string; audience: string; quantity: number; budgetCents: number;
  /** slugs of databases the visitor picked or compared */ picked: string[]; asked: string[]; lang: Lang | "";
};
export const EMPTY_MEMORY: Memory = { country: "", industry: "", audience: "", quantity: 0, budgetCents: 0, picked: [], asked: [], lang: "" };
export type Slot = "industry" | "country" | "quantity" | "budget" | "package";

const COUNTRIES: [string, RegExp][] = [
  ["USA", /\b(usa|u\.s\.a?\.?|us|united states|america|american)\b/i], ["United Kingdom", /\b(uk|u\.k\.|united kingdom|britain|british|england)\b/i], ["Germany", /\b(germany|german|deutschland|alemania|allemagne|alemanha|germania|berlin)\b/i],
  ["Canada", /\b(canada|canadian)\b/i], ["Australia", /\b(australia|australian)\b/i], ["France", /\b(france|french|francia|frankreich)\b/i], ["Spain", /\b(spain|spanish|españa|espana|espagne|spanien)\b/i],
  ["Italy", /\b(italy|italian|italia|italien)\b/i], ["Brazil", /\b(brazil|brasil|brazilian)\b/i], ["India", /\b(india|indian)\b/i], ["UAE", /\b(uae|dubai|emirates|united arab emirates)\b/i], ["Pakistan", /\b(pakistan|pakistani)\b/i],
  ["Netherlands", /\b(netherlands|holland|dutch)\b/i], ["Mexico", /\b(mexico|méxico|mexican)\b/i], ["Saudi Arabia", /\b(saudi arabia|saudi|ksa)\b/i],
];
const INDUSTRIES: [string, RegExp][] = [
  ["Healthcare", /\b(healthcare|health care|medical|hospitals?|clinics?|doctors?|physicians?|nurses?|salud|santé|gesundheit|saúde|salute)\b/i], ["Dentists", /\b(dentists?|dental|dentistas?|dentistes?|zahn(ä|a)rzte?|dentisti)\b/i],
  ["Real Estate", /\b(real estate|realtors?|realty|property agents?|estate agents?|inmobiliari\w*|immobili\w*|imobili\w*)\b/i], ["Restaurants", /\b(restaurants?|cafes?|caf(é|e)s|restaurantes?|ristoranti|gastronomie)\b/i],
  ["Lawyers", /\b(lawyers?|attorneys?|law firms?|abogados?|avocats?|anw(ä|a)lte|avvocati|advogados?)\b/i], ["Marketing Agencies", /\b(marketing agenc\w+|digital agenc\w+|agencies)\b/i],
  ["Ski Shops", /\b(ski shops?|ski stores?)\b/i], ["Crypto", /\b(crypto\w*|blockchain|web3)\b/i], ["Construction", /\b(construction|contractors?|builders?)\b/i], ["Hotels", /\b(hotels?|hospitality)\b/i],
  ["Gyms", /\b(gyms?|fitness)\b/i], ["Accountants", /\b(accountants?|accounting|cpa)\b/i], ["Veterinarians", /\b(vets?|veterinar\w+)\b/i], ["Pharmacies", /\b(pharmac\w+)\b/i], ["Insurance", /\b(insurance)\b/i],
];
const AUDIENCES: [string, RegExp][] = [
  ["Business owners", /\b(business owners?|owners?)\b/i], ["Decision makers", /\b(decision[- ]makers?|ceos?|founders?|executives?|directors?|managers?)\b/i], ["Local businesses", /\blocal (businesses|shops|stores)\b/i],
];

const NUM = (s: string) => Number(s.replace(/[,\s]/g, ""));
/** "50,000", "50k", "1.5m" followed by contacts/leads/emails/records. */
export function parseQuantity(t: string): number {
  const m = t.match(/\b(\d[\d,.]*)\s*(k|m|million|thousand)?\s*(contacts?|leads?|emails?|records?|rows?|prospects?|businesses|companies|dentists|restaurants)?\b/i);
  const all = [...t.matchAll(/\b(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|thousand)?\s*(contacts?|leads?|emails?|records?|rows?|prospects?)\b/gi)];
  const pick = all[0] ?? (m && m[2] ? m : null);
  if (!pick) return 0;
  let n = NUM(pick[1]);
  const u = (pick[2] ?? "").toLowerCase();
  if (u === "k" || u === "thousand") n *= 1000; else if (u === "m" || u === "million") n *= 1_000_000;
  return Number.isFinite(n) && n >= 100 && n <= 50_000_000 ? Math.round(n) : 0;
}
/** "under $100", "$250 budget", "budget of 500 dollars", "less than 99$". Cents; 0 when none. */
export function parseBudgetCents(t: string): number {
  const m = t.match(/(?:under|below|less than|max(?:imum)?|up to|within|budget(?: of| is)?|around|about)?\s*(?:\$|usd\s*)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:\$|dollars|usd)\b/i);
  if (!m) return 0;
  const n = Number((m[1] ?? m[2]).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 5 && n <= 100_000 ? Math.round(n * 100) : 0;
}

/** Merge what the visitor just said into the memory. A new value REPLACES the old one (requirements change); nothing is invented. */
export function remember(prev: Memory, text: string, lang?: Lang | null): Memory {
  const m: Memory = { ...prev, picked: [...prev.picked], asked: [...prev.asked] };
  const c = COUNTRIES.find(([, re]) => re.test(text)); if (c) m.country = c[0];
  const i = INDUSTRIES.find(([, re]) => re.test(text)); if (i) m.industry = i[0];
  const a = AUDIENCES.find(([, re]) => re.test(text)); if (a) m.audience = a[0];
  const q = parseQuantity(text); if (q) m.quantity = q;
  const b = parseBudgetCents(text); if (b) m.budgetCents = b;
  if (lang) m.lang = lang;
  return m;
}
export function rememberAll(texts: string[], lang?: Lang | null): Memory { return texts.reduce((m, t) => remember(m, t), { ...EMPTY_MEMORY, lang: lang ?? "" }); }

export function pick(m: Memory, slug: string): Memory { return m.picked.includes(slug) ? m : { ...m, picked: [...m.picked, slug].slice(-6) }; }
export const isEmpty = (m: Memory) => !m.country && !m.industry && !m.audience && !m.quantity && !m.budgetCents && m.picked.length === 0;

/** Defensive parse of memory sent by the browser (it is untrusted input: short strings, bounded numbers). */
export function parseMemory(raw: unknown): Memory {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (v: unknown, n = 40) => (typeof v === "string" ? v.replace(/[\r\n<>]/g, " ").trim().slice(0, n) : "");
  const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.min(max, Math.round(v)) : 0);
  const arr = (v: unknown, n: number, len: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, len)).slice(0, n) : []);
  return { country: s(o.country), industry: s(o.industry), audience: s(o.audience), quantity: num(o.quantity, 50_000_000), budgetCents: num(o.budgetCents, 10_000_000), picked: arr(o.picked, 6, 80), asked: arr(o.asked, 8, 30), lang: typeof o.lang === "string" ? (o.lang as Lang) : "" };
}

/** Human-readable lines (for the "what Pilo remembers" box and the system prompt). */
export function describe(m: Memory): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (m.industry) out.push({ label: "Industry", value: m.industry });
  if (m.country) out.push({ label: "Country", value: m.country });
  if (m.audience) out.push({ label: "Prospects", value: m.audience });
  if (m.quantity) out.push({ label: "Quantity", value: m.quantity.toLocaleString("en-US") });
  if (m.budgetCents) out.push({ label: "Budget", value: `$${(m.budgetCents / 100).toLocaleString("en-US")}` });
  if (m.picked.length) out.push({ label: "Selected", value: m.picked.join(", ") });
  return out;
}
