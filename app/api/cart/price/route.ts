import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { cartItemsSchema, normalizeItems, priceCart, suggestFor } from "@/lib/cart/model";
import { productSamples } from "@/lib/sample-data";
import { getDbFromEnv } from "@/lib/db";
import { DISCOUNT_REFUSED, resolveDiscount } from "@/lib/partners/discount";
import { isPartnerCode } from "@/lib/partners/types";
import { loadCandidates } from "@/lib/promos/store";

const body = z.object({
  items: cartItemsSchema,
  // Optional partner code + the email it must belong to. Validated here; the browser never sets a price.
  code: z.string().trim().max(40).optional(),
  email: z.string().trim().toLowerCase().max(254).optional(),
});
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
  let discount: { code: string; percent: number } | undefined;
  let discountError = "";
  let enteredCode: string | undefined;
  const db = getDbFromEnv(env);
  if (p.data.code) {
    // Code attempts get their own, tighter limit so codes cannot be guessed.
    if (await isRateLimited(env.CACHE, "partner-code", who, 20, 3600)) return json(429, { ok: false, error: "Too many code attempts. Try again in an hour." });
    if (isPartnerCode(p.data.code)) {
      const r = p.data.email ? await resolveDiscount(db, p.data.code, p.data.email) : null;
      if (r?.ok) discount = r.discount; else discountError = r ? r.reason : DISCOUNT_REFUSED;
    } else enteredCode = p.data.code;
  }
  const candidates = await loadCandidates(db, p.data.email || undefined);
  const pricing = priceCart(items, {
    checkoutOpen: env.CHECKOUT_ENABLED === "true", allowPlaceholder: env.CHECKOUT_ALLOW_PLACEHOLDER === "true", discount,
    promo: { candidates, enteredCode, nowSec: Math.floor(Date.now() / 1000), emailKnown: !!p.data.email },
  }, (c) => (productSamples[c]?.length ?? 0) > 0);
  if (!discountError && enteredCode) discountError = pricing.codeError;
  const kept = new Set(pricing.lines.map((l) => l.slug));
  return json(200, { ok: true, pricing, discountError, suggestions: suggestFor(items.filter((i) => kept.has(i.slug)), items.length === 0 ? 4 : 3) });
}
