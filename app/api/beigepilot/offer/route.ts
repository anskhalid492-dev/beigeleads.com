import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { validCid } from "@/lib/beigepilot/history";
import { piloEvent } from "@/lib/beigepilot/v2/events";
import { applyOffer } from "@/lib/beigepilot/v2/offers";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const body = z.object({ cid: z.string().trim().max(40), offerId: z.number().int().positive(), cart: z.array(z.object({ slug: z.string().trim().max(100), pkg: z.string().trim().max(40) })).max(10) });
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/**
 * "Apply My Discount". Re-validates the offer on the server (session, expiry, eligible lists, 20% ceiling, existing savings) and only then
 * returns the code. The browser then prices the cart through the normal cart API, so the number the buyer sees is the server's number.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || !validCid(p.data.cid)) return json(400, { ok: false, message: "Invalid request." });
  const { env, ctx } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-offer", who, 20, 3600)) return json(429, { ok: false, message: "Too many attempts. Please try again later." });
  const r = await applyOffer(env, { sid: p.data.cid, offerId: p.data.offerId, cart: p.data.cart });
  if (r.ok) ctx.waitUntil(piloEvent(env, p.data.cid, "offer_accepted", String(r.percent)));
  return json(r.ok ? 200 : 409, r);
}
