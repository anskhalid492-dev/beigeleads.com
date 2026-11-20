import { getCategories, getProducts } from "@/lib/catalog";
import type { CatalogLite } from "./form";

/** The real catalog, reduced to what the promotion form needs. */
export const catalogLite = (): CatalogLite => ({
  products: getProducts().map((p) => ({ slug: p.slug, name: p.name, categorySlug: p.categorySlug, packages: p.packages.map((k) => ({ name: k.name, priceCents: k.priceUsdCents })) })),
  categories: getCategories().map((c) => ({ slug: c.slug, name: c.name })),
});
