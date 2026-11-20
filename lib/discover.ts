// Home page lead discovery over EVERY product on the site (built-in and imported). Pure and deterministic: token matching against the
// product's own name, category, country, state/city and channel. No AI, no invented counts or prices.
import { startingPriceCents, type Product } from "@/lib/catalog";

export type Lite = {
  slug: string; name: string; title: string; categorySlug: string; categoryName: string; countryName: string; region: string;
  fields: string[]; forSale: boolean; records: number | null; fromCents: number | null;
};
export type Discovery = {
  exact: Lite[]; close: Lite[];
  categories: { slug: string; name: string }[]; countries: { slug: string; name: string }[];
  total: number; // number of matching lists (a search result, not the size of the catalog)
};

const STOP = new Set(["i", "need", "want", "get", "find", "me", "a", "an", "the", "of", "in", "near", "from", "within", "for", "all", "with", "and", "my", "list", "lists", "database", "databases", "contacts", "contact", "leads", "lead", "verified", "businesses", "business", "buy", "emails", "email"]);
const ALIAS: Record<string, string> = { usa: "united states", us: "united states", america: "united states", uk: "united kingdom", uae: "united arab emirates", mobile: "phone", cell: "phone", telephone: "phone", people: "consumer", consumers: "consumer" };
const stem = (w: string) => (w.length > 3 ? w.replace(/ies$/, "y").replace(/(es|s)$/, "") : w);
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter(Boolean);

export function queryTokens(q: string): string[] {
  const out: string[] = [];
  for (const w of words(q)) {
    if (/^\d+[km]?$/.test(w)) continue; // quantities are not matched
    const a = ALIAS[w];
    for (const x of a ? a.split(" ") : [w]) if (!STOP.has(x)) out.push(stem(x));
  }
  return out;
}

type Entry = { p: Product; name: Set<string>; cat: Set<string>; geo: Set<string>; all: string };
let cache: { key: readonly Product[]; entries: Entry[] } | null = null;
const entriesOf = (products: readonly Product[]): Entry[] => {
  if (cache && cache.key === products) return cache.entries;
  const set = (s: string) => new Set(words(s).map(stem));
  const entries = products.map((p): Entry => ({
    p, name: set(`${p.name} ${p.title}`), cat: set(`${p.categorySlug.replace(/-/g, " ")} ${p.channel ?? ""}`), geo: set(`${p.countrySlug.replace(/-/g, " ")} ${p.region ?? ""} ${p.citySlug ?? ""}`),
    all: norm(`${p.name} ${p.title} ${p.categorySlug} ${p.countrySlug} ${p.region ?? ""}`),
  }));
  cache = { key: products, entries };
  return entries;
};

const hit = (set: Set<string>, t: string) => set.has(t) || (t.length >= 4 && [...set].some((w) => w.startsWith(t)));

const lite = (p: Product, catName: (s: string) => string, countryName: (s: string) => string): Lite => {
  const real = !p.placeholderData;
  const from = real ? startingPriceCents(p) : null;
  return { slug: p.slug, name: p.name, title: p.title, categorySlug: p.categorySlug, categoryName: catName(p.categorySlug), countryName: countryName(p.countrySlug), region: p.region ?? "", fields: [...p.fields], forSale: p.status === "live", records: real ? p.recordCount : null, fromCents: from };
};

export function discover(products: readonly Product[], q: string, names: { cat: (s: string) => string; country: (s: string) => string }, limit = 12): Discovery {
  const toks = queryTokens(q);
  const empty: Discovery = { exact: [], close: [], categories: [], countries: [], total: 0 };
  if (!toks.length) return empty;
  const scored: { e: Entry; score: number; matched: number }[] = [];
  for (const e of entriesOf(products)) {
    let score = 0, matched = 0;
    for (const t of toks) {
      if (hit(e.name, t)) { score += 3; matched++; } else if (hit(e.cat, t)) { score += 2; matched++; } else if (hit(e.geo, t)) { score += 2; matched++; } else if (t.length >= 3 && e.all.includes(t)) { score += 1; matched++; }
    }
    if (matched) scored.push({ e, score, matched });
  }
  scored.sort((a, b) => b.matched - a.matched || b.score - a.score || (a.e.p.status === "live" ? 0 : 1) - (b.e.p.status === "live" ? 0 : 1) || a.e.p.name.localeCompare(b.e.p.name));
  const full = scored.filter((s) => s.matched === toks.length);
  const part = scored.filter((s) => s.matched < toks.length && s.matched >= Math.max(1, Math.ceil(toks.length / 2)));
  const cats = new Map<string, string>(), ctry = new Map<string, string>();
  for (const s of (full.length ? full : part).slice(0, 200)) { cats.set(s.e.p.categorySlug, names.cat(s.e.p.categorySlug)); ctry.set(s.e.p.countrySlug, names.country(s.e.p.countrySlug)); }
  const l = (s: { e: Entry }) => lite(s.e.p, names.cat, names.country);
  return {
    exact: full.slice(0, limit).map(l), close: full.length ? [] : part.slice(0, 6).map(l),
    categories: [...cats].slice(0, 6).map(([slug, name]) => ({ slug, name })), countries: [...ctry].slice(0, 6).map(([slug, name]) => ({ slug, name })),
    total: full.length || part.length,
  };
}

/** Type-ahead: product names and categories that start or contain the typed words. */
export function suggest(products: readonly Product[], q: string, names: { cat: (s: string) => string }, n = 6): string[] {
  const t = norm(q); if (t.length < 2) return [];
  const out: string[] = [], seen = new Set<string>();
  const add = (s: string) => { const k = s.toLowerCase(); if (!seen.has(k) && out.length < n) { seen.add(k); out.push(s); } };
  const toks = queryTokens(q);
  if (!toks.length) return [];
  for (const e of entriesOf(products)) if (norm(e.p.name).startsWith(t)) add(e.p.name);
  for (const e of entriesOf(products)) if (out.length < n && toks.every((x) => hit(e.name, x) || hit(e.cat, x))) add(names.cat(e.p.categorySlug));
  for (const e of entriesOf(products)) if (out.length < n && norm(e.p.name).includes(t)) add(e.p.name);
  return out;
}
