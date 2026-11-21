import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { EVENTS, recordEvent } from "@/lib/beigepilot/proactive/store";

const body = z.object({ sid: z.string().regex(/^[a-f0-9]{16,32}$/), stage: z.union([z.literal(1), z.literal(2), z.literal(3)]), event: z.enum(EVENTS), template: z.string().max(40).regex(/^[a-z0-9-]*$/), page: z.string().max(20).regex(/^[a-z]*$/) });

/** Anonymous counters: a random session id, the stage and the event name. No address, no text, no account. Repeats are ignored by the database. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return new Response(null, { status: 400 });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-pro-event", who, 120, 3600)) return new Response(null, { status: 429 });
  await recordEvent(env, { sid: p.data.sid, stage: p.data.stage, event: p.data.event, template: p.data.template, page: p.data.page });
  return new Response(null, { status: 204 });
}
