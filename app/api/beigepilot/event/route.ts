import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { isPiloEvent, piloEvent } from "@/lib/beigepilot/v2/events";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const body = z.object({ sid: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/), event: z.string().max(30), detail: z.string().max(30).optional(), page: z.string().max(20).optional() });
const ok = (status = 200) => new Response(JSON.stringify({ ok: status === 200 }), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Anonymous Pilo 2.0 analytics (same-origin, whitelisted event names, rate limited). No message text is ever accepted. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return ok(403);
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !isPiloEvent(p.data.event)) return ok(400);
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-event", who, 200, 3600)) return ok(429);
  await piloEvent(env, p.data.sid, p.data.event, p.data.detail ?? "", p.data.page ?? "");
  return ok();
}
