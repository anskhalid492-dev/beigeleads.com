import { hydrateCatalog } from "@/lib/catalog-db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getProduct } from "@/lib/catalog";
import { bannerFor, getPublicPromos, type PlaceName } from "@/lib/promos/public";

const PLACES = new Set(["home", "lists", "product", "cart"]);

/** Public, CDN-cacheable: the one promotion banner for a place, only while that promotion is really live. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const place = u.searchParams.get("place") ?? "";
  const slug = u.searchParams.get("slug") ?? "";
  const headers = { "content-type": "application/json", "cache-control": "public, max-age=30, s-maxage=60" };
  if (!PLACES.has(place)) return new Response(JSON.stringify({ banner: null }), { status: 400, headers });
  const p = place === "product" ? getProduct(slug) : undefined;
  const { env } = getCloudflareContext();
  await hydrateCatalog(env);
  const banner = bannerFor(await getPublicPromos(env), place as PlaceName, p ? { slug: p.slug, categorySlug: p.categorySlug } : undefined);
  return new Response(JSON.stringify({ banner }), { headers });
}
