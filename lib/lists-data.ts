// Server side: builds the serialisable catalog data for /lists from the real catalog + geography tables.
import { getCategories, getCategory, getCountry, getProducts, startingPriceCents } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { loadCountries, loadSubindustries } from "@/lib/catalog-extra";
import { getDb } from "@/lib/db";
import { allCoverage } from "@/lib/geo/store";
import type { GeoTree, ShopData } from "@/lib/shop";

const HINTS: Record<string, string[]> = { dentists: ["dentist", "dental", "orthodontist"], restaurants: ["restaurant", "cafe", "bar", "diner"], "ski-shops": ["ski", "snowboard"] };

export async function loadListsData(): Promise<ShopData & { niches: { category: string; categoryName: string; name: string }[] }> {
  await hydrateCatalog(); // published imported products (section 91)
  const db = getDb();
  const countries = await loadCountries(db);
  const cats = getCategories();
  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  const cname = new Map(countries.map((c) => [c.slug, c]));
  const products = getProducts().map((p) => {
    const k = cname.get(p.countrySlug) ?? getCountry(p.countrySlug);
    const from = startingPriceCents(p);
    const real = !p.placeholderData; // placeholder counts and prices never reach the browser
    return { slug: p.slug, name: p.name, title: p.title, categorySlug: p.categorySlug, categoryName: catName.get(p.categorySlug) ?? getCategory(p.categorySlug)?.name ?? p.categorySlug, countrySlug: p.countrySlug, countryName: k?.name ?? p.countrySlug, countryCode: k?.code ?? "", fields: [...p.fields], status: p.status, scope: p.scope ?? "country", citySlug: p.citySlug ?? null, description: p.imported ? p.description.slice(0, 160) : p.description, recordCount: real ? p.recordCount : null, fromCents: real ? from : null };
  });

  // Geography with REAL inventory only (count above zero, place allowed to be shown).
  const g = await allCoverage(db);
  const byId = new Map(g.areas.map((a) => [a.id, a]));
  const tree: GeoTree = countries.map((c) => ({ slug: c.slug, name: c.name, code: c.code, regions: [], cities: [] }));
  const touch = (arr: string[], cat: string) => { if (!arr.includes(cat)) arr.push(cat); };
  for (const cv of g.coverage) {
    const a = byId.get(cv.areaId);
    if (!a || cv.recordCount <= 0 || !a.indexable) continue;
    const country = tree.find((c) => c.slug === a.countrySlug);
    if (!country) continue;
    const par = a.parentId ? byId.get(a.parentId) : null;
    if (a.parentId && !par) continue;
    const ensureRegion = (r: { slug: string; name: string }) => country.regions.find((x) => x.slug === r.slug) ?? (country.regions.push({ slug: r.slug, name: r.name, cats: [] }), country.regions[country.regions.length - 1]);
    if (a.level === "region") touch(ensureRegion(a).cats, cv.categorySlug);
    else {
      if (par) touch(ensureRegion(par).cats, cv.categorySlug);
      let city = country.cities.find((x) => x.slug === a.slug && x.regionSlug === (par?.slug ?? null));
      if (!city) { city = { slug: a.slug, name: a.name, regionSlug: par?.slug ?? null, cats: [] }; country.cities.push(city); }
      touch(city.cats, cv.categorySlug);
    }
  }
  for (const c of tree) { c.regions.sort((a, b) => a.name.localeCompare(b.name)); c.cities.sort((a, b) => a.name.localeCompare(b.name)); }

  const subs = await loadSubindustries(db);
  return {
    products, tree,
    industries: cats.map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, hints: [...(HINTS[c.slug] ?? []), c.singular] })),
    countries: countries.map((c) => ({ slug: c.slug, name: c.name, code: c.code })),
    niches: subs.rows.map((s) => ({ category: s.categorySlug, categoryName: catName.get(s.categorySlug) ?? "", name: s.name })),
  };
}
