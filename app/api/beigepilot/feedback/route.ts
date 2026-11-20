import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { saveFeedback, validCid } from "@/lib/beigepilot/history";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const body = z.object({ cid: z.string().max(40), idx: z.number().int().min(0).max(200), rating: z.union([z.literal(1), z.literal(-1)]) });
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** One-click thumbs up/down on an answer. Stores only a random chat id, the answer number, the rating and the day. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !validCid(p.data.cid)) return json(400, { ok: false });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-fb", who, 60, 3600)) return json(429, { ok: false });
  return json(200, { ok: await saveFeedback(env, p.data.cid, p.data.idx, p.data.rating) });
}
