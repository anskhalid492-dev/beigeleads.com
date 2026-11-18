// Structured search over the static catalog (no AI, no invented data).
// parseQuery pulls quantity / category / country / place out of free text; searchCatalog returns
// real products only. A future AI step may sit in front of this, never replace the catalog lookup.
import { getCategories, getCountries, getCities, getProducts, type Category, type Product } from "@/lib/catalog";

export type ParsedQuery = {
  raw: string;
  quantity: number | null;
  category: Category | null;
  /** Category words the person typed when no catalog category matched. */
  categoryText: string;
  countryText: string; // "" when not stated
  countrySlug: string | null; // catalog country slug when recognised
  region: string; // state / city text, "" when not stated
};

const COUNTRY_ALIASES: Record<string, string> = {
  us: "us", usa: "us", "u.s.": "us", "u.s.a.": "us", america: "us", "united states": "us", "united states of america": "us",
};
// Words people use for a category, beyond its own name.
const CATEGORY_HINTS: Record<string, string[]> = {
  dentists: ["dentist", "dental", "orthodontist", "dental clinic"],
  restaurants: ["restaurant", "cafe", "café", "bar", "diner", "eatery"],
  "ski-shops": ["ski", "snowboard", "ski shop"],
};
const STOP = new Set(["i", "need", "want", "get", "find", "me", "a", "an", "the", "of", "list", "lists", "leads", "lead", "email", "emails", "contact", "contacts", "database", "for", "all", "with", "and", "businesses", "business", "verified", "my"]);

function parseQuantity(s: string): number | null {
  const m = s.match(/(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million)?\b/i);
  if (!m) return null;
  let n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const u = (m[2] ?? "").toLowerCase();
  if (u === "k" || u === "thousand") n *= 1_000;
  if (u === "m" || u === "million") n *= 1_000_000;
  n = Math.round(n);
  return n >= 1 && n <= 100_000_000 ? n : null;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s.,]/gu, " ").replace(/\s+/g, " ").trim();
const stem = (w: string) => (w.length > 3 ? w.replace(/(ies)$/, "y").replace(/s$/, "") : w);

export function parseQuery(raw: string): ParsedQuery {
  const q = norm(raw);
  const quantity = parseQuantity(q);
  let rest = q.replace(/(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million)?\b/i, " ").replace(/\s+/g, " ").trim();

  // Place: everything after the last " in " / " near " / " from ".
  let place = "";
  const pm = rest.match(/^(.*)\s(?:in|near|from|within)\s(.+)$/);
  if (pm) {
    rest = pm[1].trim();
    place = pm[2].trim().replace(/^the\s+/, ""); // "in the US" = "in US"
  }

  let countrySlug: string | null = null;
  let countryText = "";
  let region = "";
  if (place) {
    const parts = place.split(/\s*,\s*|\s+/).filter(Boolean);
    const whole = COUNTRY_ALIASES[place];
    if (whole) {
      countrySlug = whole;
      countryText = place;
    } else {
      // "denver us", "texas usa": trailing country word
      const last = parts[parts.length - 1];
      if (parts.length > 1 && COUNTRY_ALIASES[last]) {
        countrySlug = COUNTRY_ALIASES[last];
        countryText = last;
        region = parts.slice(0, -1).join(" ");
      } else {
        region = place;
      }
    }
  }
  // A catalog city implies its country.
  if (!countrySlug && region) {
    for (const c of getCountries()) {
      if (getCities(c.slug).some((city) => city.name.toLowerCase() === region)) countrySlug = c.slug;
    }
  }

  // Category: score words against names / hints.
  const words = rest.split(" ").filter((w) => w && !STOP.has(w)).map(stem);
  let best: { c: Category; score: number } | null = null;
  for (const c of getCategories()) {
    const keys = new Set([...c.name.toLowerCase().split(/\W+/), ...c.singular.toLowerCase().split(/\W+/), ...(CATEGORY_HINTS[c.slug] ?? []).flatMap((h) => h.split(" "))].filter(Boolean).map(stem));
    const score = words.filter((w) => keys.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { c, score };
  }
  const categoryText = rest.split(" ").filter((w) => w && !STOP.has(w)).join(" ");
  return { raw: raw.trim(), quantity, category: best?.c ?? null, categoryText, countryText, countrySlug, region };
}

export type SearchResult = {
  parsed: ParsedQuery;
  /** Products that match the category and the country (or no country was given). */
  exact: Product[];
  /** Same category, but the place could not be matched exactly. Shown separately, with a reason. */
  close: { product: Product; note: string }[];
};

export function searchCatalog(raw: string): SearchResult {
  const parsed = parseQuery(raw);
  const exact: Product[] = [];
  const close: SearchResult["close"] = [];
  if (!parsed.category) return { parsed, exact, close };
  const inCategory = getProducts(parsed.category.slug);
  const countryKnown = parsed.countrySlug !== null || !parsed.countryText;
  for (const p of inCategory) {
    const countryOk = !parsed.countrySlug || p.countrySlug === parsed.countrySlug;
    if (!countryOk || !countryKnown) continue;
    const cityOk = !parsed.region || getCities(p.countrySlug).some((c) => c.name.toLowerCase() === parsed.region);
    if (cityOk) exact.push(p);
    else close.push({ product: p, note: `This is the nationwide list. It is not filtered to ${titleCase(parsed.region)}.` });
  }
  return { parsed, exact, close };
}

export const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (m) => m.toUpperCase());

/** Query string for /custom-list, built from the original search. */
export function customListHref(raw: string): string {
  const p = parseQuery(raw);
  const u = new URLSearchParams();
  u.set("q", p.raw);
  if (p.category) u.set("category", p.category.slug);
  else if (p.categoryText) u.set("categoryText", p.categoryText);
  if (p.quantity) u.set("quantity", String(p.quantity));
  if (p.countryText || p.countrySlug) u.set("country", p.countrySlug ?? "other");
  if (p.region) u.set("region", titleCase(p.region));
  return `/custom-list?${u.toString()}`;
}
