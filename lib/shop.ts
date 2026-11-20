// Pure shop engine (no database, safe in the browser): serialisable product data, URL <-> filter state,
// filtering, sorting, facets and query interpretation. Only REAL catalog data is ever used.
import { distance } from "@/lib/help/search";

export const SORTS = ["relevance", "availability", "price-low", "price-high", "name"] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 12;

/** One product as the browser sees it. Placeholder numbers are removed on the server (`recordCount`/`fromCents` null). */
export type ShopProduct = {
  slug: string; name: string; title: string;
  categorySlug: string; categoryName: string;
  countrySlug: string; countryName: string; countryCode: string;
  fields: string[]; status: "draft" | "live";
  recordCount: number | null; fromCents: number | null;
  scope?: "country" | "city"; citySlug?: string | null; description?: string;
};
export type GeoCityNode = { slug: string; name: string; regionSlug: string | null; cats: string[] };
export type GeoRegionNode = { slug: string; name: string; cats: string[] };
export type GeoCountryNode = { slug: string; name: string; code: string; regions: GeoRegionNode[]; cities: GeoCityNode[] };
export type GeoTree = GeoCountryNode[];

export type Filters = {
  type: "b2b" | "b2c";
  q: string;
  industries: string[]; countries: string[];
  state: string; city: string;
  fields: string[];
  avail: "" | "live" | "preview";
  minRecords: number | null; maxRecords: number | null;
  minPrice: number | null; maxPrice: number | null; // whole USD
  sort: Sort; page: number;
};
export const EMPTY: Filters = { type: "b2b", q: "", industries: [], countries: [], state: "", city: "", fields: [], avail: "", minRecords: null, maxRecords: null, minPrice: null, maxPrice: null, sort: "relevance", page: 1 };

type SP = Record<string, string | string[] | undefined>;
const slugList = (v: string) => [...new Set(v.split(",").map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z0-9-]{1,60}$/.test(s)))].slice(0, 12);
const num = (v: string) => { const n = Number(v); return v !== "" && Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.floor(n) : null; };

export function parseFilters(sp: SP | URLSearchParams): Filters {
  const one = (k: string) => { if (sp instanceof URLSearchParams) return sp.get(k) ?? ""; const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const sort = one("sort") as Sort;
  const avail = one("avail");
  return {
    type: one("type") === "b2c" ? "b2c" : "b2b",
    q: one("q").trim().slice(0, 80),
    industries: slugList(one("industry")), countries: slugList(one("country")),
    state: slugList(one("state"))[0] ?? "", city: slugList(one("city"))[0] ?? "",
    fields: one("fields").split(",").map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 12),
    avail: avail === "live" || avail === "preview" ? avail : "",
    minRecords: num(one("minRecords")), maxRecords: num(one("maxRecords")), minPrice: num(one("minPrice")), maxPrice: num(one("maxPrice")),
    sort: SORTS.includes(sort) ? sort : "relevance",
    page: Math.max(1, Math.min(500, Number(one("page")) || 1)),
  };
}

/** One canonical query string per view; defaults are left out. */
export function listsHref(f: Partial<Filters>): string {
  const u = new URLSearchParams();
  if (f.type && f.type !== "b2b") u.set("type", f.type);
  if (f.q) u.set("q", f.q);
  if (f.industries?.length) u.set("industry", f.industries.join(","));
  if (f.countries?.length) u.set("country", f.countries.join(","));
  if (f.state) u.set("state", f.state);
  if (f.city) u.set("city", f.city);
  if (f.fields?.length) u.set("fields", f.fields.join(","));
  if (f.avail) u.set("avail", f.avail);
  if (f.minRecords != null) u.set("minRecords", String(f.minRecords));
  if (f.maxRecords != null) u.set("maxRecords", String(f.maxRecords));
  if (f.minPrice != null) u.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) u.set("maxPrice", String(f.maxPrice));
  if (f.sort && f.sort !== "relevance") u.set("sort", f.sort);
  if (f.page && f.page > 1) u.set("page", String(f.page));
  const s = u.toString();
  return s ? `/lists?${s}` : "/lists";
}

/** True when anything other than the plain page is selected (such views are noindex and canonical to /shop). */
export const isFiltered = (f: Filters) => !!(f.q || f.industries.length || f.countries.length || f.state || f.city || f.fields.length || f.avail || f.minRecords != null || f.maxRecords != null || f.minPrice != null || f.maxPrice != null || f.sort !== "relevance" || f.type === "b2c");

// ---------- places ----------
const countryNode = (tree: GeoTree, slug: string) => tree.find((c) => c.slug === slug);
/** Regions that can be chosen, given the countries picked (all countries when none). */
export function stateOptions(tree: GeoTree, f: Pick<Filters, "countries">) {
  return tree.filter((c) => !f.countries.length || f.countries.includes(c.slug)).flatMap((c) => c.regions.map((r) => ({ slug: r.slug, name: r.name, countrySlug: c.slug, countryName: c.name })));
}
/** Cities that can be chosen, given the countries and state picked. */
export function cityOptions(tree: GeoTree, f: Pick<Filters, "countries" | "state">) {
  return tree.filter((c) => !f.countries.length || f.countries.includes(c.slug)).flatMap((c) => c.cities.filter((x) => !f.state || x.regionSlug === f.state).map((x) => ({ slug: x.slug, name: x.name, countrySlug: c.slug })));
}
/** Does this national product have real inventory recorded in the chosen place? */
function inPlace(p: ShopProduct, tree: GeoTree, f: Pick<Filters, "state" | "city">): boolean {
  const c = countryNode(tree, p.countrySlug);
  if (!c) return false;
  if (f.city) return c.cities.some((x) => x.slug === f.city && x.cats.includes(p.categorySlug));
  if (f.state) return c.regions.some((r) => r.slug === f.state && r.cats.includes(p.categorySlug));
  return true;
}

// ---------- search ----------
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["in", "the", "a", "an", "of", "for", "list", "lists", "email", "emails", "database", "databases", "contact", "contacts", "business", "businesses", "leads", "and"]);
/** Typos allowed: one edit for words of 5+ letters, two for 8+. */
const tol = (w: string) => (w.length >= 8 ? 2 : 1);
const stem = (w: string) => (w.length > 3 ? w.replace(/ies$/, "y").replace(/s$/, "") : w);

/** Every word of the query must match somewhere (exact, prefix, or one typo for longer words). */
export function textMatches(p: ShopProduct, q: string, extra: string[] = []): boolean {
  const words = norm(q).split(" ").filter((w) => w && !STOP.has(w)).map(stem);
  if (!words.length) return true;
  const hay = norm([p.name, p.title, p.categoryName, p.countryName, ...extra].join(" ")).split(" ").map(stem);
  return words.every((w) => hay.some((h) => h === w || (w.length >= 3 && h.startsWith(w)) || (w.length >= 5 && distance(w, h, tol(w)) <= tol(w))));
}

export type Interpretation = { industry?: { slug: string; name: string }; country?: { slug: string; name: string }; state?: { slug: string; name: string }; city?: { slug: string; name: string } };

/** "dentists in alabama" -> industry + country + state, using only industries and places that really exist. */
export function interpret(q: string, industries: { slug: string; name: string; hints?: string[] }[], tree: GeoTree): Interpretation {
  const text = norm(q);
  const out: Interpretation = {};
  const m = text.match(/^(.*)\s(?:in|near|from)\s(?:the\s)?(.+)$/);
  const what = (m ? m[1] : text).split(" ").filter((w) => w && !STOP.has(w)).map(stem);
  const place = m ? m[2] : "";
  let best = 0;
  for (const i of industries) {
    const keys = new Set([...norm(i.name).split(" "), ...(i.hints ?? []).flatMap((h) => norm(h).split(" "))].map(stem));
    const score = what.filter((w) => keys.has(w) || [...keys].some((k) => w.length >= 5 && distance(w, k, tol(w)) <= tol(w))).length;
    if (score > best) { best = score; out.industry = { slug: i.slug, name: i.name }; }
  }
  const aliases: Record<string, string> = { us: "united-states", usa: "united-states", america: "united-states" };
  const probe = place || (best ? "" : text);
  if (probe) {
    const parts = probe.split(/\s*,\s*|\s+/).filter(Boolean);
    for (const c of tree) {
      const cname = norm(c.name);
      if (probe === cname || aliases[probe] === c.slug || (parts.length && aliases[parts[parts.length - 1]] === c.slug) || probe.endsWith(` ${cname}`)) out.country = { slug: c.slug, name: c.name };
    }
    const rest = out.country ? probe.replace(new RegExp(`\\s*(${norm(out.country.name)}|usa|us|america)$`), "").trim() : probe;
    for (const c of tree) {
      if (out.country && c.slug !== out.country.slug) continue;
      const r = c.regions.find((x) => norm(x.name) === rest);
      if (r) { out.state = { slug: r.slug, name: r.name }; out.country = { slug: c.slug, name: c.name }; }
      const city = c.cities.find((x) => norm(x.name) === rest);
      if (city) { out.city = { slug: city.slug, name: city.name }; out.country = { slug: c.slug, name: c.name }; if (city.regionSlug) { const rr = c.regions.find((x) => x.slug === city.regionSlug); if (rr) out.state = { slug: rr.slug, name: rr.name }; } }
    }
  }
  return out;
}

// ---------- filtering ----------
export type ShopData = { products: ShopProduct[]; tree: GeoTree; industries: { slug: string; name: string; blurb?: string; hints?: string[] }[]; countries: { slug: string; name: string; code: string }[] };

/** Applies every filter. The free-text query is interpreted first ("dentists in alabama"), then falls back to word matching. */
export function applyFilters(data: ShopData, f: Filters, featured: string[] = []): ShopProduct[] {
  const it = f.q ? interpret(f.q, data.industries, data.tree) : {};
  const structured = !!(it.industry && (it.country || it.state || it.city));
  const industries = f.industries.length ? f.industries : structured && it.industry ? [it.industry.slug] : [];
  const countries = f.countries.length ? f.countries : structured && it.country ? [it.country.slug] : [];
  const state = f.state || (structured && it.state ? it.state.slug : "");
  const city = f.city || (structured && it.city ? it.city.slug : "");
  const rank = (p: ShopProduct) => { const i = featured.indexOf(p.categorySlug); return i < 0 ? 999 : i; };
  const price = (p: ShopProduct) => p.fromCents ?? Number.MAX_SAFE_INTEGER;
  const live = (p: ShopProduct) => (p.status === "live" ? 0 : 1);
  let list = data.products.filter((p) => {
    if (industries.length && !industries.includes(p.categorySlug)) return false;
    if (countries.length && !countries.includes(p.countrySlug)) return false;
    if ((state || city) && !inPlace(p, data.tree, { state, city })) return false;
    if (f.q && !structured && !textMatches(p, f.q)) return false;
    if (f.fields.length && !f.fields.every((x) => p.fields.includes(x))) return false;
    if (f.avail === "live" && p.status !== "live") return false;
    if (f.avail === "preview" && p.status === "live") return false;
    if (f.minRecords != null && (p.recordCount ?? -1) < f.minRecords) return false;
    if (f.maxRecords != null && (p.recordCount ?? Infinity) > f.maxRecords) return false;
    if (f.minPrice != null && (p.fromCents ?? -1) < f.minPrice * 100) return false;
    if (f.maxPrice != null && (p.fromCents ?? Infinity) > f.maxPrice * 100) return false;
    return true;
  });
  list = [...list].sort((a, b) => {
    if (f.sort === "name") return a.name.localeCompare(b.name);
    if (f.sort === "availability") return live(a) - live(b) || rank(a) - rank(b) || a.name.localeCompare(b.name);
    if (f.sort === "price-low") return price(a) - price(b) || a.name.localeCompare(b.name);
    if (f.sort === "price-high") return (b.fromCents ?? -1) - (a.fromCents ?? -1) || a.name.localeCompare(b.name);
    return rank(a) - rank(b) || live(a) - live(b) || a.name.localeCompare(b.name);
  });
  return list;
}

export const paginate = <T,>(list: T[], page: number) => {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const p = Math.min(page, pages);
  return { items: list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE), pages, page: p };
};

// ---------- facets: only offer what the data can support ----------
export type Facets = { fields: string[]; hasAvailability: boolean; records: { min: number; max: number } | null; price: { min: number; max: number } | null; states: ReturnType<typeof stateOptions>; cities: ReturnType<typeof cityOptions> };
export function facets(data: ShopData, f: Filters): Facets {
  const P = data.products;
  const fieldSets = P.map((p) => p.fields);
  const all = [...new Set(fieldSets.flat())];
  // A field filter is useful only when products really differ.
  const fieldsVary = all.some((x) => fieldSets.some((s) => !s.includes(x)));
  const statuses = new Set(P.map((p) => p.status));
  const recs = P.map((p) => p.recordCount).filter((n): n is number => n != null);
  const prices = P.map((p) => p.fromCents).filter((n): n is number => n != null);
  return {
    fields: fieldsVary ? all : [],
    hasAvailability: statuses.size > 1,
    records: recs.length > 1 && Math.min(...recs) !== Math.max(...recs) ? { min: Math.min(...recs), max: Math.max(...recs) } : null,
    price: prices.length > 1 && Math.min(...prices) !== Math.max(...prices) ? { min: Math.floor(Math.min(...prices) / 100), max: Math.ceil(Math.max(...prices) / 100) } : null,
    states: stateOptions(data.tree, f),
    cities: cityOptions(data.tree, f),
  };
}

export type Chip = { key: string; label: string; remove: Partial<Filters> };
/** Active filters as removable chips. */
export function chips(f: Filters, data: ShopData): Chip[] {
  const out: Chip[] = [];
  if (f.q) out.push({ key: "q", label: `Search: ${f.q}`, remove: { q: "" } });
  for (const s of f.industries) out.push({ key: `i-${s}`, label: data.industries.find((i) => i.slug === s)?.name ?? s, remove: { industries: f.industries.filter((x) => x !== s) } });
  for (const s of f.countries) out.push({ key: `c-${s}`, label: data.countries.find((i) => i.slug === s)?.name ?? s, remove: { countries: f.countries.filter((x) => x !== s), state: "", city: "" } });
  if (f.state) out.push({ key: "st", label: stateOptions(data.tree, { countries: [] }).find((x) => x.slug === f.state)?.name ?? f.state, remove: { state: "", city: "" } });
  if (f.city) out.push({ key: "ci", label: cityOptions(data.tree, { countries: [], state: "" }).find((x) => x.slug === f.city)?.name ?? f.city, remove: { city: "" } });
  for (const x of f.fields) out.push({ key: `f-${x}`, label: `Has ${x.toLowerCase()}`, remove: { fields: f.fields.filter((y) => y !== x) } });
  if (f.avail) out.push({ key: "av", label: f.avail === "live" ? "Ready to buy" : "Preview only", remove: { avail: "" } });
  if (f.minRecords != null || f.maxRecords != null) out.push({ key: "rec", label: `Records ${f.minRecords ?? 0}${f.maxRecords != null ? `–${f.maxRecords}` : "+"}`, remove: { minRecords: null, maxRecords: null } });
  if (f.minPrice != null || f.maxPrice != null) out.push({ key: "pr", label: `Price $${f.minPrice ?? 0}${f.maxPrice != null ? `–$${f.maxPrice}` : "+"}`, remove: { minPrice: null, maxPrice: null } });
  return out;
}
