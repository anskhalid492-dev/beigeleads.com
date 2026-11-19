import { and, eq, inArray, sql } from "drizzle-orm";
import { getCities, getCity, getCountry } from "@/lib/catalog";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";
import { parseImport, slugify, type ImportRow } from "./rules";

type Db = ReturnType<typeof getDbFromEnv>;
export type Area = { id: number; countrySlug: string; parentId: number | null; level: "region" | "city"; slug: string; name: string; indexable: boolean };
export type AreaView = { area: Area; parent: Area | null; children: Area[]; siblings: Area[] };

const toArea = (r: typeof schema.geoAreas.$inferSelect): Area => ({ id: r.id, countrySlug: r.countrySlug, parentId: r.parentId, level: r.level, slug: r.slug, name: r.name, indexable: r.indexable === 1 });

/** Never throws: before migration 0028 the geography is empty and only the built-in static cities exist. */
export async function listAreas(db: Db, countrySlug: string, parentId: number | null): Promise<Area[]> {
  try {
    const rows = await db.select().from(schema.geoAreas).where(and(eq(schema.geoAreas.countrySlug, countrySlug), eq(schema.geoAreas.parentKey, parentId ?? 0))).orderBy(schema.geoAreas.name);
    return rows.map(toArea);
  } catch { return []; }
}

/** Resolves /country/a or /country/a/b. One segment = a region or a city directly under the country; two = region then city. */
export async function resolveArea(db: Db, countrySlug: string, segments: string[]): Promise<AreaView | null> {
  if (segments.length < 1 || segments.length > 2) return null;
  try {
    const top = (await listAreas(db, countrySlug, null)).find((a) => a.slug === segments[0]);
    if (top) {
      if (segments.length === 1) return { area: top, parent: null, children: top.level === "region" ? await listAreas(db, countrySlug, top.id) : [], siblings: (await listAreas(db, countrySlug, null)).filter((a) => a.level === top.level && a.id !== top.id) };
      if (top.level !== "region") return null;
      const kids = await listAreas(db, countrySlug, top.id);
      const leaf = kids.find((a) => a.slug === segments[1]);
      return leaf ? { area: leaf, parent: top, children: [], siblings: kids.filter((a) => a.id !== leaf.id) } : null;
    }
  } catch { /* fall through to the static cities */ }
  // Built-in placeholder cities keep their old URLs working (no inventory, so the page is noindex).
  if (segments.length === 1) {
    const c = getCity(countrySlug, segments[0]);
    if (c) return { area: { id: -1, countrySlug, parentId: null, level: "city", slug: c.slug, name: c.name, indexable: false }, parent: null, children: [], siblings: getCities(countrySlug).filter((x) => x.slug !== c.slug).map((x, i) => ({ id: -2 - i, countrySlug, parentId: null, level: "city" as const, slug: x.slug, name: x.name, indexable: false })) };
  }
  return null;
}

/** Real inventory per place for one industry. Missing rows mean "no inventory", never zero by guess. */
export async function coverageFor(db: Db, categorySlug: string, areaIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  const ids = areaIds.filter((i) => i > 0);
  if (!ids.length) return out;
  try {
    for (let i = 0; i < ids.length; i += 90) {
      const rows = await db.select().from(schema.geoCoverage).where(and(eq(schema.geoCoverage.categorySlug, categorySlug), inArray(schema.geoCoverage.areaId, ids.slice(i, i + 90))));
      for (const r of rows) out.set(r.areaId, r.recordCount);
    }
  } catch { /* table missing */ }
  return out;
}

/** Total real records for an industry inside a region = its own row, or the sum of its cities when it has no row. */
export async function regionTotals(db: Db, categorySlug: string, regions: Area[]): Promise<Map<number, number>> {
  const own = await coverageFor(db, categorySlug, regions.map((r) => r.id));
  const out = new Map(own);
  try {
    for (const r of regions) {
      if (out.has(r.id)) continue;
      const [t] = await db.select({ n: sql<number>`coalesce(sum(${schema.geoCoverage.recordCount}),0)` }).from(schema.geoCoverage)
        .innerJoin(schema.geoAreas, eq(schema.geoAreas.id, schema.geoCoverage.areaId))
        .where(and(eq(schema.geoCoverage.categorySlug, categorySlug), eq(schema.geoAreas.parentId, r.id)));
      if (t && t.n > 0) out.set(r.id, Number(t.n));
    }
  } catch { /* table missing */ }
  return out;
}

export type ImportReport = { regions: number; cities: number; coverage: number };

/** Creates missing regions/cities and sets the real record count. Never deletes. Safe to run again. */
export async function importGeo(db: Db, countrySlug: string, rows: ImportRow[]): Promise<ImportReport> {
  const rep: ImportReport = { regions: 0, cities: 0, coverage: 0 };
  const regionIds = new Map<string, number>();
  const ensure = async (level: "region" | "city", name: string, parent: number | null): Promise<number> => {
    const slug = slugify(name);
    const key = `${parent ?? 0}/${slug}`;
    if (level === "region" && regionIds.has(key)) return regionIds.get(key)!;
    const [ex] = await db.select().from(schema.geoAreas).where(and(eq(schema.geoAreas.countrySlug, countrySlug), eq(schema.geoAreas.parentKey, parent ?? 0), eq(schema.geoAreas.slug, slug)));
    if (ex) { if (level === "region") regionIds.set(key, ex.id); return ex.id; }
    const [ins] = await db.insert(schema.geoAreas).values({ countrySlug, parentId: parent, parentKey: parent ?? 0, level, slug, name: name.slice(0, 80) }).returning({ id: schema.geoAreas.id });
    if (level === "region") { rep.regions++; regionIds.set(key, ins.id); } else rep.cities++;
    return ins.id;
  };
  for (const r of rows) {
    const regionId = r.region ? await ensure("region", r.region, null) : null;
    const areaId = r.city ? await ensure("city", r.city, regionId) : regionId!;
    await db.insert(schema.geoCoverage).values({ categorySlug: r.category, areaId, recordCount: r.records })
      .onConflictDoUpdate({ target: [schema.geoCoverage.categorySlug, schema.geoCoverage.areaId], set: { recordCount: r.records, updatedAt: sql`(unixepoch())` } });
    rep.coverage++;
  }
  return rep;
}

export { parseImport };

/** Every city of a country (any region), with its region. Capped so a huge import cannot make a page heavy. */
export async function listAllCities(db: Db, countrySlug: string, limit = 400): Promise<(Area & { regionSlug: string | null; regionName: string | null })[]> {
  try {
    const rows = await db.select().from(schema.geoAreas).where(and(eq(schema.geoAreas.countrySlug, countrySlug), eq(schema.geoAreas.level, "city"))).orderBy(schema.geoAreas.name).limit(limit);
    const regions = new Map((await listAreas(db, countrySlug, null)).filter((r) => r.level === "region").map((r) => [r.id, r]));
    return rows.map((r) => ({ ...toArea(r), regionSlug: r.parentId ? regions.get(r.parentId)?.slug ?? null : null, regionName: r.parentId ? regions.get(r.parentId)?.name ?? null : null }));
  } catch { return []; }
}

/** Industries that have real inventory in one place (for "other industries here"). */
export async function categoriesInArea(db: Db, areaId: number): Promise<{ category: string; records: number }[]> {
  if (areaId <= 0) return [];
  try { return (await db.select().from(schema.geoCoverage).where(eq(schema.geoCoverage.areaId, areaId))).filter((r) => r.recordCount > 0).map((r) => ({ category: r.categorySlug, records: r.recordCount })); } catch { return []; }
}

/** Admin overview: every area with its coverage rows. */
export async function allCoverage(db: Db) {
  try {
    const areas = await db.select().from(schema.geoAreas).orderBy(schema.geoAreas.countrySlug, schema.geoAreas.name).limit(2000);
    const cov = await db.select().from(schema.geoCoverage).limit(5000);
    return { ready: true as const, areas: areas.map(toArea), coverage: cov };
  } catch { return { ready: false as const, areas: [] as Area[], coverage: [] as (typeof schema.geoCoverage.$inferSelect)[] }; }
}

/** URL paths of place pages that have REAL inventory and are allowed to be indexed (for sitemap.xml). Never throws. */
export async function geoSitemapPaths(db: Db): Promise<string[]> {
  try {
    const areas = await db.select().from(schema.geoAreas).where(eq(schema.geoAreas.indexable, 1)).limit(5000);
    const byId = new Map(areas.map((a) => [a.id, a]));
    const cov = await db.select().from(schema.geoCoverage).limit(10000);
    const out = new Set<string>();
    for (const r of cov) {
      const a = byId.get(r.areaId);
      if (!a || r.recordCount <= 0) continue;
      const par = a.parentId ? byId.get(a.parentId) : null;
      if (a.parentId && !par) continue;
      if (!getCountry(a.countrySlug)) continue;
      out.add(`/lists/${r.categorySlug}/${a.countrySlug}/${par ? `${par.slug}/` : ""}${a.slug}`);
    }
    return [...out];
  } catch { return []; }
}
