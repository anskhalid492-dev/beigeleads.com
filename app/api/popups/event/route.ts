import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { recordEvent } from "@/lib/popups/store";

const body = z.object({ id: z.string().max(60), event: z.string().max(20), page: z.string().max(20).optional() });

/** Anonymous popup counters. Same-origin only, rate limited per visitor address (the address itself is never stored). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return new Response(null, { status: 400 });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  const key = `popup-ev:${ip}:${Math.floor(Date.now() / 3600_000)}`;
  const n = Number((await env.CACHE.get(key).catch(() => null)) ?? 0);
  if (n >= 120) return new Response(null, { status: 429 });
  await env.CACHE.put(key, String(n + 1), { expirationTtl: 3700 }).catch(() => undefined);
  try { await recordEvent(env, p.data.id, p.data.event, p.data.page ?? ""); } catch { /* table missing: ignore */ }
  return new Response(null, { status: 204 });
}
