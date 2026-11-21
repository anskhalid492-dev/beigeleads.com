// Build Your Own Bundle: which lists can be picked and how they are searched. Pure over the catalog (the caller passes the settings).
// Only lists that are really on sale (live, no placeholder figures) with at least one package are offered. No totals are returned.
import { getCategory, getCountry, getProducts, offeredPackages, type Product } from "@/lib/catalog";
import { isRealProduct } from "@/lib/cart/model";
import { discover } from "@/lib/discover";
import type { BuilderSettings } from "./settings";

export type BuilderProduct = {
  slug: string; name: string; categorySlug: string; categoryName: string; countryCode: string; coverage: string;
  packages: { name: string; records: number; priceCents: number }[];
};
export const PAGE_SIZE = 12;

export function eligible(s: BuilderSettings, allowPlaceholder = false): Product[] {
  const ex = new Set(s.excluded);
  return getProducts().filter((p) => !ex.has(p.slug) && (isRealProduct(p) || allowPlaceholder) && offeredPackages(p).length > 0);
}

const view = (p: Product): BuilderProduct => {
  const k = getCountry(p.countrySlug);
  return {
    slug: p.slug, name: p.name, categorySlug: p.categorySlug, categoryName: getCategory(p.categorySlug)?.name ?? "", countryCode: k?.code ?? "", coverage: k?.name ?? "",
    packages: offeredPackages(p).map((x) => ({ name: x.name, records: x.records, priceCents: x.priceUsdCents })),
  };
};

export function searchBuilder(s: BuilderSettings, q: { q?: string; country?: string; category?: string; offset?: number }, allowPlaceholder = false): { items: BuilderProduct[]; hasMore: boolean } {
  let list = eligible(s, allowPlaceholder);
  const text = (q.q ?? "").trim();
  if (text) {
    const names = { cat: (x: string) => getCategory(x)?.name ?? x, country: (x: string) => getCountry(x)?.name ?? x };
    const d = discover(list, text, names, 400);
    const keep = new Set([...d.exact, ...d.close].map((x) => x.slug));
    list = list.filter((p) => keep.has(p.slug));
    const rank = new Map([...d.exact, ...d.close].map((x, i) => [x.slug, i]));
    list.sort((a, b) => (rank.get(a.slug) ?? 0) - (rank.get(b.slug) ?? 0));
  } else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (q.country) list = list.filter((p) => p.countrySlug === q.country);
  if (q.category) list = list.filter((p) => p.categorySlug === q.category);
  const off = Math.max(0, Math.min(5000, q.offset ?? 0));
  return { items: list.slice(off, off + PAGE_SIZE).map(view), hasMore: list.length > off + PAGE_SIZE };
}

/** Countries and industries that have at least one pickable list (for the two filters). */
export function facets(s: BuilderSettings, allowPlaceholder = false) {
  const list = eligible(s, allowPlaceholder);
  const countries = new Map<string, string>(); const cats = new Map<string, string>();
  for (const p of list) { countries.set(p.countrySlug, getCountry(p.countrySlug)?.name ?? p.countrySlug); cats.set(p.categorySlug, getCategory(p.categorySlug)?.name ?? p.categorySlug); }
  const sorted = (m: Map<string, string>) => [...m].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  return { countries: sorted(countries), categories: sorted(cats) };
}
