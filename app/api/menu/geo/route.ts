import { loadListsData } from "@/lib/lists-data";

/** Compact place tree for the Lists menu: only places with real recorded inventory, capped so the menu never loads hundreds of rows. */
export async function GET() {
  try {
    const { tree } = await loadListsData();
    const out = tree.slice(0, 12).map((c) => ({
      slug: c.slug, name: c.name, code: c.code,
      regions: c.regions.slice(0, 60).map((r) => ({ slug: r.slug, name: r.name, cat: r.cats[0] ?? "" })),
      cities: c.cities.slice(0, 120).map((x) => ({ slug: x.slug, name: x.name, region: x.regionSlug, cat: x.cats[0] ?? "" })),
    }));
    return Response.json({ countries: out }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
  } catch {
    return Response.json({ countries: [] }, { headers: { "cache-control": "public, max-age=30" } });
  }
}
