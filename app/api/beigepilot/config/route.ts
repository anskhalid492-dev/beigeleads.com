import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSettings } from "@/lib/beigepilot/store";

const KEY = "beigepilot:config:v1";

/** Public, cached 60 s. The widget shows only when this says enabled AND a provider is active. */
export async function GET() {
  const { env } = getCloudflareContext();
  let cfg: { enabled: boolean; greeting: string; saving: boolean } | null = null;
  try { cfg = await env.CACHE.get(KEY, "json"); } catch { /* go to D1 */ }
  if (!cfg) {
    const { s } = await getSettings(env);
    cfg = { enabled: s.enabled && !!s.active, greeting: s.greeting, saving: s.saveChats };
    try { await env.CACHE.put(KEY, JSON.stringify(cfg), { expirationTtl: 60 }); } catch { /* optional */ }
  }
  return Response.json(cfg, { headers: { "cache-control": "public, max-age=30" } });
}
