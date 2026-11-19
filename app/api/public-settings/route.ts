import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublicSettings } from "@/lib/settings/service";

/** Public, non-sensitive settings (banner, site name). Edge-cacheable so public pages never wait on the database. */
export async function GET() {
  try {
    const s = await getPublicSettings(getCloudflareContext().env);
    return Response.json(s, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json({ siteName: "BeigeLeads", banner: null }, { headers: { "cache-control": "public, max-age=30" } });
  }
}
