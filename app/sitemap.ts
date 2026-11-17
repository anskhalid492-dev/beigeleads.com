import type { MetadataRoute } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { publishedSitemap } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/catalog";
import { solutions } from "@/lib/solutions";
import { articleHref, helpArticles, helpCategories } from "@/lib/help";
import { comparisons } from "@/lib/compare-data";

export const dynamic = "force-dynamic"; // blog articles come from D1 at request time

// Only indexable pages. Country/city pages and stubs stay out until they carry real data.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Published, indexable blog articles (read from D1). If the blog tables are missing, the rest of the sitemap still works.
  let blog: MetadataRoute.Sitemap = [];
  try { blog = (await publishedSitemap(getCloudflareContext().env)).filter((p) => !p.noindex).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt })); } catch { /* blog not set up yet */ }
  return [
    { url: `${SITE_URL}/blog` },
    ...blog,
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/lists` },
    ...getCategories().map((c) => ({ url: `${SITE_URL}/lists/${c.slug}` })),
    { url: `${SITE_URL}/solutions` },
    ...solutions.map((s) => ({ url: `${SITE_URL}/solutions/${s.slug}` })),
    { url: `${SITE_URL}/compare` },
    ...comparisons.map((c) => ({ url: `${SITE_URL}/compare/beigeleads-vs-${c.slug}` })),
    { url: `${SITE_URL}/faq` },
    ...helpCategories.map((c) => ({ url: `${SITE_URL}/help/${c.slug}` })),
    ...helpArticles.map((a) => ({ url: `${SITE_URL}${articleHref(a)}` })),
    ...getProducts().map((p) => ({ url: `${SITE_URL}/product/${p.slug}` })),
  ];
}
