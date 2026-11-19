import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const body = z.object({ event: z.enum(["add_to_cart", "remove_from_cart", "view_cart", "begin_checkout"]), items: z.number().int().min(0).max(50) });

/** Anonymous cart funnel counters: event name and item count, nothing else. Same-origin only; rate limited per visitor (the address is never stored). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return new Response(null, { status: 400 });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "cart-event", who, 120, 3600)) return new Response(null, { status: 429 });
  try { await getDbFromEnv(env).insert(schema.cartEvents).values({ event: p.data.event, items: p.data.items }); } catch { /* table missing until migration 0027: ignore */ }
  return new Response(null, { status: 204 });
}
