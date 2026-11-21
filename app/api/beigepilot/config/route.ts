import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSettings, listProviders, type Humor, type Motion } from "@/lib/beigepilot/store";
import { getNeg } from "@/lib/beigepilot/v2/offers";
import { getPro } from "@/lib/beigepilot/proactive/store";

const KEY = "beigepilot:config:v5";
type Cfg = { enabled: boolean; greeting: string; saving: boolean; name: string; humor: Humor; motion: Motion; launcher: "right" | "left"; suggestions: string[]; sales: { finder: boolean; cart: boolean; budget: boolean; handoff: boolean }; proactive: { enabled: boolean; delays: number[]; bubbleSeconds: number; mobile: boolean; pages: Record<string, boolean>; cartMessages: boolean; exitIntent: boolean }; negotiation: boolean };

/** Public, cached 60 s. The widget shows only when it is switched on AND the active provider really has a key and a model. */
export async function GET() {
  const { env } = getCloudflareContext();
  let cfg: Cfg | null = null;
  try { cfg = await env.CACHE.get(KEY, "json"); } catch { /* go to D1 */ }
  if (!cfg) {
    const [{ s }, provs, pro, neg] = await Promise.all([getSettings(env), listProviders(env), getPro(env), getNeg(env)]);
    const p = provs.find((x) => x.id === s.active);
    cfg = { enabled: s.enabled && !!p?.hasKey && !!p.model, greeting: s.greeting, saving: s.saveChats, name: s.name, humor: s.humor, motion: s.motion, launcher: s.launcher, suggestions: s.suggestions, sales: { finder: s.sales.finder, cart: s.sales.cart, budget: s.sales.budget, handoff: s.sales.handoff }, proactive: { enabled: pro.enabled, delays: pro.delays, bubbleSeconds: pro.bubbleSeconds, mobile: pro.mobile, pages: pro.pages, cartMessages: pro.cartMessages, exitIntent: pro.exitIntent }, negotiation: neg.enabled };
    try { await env.CACHE.put(KEY, JSON.stringify(cfg), { expirationTtl: 60 }); } catch { /* optional */ }
  }
  return Response.json(cfg, { headers: { "cache-control": "public, max-age=30" } });
}
