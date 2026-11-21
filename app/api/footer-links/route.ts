import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fallbackFooter, getFooterConfig } from "@/lib/site-links/store";

/** Public footer data: enabled social links and AI shortcuts only. Edge-cacheable. */
export async function GET() {
  try {
    return Response.json(await getFooterConfig(getCloudflareContext().env), { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json(fallbackFooter(), { headers: { "cache-control": "public, max-age=30" } });
  }
}
