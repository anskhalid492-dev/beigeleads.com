import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/catalog";

// Only indexable pages. Country/city pages and stubs stay out until they carry real data.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/lists` },
    ...getCategories().map((c) => ({ url: `${SITE_URL}/lists/${c.slug}` })),
    ...getProducts().map((p) => ({ url: `${SITE_URL}/product/${p.slug}` })),
  ];
}
