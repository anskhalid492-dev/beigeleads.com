import { hydrateCatalog } from "@/lib/catalog-db";
import { sampleRowsOf } from "@/lib/catalog";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { bundleSlugsSchema, cartItemsSchema, normalizeBundleSlugs, normalizeItems, priceCart, suggestFor } from "@/lib/cart/model";
import { loadPublished } from "@/lib/bundles/store";
import { getDbFromEnv } from "@/lib/db";
import { DISCOUNT_REFUSED, resolveDiscount } from "@/lib/partners/discount";
import { isPartnerCode } from "@/lib/partners/types";
import { loadCandidates } from "@/lib/promos/store";
import { loadSalesSettings } from "@/lib/sales/settings";
import { loadEvSettings } from "@/lib/ev/settings";

const body = z.object({
  items: cartItemsSchema,
  bundles: bundleSlugsSchema.optional(),
  // Email Verification package NAME only; the server looks up its price and limit.
  verification: z.string().trim().max(40).optional(),
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
  await hydrateCatalog(env);
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
  const sales = await loadSalesSettings(env);
  const bundleSlugs = normalizeBundleSlugs(p.data.bundles ?? []);
  const bundleDefs = bundleSlugs.length ? await loadPublished(env) : [];
  const ev = await loadEvSettings(env);
  const pricing = priceCart(items, {
    verification: { pkg: p.data.verification || null, enabled: ev.enabled, packages: ev.packages.map((x) => ({ name: x.name, limit: x.limit, priceCents: x.priceCents })) },
    bundles: { slugs: bundleSlugs, defs: bundleDefs }, checkoutOpen: env.CHECKOUT_ENABLED === "true", allowPlaceholder: env.CHECKOUT_ALLOW_PLACEHOLDER === "true", discount, volume: sales.volume, rewardCombineVolume: sales.reward.combineVolume,
    promo: { candidates, enteredCode, nowSec: Math.floor(Date.now() / 1000), emailKnown: !!p.data.email },
  }, () => false);
  for (const l of pricing.lines) { const rs = sampleRowsOf(l.slug).slice(0, 3); l.hasSample = rs.length > 0; l.sample = rs.map((r) => ({ business: r.business, city: r.city || r.address, email: r.email, phone: r.phone })); }
  if (!discountError && enteredCode) discountError = pricing.codeError;
  const kept = new Set(pricing.lines.map((l) => l.slug));
  const inBundles = pricing.bundles.flatMap((b) => b.components.map((c) => ({ slug: c.slug, pkg: c.packageName })));
  const basis = [...items.filter((i) => kept.has(i.slug)), ...inBundles];
  // The optional upsell: shown by the cart only for carts with databases and no verification yet.
  const upsell = ev.enabled && ev.upsellEnabled ? { headline: ev.upsellHeadline, description: ev.upsellDescription, placement: ev.upsellPlacement, packages: ev.packages.map((x) => ({ name: x.name, limit: x.limit, priceCents: x.priceCents, featured: x.featured })) } : null;
  const evPackages = ev.enabled ? ev.packages.map((x) => ({ name: x.name, limit: x.limit, priceCents: x.priceCents, featured: x.featured })) : [];
  return json(200, { ok: true, pricing, discountError, upsell, evPackages, suggestions: suggestFor(basis, basis.length === 0 ? 4 : 3) });
}
