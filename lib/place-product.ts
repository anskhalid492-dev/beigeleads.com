// Country / state / city URLs reuse the single product page (owner decision, 20 Nov 2026): /lists/<category>/<country>[/<state>[/<city>]]
// renders the same template as /lists/<product-slug>. A place page is a VIEW of a real product: an exact product for that place when one
// exists, otherwise the country-level product of that category. Nothing is invented: no product = no product page (the geography page stays).
import { getProducts, type Product } from "@/lib/catalog";
import { slugify } from "@/lib/geo/rules";

export type PlaceProduct = { product: Product; exact: boolean; placeName: string | null };
const titleCase = (s: string) => s.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export function productForPlace(category: string, country: string, geo: string[] = []): PlaceProduct | null {
  const list = getProducts().filter((p) => p.categorySlug === category && p.countrySlug === country);
  if (!list.length) return null;
  const place = geo[geo.length - 1] ?? null;
  const exact = place ? list.find((p) => (p.region && slugify(p.region) === place) || p.citySlug === place) : undefined;
  if (exact) return { product: exact, exact: true, placeName: titleCase(place!) };
  const national = list.find((p) => p.scope !== "city" && !p.region);
  if (!national) return null;
  return { product: national, exact: !place, placeName: place ? titleCase(place) : null };
}
