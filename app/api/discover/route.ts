import { getCategory, getCountry, getProducts } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { discover, suggest } from "@/lib/discover";

/** Public, cacheable search over every product on the site. GET ?q=...  (&suggest=1 for type-ahead). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 160);
  await hydrateCatalog();
  const products = getProducts();
  const names = { cat: (s: string) => getCategory(s)?.name ?? s, country: (s: string) => getCountry(s)?.name ?? s };
  const body = u.searchParams.get("suggest") ? { suggestions: suggest(products, q, names) } : discover(products, q, names);
  return Response.json(body, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
}
