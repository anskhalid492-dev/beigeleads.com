import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCategories, getCountries, getProducts } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";
import { livePopups } from "@/lib/popups/store";

/** What the browser needs to run live campaigns. Small, public, cached. Empty while every campaign is a draft. */
export async function GET() {
  const campaigns = await livePopups(getCloudflareContext().env);
  if (!campaigns.length) return Response.json({ campaigns: [] }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  const products = getProducts();
  return Response.json({
    campaigns,
    catalog: {
      categories: getCategories().map((c) => ({ slug: c.slug, name: c.name })),
      countries: getCountries().map((c) => ({ slug: c.slug, name: c.name })),
      products: products.map((p) => ({ slug: p.slug, title: p.title, category: p.categorySlug, country: p.countrySlug })),
      // Masked, fictional rows only (lib/sample-data.ts). Never real contacts.
      samples: Object.fromEntries(products.map((p) => [p.slug, (productSamples[p.slug] ?? []).slice(0, 3).map((r) => [r.business, r.city, r.email, r.phone])])),
    },
  }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
