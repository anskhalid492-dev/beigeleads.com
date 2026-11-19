import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { recordView } from "@/lib/help/analytics";
import { loadHelp } from "@/lib/help/store";
import { articleId } from "@/lib/help/data";

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const schema = z.object({ article: z.string().max(120) });

/** Counts one anonymous view of a published article (per day). Only articles that exist are counted. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { ok: false });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.CACHE, "help-view", await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`), 120, 3600)) return json(429, { ok: false });
  try {
    const data = await loadHelp(env);
    if (!data.articles.some((a) => articleId(a) === parsed.data.article)) return json(404, { ok: false });
    await recordView(env, parsed.data.article);
  } catch { /* analytics must never break the page */ }
  return json(200, { ok: true });
}
