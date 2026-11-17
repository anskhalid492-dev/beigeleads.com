import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/catalog";
import { solutions } from "@/lib/solutions";
import { comparisons } from "@/lib/compare-data";

// Only indexable pages. Country/city pages and stubs stay out until they carry real data.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/lists` },
    ...getCategories().map((c) => ({ url: `${SITE_URL}/lists/${c.slug}` })),
    { url: `${SITE_URL}/solutions` },
    ...solutions.map((s) => ({ url: `${SITE_URL}/solutions/${s.slug}` })),
    { url: `${SITE_URL}/compare` },
    ...comparisons.map((c) => ({ url: `${SITE_URL}/compare/beigeleads-vs-${c.slug}` })),
    ...getProducts().map((p) => ({ url: `${SITE_URL}/product/${p.slug}` })),
  ];
}
