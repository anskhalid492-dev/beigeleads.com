import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { cartItemsSchema, normalizeItems, priceCart, suggestFor } from "@/lib/cart/model";
import { productSamples } from "@/lib/sample-data";

const body = z.object({ items: cartItemsSchema });
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Server-side pricing of a cart. The browser sends product + package only; every name, size and price comes from the catalog here. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, { ok: false, error: "Invalid cart." });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "x";
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`);
  if (await isRateLimited(env.CACHE, "cart-price", who, 300, 3600)) return json(429, { ok: false, error: "Too many requests. Try again in a few minutes." });
  const items = normalizeItems(p.data.items);
  const pricing = priceCart(items, { checkoutOpen: env.CHECKOUT_ENABLED === "true", allowPlaceholder: env.CHECKOUT_ALLOW_PLACEHOLDER === "true" }, (c) => (productSamples[c]?.length ?? 0) > 0);
  const kept = new Set(pricing.lines.map((l) => l.slug));
  return json(200, { ok: true, pricing, suggestions: suggestFor(items.filter((i) => kept.has(i.slug))) });
}
