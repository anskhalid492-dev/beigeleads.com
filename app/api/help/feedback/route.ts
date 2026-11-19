import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { feedbackSchema, recordFeedback } from "@/lib/help/feedback";

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** Anonymous helpful / not helpful vote. Same-origin only, validated, rate limited per visitor (hash kept only in KV for an hour). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { ok: false });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const ipHash = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`);
  if (await isRateLimited(env.CACHE, "help-feedback", ipHash, 30, 3600)) return json(429, { ok: false });
  try {
    await recordFeedback(env, parsed.data.article, parsed.data.helpful);
    return json(200, { ok: true });
  } catch {
    return json(400, { ok: false });
  }
}
