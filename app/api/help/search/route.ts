import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { recordSearch } from "@/lib/help/analytics";

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const schema = z.object({ q: z.string().max(200), results: z.number().int().min(0).max(1000) });

/** Anonymous search tracking: stores the words and the match count only. Same-origin, validated, rate limited. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { ok: false });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.CACHE, "help-search", await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`), 60, 3600)) return json(429, { ok: false });
  try { await recordSearch(env, parsed.data.q, parsed.data.results); } catch { /* analytics must never break the page */ }
  return json(200, { ok: true });
}
