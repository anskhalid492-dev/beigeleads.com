import { getCategories, getCategory, getCountry, getProductFor } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { geoCopy } from "./content";
import { getGeoContent } from "./page-content";
import { isIndexable } from "./rules";
import { categoriesInArea, coverageFor, listAllCities, listAreas, regionTotals, resolveArea } from "./store";

export type GeoLink = { name: string; href: string; records: number | null };

/** Everything a geography page needs, from real data. Returns null when the URL is not a real place. */
export async function loadGeoPage(categorySlug: string, countrySlug: string, segments: string[]) {
  const c = getCategory(categorySlug);
  const k = getCountry(countrySlug);
  if (!c || !k) return null;
  const db = getDb();
  const base = `/lists/${c.slug}/${k.slug}`;
  const product = getProductFor(c.slug, k.slug);
  const view = segments.length ? await resolveArea(db, k.slug, segments) : null;
  if (segments.length && !view) return null;

  const path = view ? [base, view.parent?.slug, view.area.slug].filter(Boolean).join("/") : base;
  const href = (a: { slug: string }, parent?: { slug: string } | null) => `${base}${parent ? `/${parent.slug}` : ""}/${a.slug}`;

  let records: number | null = null;
  let children: GeoLink[] = [];
  let siblings: GeoLink[] = [];
  let regions: GeoLink[] = [];
  let cities: GeoLink[] = [];
  let otherCategories: { slug: string; name: string; records: number }[] = [];

  if (view) {
    const cov = await coverageFor(db, c.slug, [view.area.id, ...view.children.map((x) => x.id), ...view.siblings.map((x) => x.id)]);
    records = cov.get(view.area.id) ?? null;
    if (view.area.level === "region" && records === null) {
      const t = await regionTotals(db, c.slug, [view.area]);
      records = t.get(view.area.id) ?? null;
    }
    children = view.children.map((x) => ({ name: x.name, href: href(x, view.area), records: cov.get(x.id) ?? null }));
    siblings = view.siblings.map((x) => ({ name: x.name, href: href(x, view.parent), records: cov.get(x.id) ?? null }));
    const here = await categoriesInArea(db, view.area.id);
    otherCategories = here.filter((r) => r.category !== c.slug).flatMap((r) => { const oc = getCategory(r.category); return oc ? [{ slug: oc.slug, name: oc.name, records: r.records }] : []; });
  } else {
    const top = await listAreas(db, k.slug, null);
    const reg = top.filter((a) => a.level === "region");
    const tot = await regionTotals(db, c.slug, reg);
    regions = reg.map((a) => ({ name: a.name, href: href(a), records: tot.get(a.id) ?? null }));
    const all = await listAllCities(db, k.slug);
    const cov = await coverageFor(db, c.slug, all.map((a) => a.id));
    cities = all.map((a) => ({ name: a.name, href: href(a, a.regionSlug ? { slug: a.regionSlug } : null), records: cov.get(a.id) ?? null }));
    otherCategories = getCategories().filter((x) => x.slug !== c.slug && getProductFor(x.slug, k.slug)).map((x) => ({ slug: x.slug, name: x.name, records: 0 }));
    // Country total = sum of region totals and region-less cities (real data only).
    const sum = [...tot.values()].reduce((s, v) => s + v, 0) + all.filter((a) => !a.regionSlug).reduce((s, a) => s + (cov.get(a.id) ?? 0), 0);
    records = sum > 0 ? sum : null;
  }

  const kids = (view ? children : [...regions, ...cities]).filter((x) => (x.records ?? 0) > 0).map((x) => ({ name: x.name, records: x.records! })).sort((a, b) => b.records - a.records);
  const gen = geoCopy({ category: c, country: k, place: view ? { name: view.area.name, level: view.area.level, parentName: view.parent?.name } : null, product, records, children: kids });
  // Owner-written copy (admin) replaces the generated title, description and intro when it exists.
  const custom = await getGeoContent(db, path);
  const copy = { ...gen, title: custom.seoTitle || gen.title, description: custom.metaDescription || gen.description, intro: custom.intro || gen.intro };
  // The country page is indexable when the country has a real product or real place inventory; places need their own real inventory.
  const indexable = view ? isIndexable({ coverageCount: records, areaIndexable: view.area.indexable }) : isIndexable({ coverageCount: records ?? (product && !product.placeholderData ? product.recordCount : null), areaIndexable: true });
  const crumbs = [{ name: "Lists", href: "/lists" }, { name: c.name, href: `/lists/${c.slug}` }, { name: k.name, href: base }, ...(view?.parent ? [{ name: view.parent.name, href: `${base}/${view.parent.slug}` }] : []), ...(view ? [{ name: view.area.name, href: path }] : [])];
  return { c, k, product, view, base, path, records, children, siblings, regions, cities, otherCategories, copy, indexable, crumbs };
}
export type GeoPageData = NonNullable<Awaited<ReturnType<typeof loadGeoPage>>>;
