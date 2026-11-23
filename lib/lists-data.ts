// Server side: builds the serialisable catalog data for /lists from the real catalog + geography tables.
import { getCategories, getCategory, getCountry, getProducts, startingPriceCents } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { loadCountries, loadSubindustries } from "@/lib/catalog-extra";
import { getDb } from "@/lib/db";
import { allCoverage } from "@/lib/geo/store";
import { US_STATES } from "@/lib/us-states";
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
    return { slug: p.slug, name: p.name, title: p.title, categorySlug: p.categorySlug, ...(p.extraCategories?.length ? { extraCats: [...p.extraCategories] } : {}), categoryName: catName.get(p.categorySlug) ?? getCategory(p.categorySlug)?.name ?? p.categorySlug, countrySlug: p.countrySlug, countryName: k?.name ?? p.countrySlug, countryCode: k?.code ?? "", fields: [...p.fields], status: p.status, scope: p.scope ?? "country", citySlug: p.citySlug ?? null, channel: p.channel ?? "", region: p.region ?? "", description: p.imported ? p.description.slice(0, 160) : p.description, recordCount: real ? p.recordCount : null, fromCents: real ? from : null };
  });

  // Geography with REAL inventory only (count above zero, place allowed to be shown).
  const g = await allCoverage(db);
  const byId = new Map(g.areas.map((a) => [a.id, a]));
  const treeCountries = [...countries.map((c) => ({ slug: c.slug, name: c.name, code: c.code }))];
  for (const p of products) if (!treeCountries.some((c) => c.slug === p.countrySlug)) treeCountries.push({ slug: p.countrySlug, name: p.countryName, code: p.countryCode });
  const tree: GeoTree = treeCountries.map((c) => ({ slug: c.slug, name: c.name, code: c.code, regions: [], cities: [] }));
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
  // Every US state is selectable; a state view shows the national lists, so it carries every category that has a US product.
  const us = tree.find((c) => c.slug === "united-states");
  if (us) {
    const usCats = [...new Set(products.filter((p) => p.countrySlug === "united-states" && p.scope !== "city" && !p.region).map((p) => p.categorySlug))];
    for (const st of US_STATES) {
      const r = us.regions.find((x) => x.slug === st.slug) ?? (us.regions.push({ slug: st.slug, name: st.name, cats: [] }), us.regions[us.regions.length - 1]);
      for (const k of usCats) touch(r.cats, k);
    }
  }
  for (const c of tree) { c.regions.sort((a, b) => a.name.localeCompare(b.name)); c.cities.sort((a, b) => a.name.localeCompare(b.name)); }

  // Imported industries and countries (section 91): only those that have at least one published product.
  const extraInd = new Map<string, { slug: string; name: string; blurb: string; hints: string[] }>();
  const extraCty = new Map<string, { slug: string; name: string; code: string }>();
  for (const p of products) {
    if (!cats.some((c) => c.slug === p.categorySlug) && !extraInd.has(p.categorySlug)) extraInd.set(p.categorySlug, { slug: p.categorySlug, name: p.categoryName, blurb: p.categoryName, hints: [p.categoryName] });
    for (const x of p.extraCats ?? []) { const k = getCategory(x); if (k && !cats.some((c) => c.slug === x) && !extraInd.has(x)) extraInd.set(x, { slug: x, name: k.name, blurb: k.name, hints: [k.name] }); }
    if (!countries.some((c) => c.slug === p.countrySlug) && !extraCty.has(p.countrySlug)) extraCty.set(p.countrySlug, { slug: p.countrySlug, name: p.countryName, code: p.countryCode });
  }
  const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
  const subs = await loadSubindustries(db);
  return {
    products, tree,
    industries: [...cats.filter((c) => products.some((p) => p.categorySlug === c.slug || p.extraCats?.includes(c.slug))).map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, hints: [...(HINTS[c.slug] ?? []), c.singular] })), ...[...extraInd.values()].sort(byName)],
    countries: [...countries.map((c) => ({ slug: c.slug, name: c.name, code: c.code })), ...[...extraCty.values()].sort(byName)],
    niches: subs.rows.map((s) => ({ category: s.categorySlug, categoryName: catName.get(s.categorySlug) ?? "", name: s.name })),
  };
}
