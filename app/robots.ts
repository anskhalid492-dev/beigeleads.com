import type { MetadataRoute } from "next";

// TEMPORARY: block all crawlers while the site holds placeholder content.
// At launch: allow "/" and disallow only /admin, /checkout, /download, /api. Add the sitemap URL.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
