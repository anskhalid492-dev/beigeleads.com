import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sampleRowsOf, getCategories, getCountries, getProducts } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { livePopups } from "@/lib/popups/store";

/** What the browser needs to run live campaigns. Small, public, cached. Empty while every campaign is a draft. */
export async function GET() {
  const campaigns = await livePopups(getCloudflareContext().env);
  if (!campaigns.length) return Response.json({ campaigns: [] }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  await hydrateCatalog();
  const products = getProducts().slice(0, 60); // popups need a few examples, not the whole catalog
  return Response.json({
    campaigns,
    catalog: {
      categories: getCategories().map((c) => ({ slug: c.slug, name: c.name })),
      countries: getCountries().map((c) => ({ slug: c.slug, name: c.name })),
      products: products.map((p) => ({ slug: p.slug, title: p.title, category: p.categorySlug, country: p.countrySlug })),
      // Real rows, already masked on save (own sample or the site-wide default).
      samples: Object.fromEntries(products.map((p) => [p.slug, sampleRowsOf(p.slug).slice(0, 3).map((r) => [r.business, r.city || r.address, r.email, r.phone])])),
    },
  }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
