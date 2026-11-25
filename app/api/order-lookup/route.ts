import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { lookupInput, lookupOrder, resendDelivery } from "@/lib/orders/lookup";

const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/**
 * Order lookup. Needs the order number (a random id) AND the order email; a wrong pair gets the same generic answer as an unknown order.
 * Same-origin only, rate limited per visitor (12/hour). Never returns download links.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const p = lookupInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, { ok: false, error: p.error.issues[0]?.message ?? "Check the details and try again." });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "order-lookup", who, 12, 3600)) return json(429, { ok: false, error: "Too many tries. Please wait an hour or contact us." });
  const r = await lookupOrder(env, p.data);
  if (!r.ok) return json(200, { ok: false, error: "We could not find an order with that number and email. Check both, or contact us." });
  const resent = p.data.resend ? await resendDelivery(env, r.order) : undefined;
  return json(200, { ok: true, order: r.order, resent });
}
