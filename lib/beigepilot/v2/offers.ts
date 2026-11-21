// Negotiation offers: server-side issue / apply / settings / analytics (CLAUDE.md section 122). Never throws before migration 0047.
// An offer is an ordinary row in `promotions` (origin "negotiation": 1 use, expiry, eligible lists only, non-combinable) plus an audit row in `pilo_offers`.
import { and, eq, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getProduct } from "@/lib/catalog";
import { priceCart, normalizeItems, type CartItem } from "@/lib/cart/model";
import { loadCandidates } from "@/lib/promos/store";
import { loadSalesSettings } from "@/lib/sales/settings";
import { volumeInfo, NEGOTIATION_MAX_PERCENT } from "@/lib/promos/engine";
import { DEFAULT_NEG, decide, detectDiscountAsk, parseNeg, type NegPolicy } from "./negotiate";

type Env = CloudflareEnv;
const KEY = "beigepilot:neg:v1";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeOfferCode = () => `PILO-${[...crypto.getRandomValues(new Uint8Array(10))].map((x) => ALPHABET[x % 32]).join("")}`;

export async function getNeg(env: Env): Promise<NegPolicy> {
  try { const hit = await env.CACHE.get(KEY); if (hit) return parseNeg(hit); } catch { /* D1 */ }
  let raw = "";
  try { raw = (await env.DB.prepare("SELECT value FROM beigepilot_settings WHERE key = 'negotiation'").first<{ value: string }>())?.value ?? ""; } catch { return DEFAULT_NEG; }
  const p = parseNeg(raw);
  try { await env.CACHE.put(KEY, JSON.stringify(p), { expirationTtl: 60 }); } catch { /* optional */ }
  return p;
}
export async function saveNeg(env: Env, p: NegPolicy): Promise<void> {
  await env.DB.prepare("INSERT INTO beigepilot_settings (key, value, updated_at) VALUES ('negotiation', ?1, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = ?1, updated_at = unixepoch()").bind(JSON.stringify(p)).run();
  for (const k of [KEY, "beigepilot:config:v5"]) try { await env.CACHE.delete(k); } catch { /* optional */ }
}

export type OfferResult =
  | { ok: true; offerId: number; percent: number; capped: boolean; expiresAt: number; savingCents: number; eligible: string[]; excluded: string[] }
  | { ok: false; reason: keyof typeof import("./negotiate").OFFER_REFUSAL | "kept-volume"; message?: string; keptPercent?: number };

const now = () => Math.floor(Date.now() / 1000);

/** Prices a cart with an optional code, the way the cart route does (no email, no bundles, no verification: those are never discountable here). */
async function priceWith(env: Env, items: CartItem[], code?: string) {
  const db = getDbFromEnv(env);
  const [candidates, sales] = await Promise.all([loadCandidates(db), loadSalesSettings(env)]);
  return priceCart(items, { checkoutOpen: env.CHECKOUT_ENABLED === "true", allowPlaceholder: env.CHECKOUT_ALLOW_PLACEHOLDER === "true", volume: sales.volume, rewardCombineVolume: sales.reward.combineVolume, promo: { candidates, enteredCode: code, nowSec: now(), emailKnown: false } });
}

export async function issueOffer(env: Env, a: { sid: string; ipHash: string; cart: unknown; lastUserText: string }): Promise<OfferResult> {
  try {
    const policy = await getNeg(env);
    if (!policy.enabled) return { ok: false, reason: "disabled" };
    const ask = detectDiscountAsk(a.lastUserText);
    if (!ask.ask) return { ok: false, reason: "no-ask" };
    await hydrateCatalog(env);
    const items = normalizeItems(a.cart);
    if (items.length === 0) return { ok: false, reason: "empty-cart" };
    const db = getDbFromEnv(env);
    // Abuse limits: per chat session and per connection per day (a restarted chat does not reset the second one).
    const [mine] = await db.select({ n: sql<number>`count(*)`, best: sql<number>`coalesce(max(${schema.piloOffers.percent}), 0)` }).from(schema.piloOffers).where(eq(schema.piloOffers.sessionId, a.sid));
    if (Number(mine?.n ?? 0) >= policy.maxPerSession) return { ok: false, reason: "limit" };
    const [ip] = await db.select({ n: sql<number>`count(*)` }).from(schema.piloOffers).where(and(eq(schema.piloOffers.ipHash, a.ipHash), sql`${schema.piloOffers.createdAt} > ${now() - 86400}`));
    if (Number(ip?.n ?? 0) >= policy.maxPerIpDay) return { ok: false, reason: "busy" };

    const plain = await priceWith(env, items);
    const excluded: string[] = []; const eligible: typeof plain.lines = [];
    for (const l of plain.lines) {
      const p = getProduct(l.slug);
      const okCat = policy.eligibleCategories.length === 0 || policy.eligibleCategories.includes(l.categorySlug);
      if (!l.purchasable || !p || policy.excludedProducts.includes(l.slug) || policy.excludedCategories.includes(l.categorySlug) || !okCat) excluded.push(l.name); else eligible.push(l);
    }
    if (eligible.length === 0) return { ok: false, reason: "ineligible" };
    const base = eligible.reduce((n, l) => n + l.priceCents, 0);
    if (base < policy.minCartCents) return { ok: false, reason: "below" };

    // Never stacks: the offer must beat what Buy More, Save More already gives on the same lists.
    const best = Number(mine?.best ?? 0);
    const d = decide(policy, best, ask.requested);
    if (d.percent <= 0 || (best >= d.percent && d.exhausted)) return { ok: false, reason: "exhausted" };
    const percent = Math.min(d.percent, policy.maxPercent, NEGOTIATION_MAX_PERCENT);
    let offerCents = Math.round((base * percent) / 100);
    if (policy.maxSavingCents !== null) offerCents = Math.min(offerCents, policy.maxSavingCents);
    const sales = await loadSalesSettings(env);
    const vi = volumeInfo(eligible.map((l) => ({ slug: l.slug, categorySlug: l.categorySlug, packageName: l.packageName, priceCents: l.priceCents })), sales.volume);
    const volCents = Math.round((base * vi.percent) / 100);
    if (vi.percent > 0 && volCents >= offerCents) return { ok: false, reason: "kept-volume", keptPercent: vi.percent };

    const code = makeOfferCode(); const expiresAt = now() + policy.expiryMinutes * 60;
    const [promo] = await db.insert(schema.promotions).values({
      name: `BeigePilot offer ${code}`, title: "Special BeigePilot Offer", code, description: "AI assistant offer", kind: "percent", value: percent,
      productSlugs: JSON.stringify(eligible.map((l) => l.slug)), categorySlugs: "[]", packageNames: "[]", minCartCents: policy.minCartCents, maxDiscountCents: policy.maxSavingCents,
      endsAt: expiresAt, usageLimit: 1, perCustomerLimit: 1, firstPurchaseOnly: 0, partnerOnly: 0, automatic: 0, combinable: 0, status: "active", bannerPlaces: "[]", boundEmail: null, origin: "negotiation",
    }).returning({ id: schema.promotions.id });
    const [row] = await db.insert(schema.piloOffers).values({ sessionId: a.sid, code, promotionId: promo.id, percent, levelNo: Number(mine?.n ?? 0) + 1, status: "offered", ipHash: a.ipHash, cartJson: JSON.stringify(items), expiresAt }).returning({ id: schema.piloOffers.id });
    return { ok: true, offerId: row.id, percent, capped: d.capped, expiresAt, savingCents: offerCents, eligible: eligible.map((l) => l.name), excluded };
  } catch { return { ok: false, reason: "error" }; }
}

export type ApplyResult = { ok: true; code: string; percent: number; discountCents: number; totalCents: number; subtotalCents: number } | { ok: false; message: string };
/** Re-validates everything on the server and returns the code ONLY to the session that was offered it. The cart then prices it like any code. */
export async function applyOffer(env: Env, a: { sid: string; offerId: number; cart: unknown }): Promise<ApplyResult> {
  const fail = (message: string): ApplyResult => ({ ok: false, message });
  try {
    await hydrateCatalog(env);
    const db = getDbFromEnv(env);
    const [o] = await db.select().from(schema.piloOffers).where(and(eq(schema.piloOffers.id, a.offerId), eq(schema.piloOffers.sessionId, a.sid)));
    if (!o) return fail("This offer is not available.");
    if (o.status === "redeemed") return fail("This offer has already been used.");
    if (o.expiresAt <= now()) { await db.update(schema.piloOffers).set({ status: "expired" }).where(eq(schema.piloOffers.id, o.id)); return fail("This offer has expired. Ask me again if you still want one."); }
    const items = normalizeItems(a.cart);
    if (items.length === 0) return fail("Your cart is empty.");
    const priced = await priceWith(env, items, o.code);
    const mine = priced.applied.find((x) => x.code === o.code);
    if (!mine || priced.codeError) return fail(priced.codeError || "This offer no longer applies to the databases in your cart.");
    await db.update(schema.piloOffers).set({ status: "applied", appliedAt: now() }).where(eq(schema.piloOffers.id, o.id));
    return { ok: true, code: o.code, percent: Math.min(o.percent, NEGOTIATION_MAX_PERCENT), discountCents: priced.discountCents, totalCents: priced.totalCents, subtotalCents: priced.subtotalCents };
  } catch { return fail("We couldn't apply the offer. Please try again."); }
}

/** Offers that were never used are closed when they pass their expiry (called by the 15-minute cron). */
export async function expireOffers(env: Env): Promise<void> {
  await env.DB.prepare("UPDATE pilo_offers SET status = 'expired' WHERE status IN ('offered','applied') AND expires_at < unixepoch()").run().catch(() => undefined);
  await env.DB.prepare("DELETE FROM pilo_events WHERE created_at < unixepoch() - 7776000").run().catch(() => undefined);
}

export type NegStats = { ready: boolean; issued: number; accepted: number; avgPercent: number; byLevel: { percent: number; n: number }[]; orders: number; discountCents: number; revenueCents: number; testExcluded: number };
/** Real numbers only. Orders = PAID orders that redeemed a negotiation offer (test-network payments are left out and counted separately). */
export async function negStats(env: Env, days = 30): Promise<NegStats> {
  const out: NegStats = { ready: false, issued: 0, accepted: 0, avgPercent: 0, byLevel: [], orders: 0, discountCents: 0, revenueCents: 0, testExcluded: 0 };
  try {
    const since = now() - days * 86400;
    const db = getDbFromEnv(env);
    const offers = await db.select().from(schema.piloOffers).where(sql`${schema.piloOffers.createdAt} >= ${since}`);
    out.issued = offers.length; out.accepted = offers.filter((o) => o.status === "applied" || o.status === "redeemed").length;
    out.avgPercent = offers.length ? Math.round((offers.reduce((n, o) => n + o.percent, 0) / offers.length) * 10) / 10 : 0;
    const lv = new Map<number, number>(); for (const o of offers) lv.set(o.percent, (lv.get(o.percent) ?? 0) + 1);
    out.byLevel = [...lv].map(([percent, n]) => ({ percent, n })).sort((a, b) => a.percent - b.percent);
    const ids = offers.map((o) => o.promotionId).filter((x) => x > 0);
    if (ids.length) {
      const { inArray } = await import("drizzle-orm");
      const { isTestNetwork, optionForWallet } = await import("@/lib/payments/options");
      const reds = (await db.select().from(schema.promotionRedemptions).where(inArray(schema.promotionRedemptions.promotionId, ids))).filter((r) => r.status === "redeemed");
      const real = new Set<string>();
      const orderIds = [...new Set(reds.map((r) => r.orderId))];
      for (let i = 0; i < orderIds.length; i += 90) {
        const att = await db.select({ orderId: schema.paymentAttempts.orderId, coin: schema.paymentAttempts.coin, network: schema.paymentAttempts.network }).from(schema.paymentAttempts).where(and(inArray(schema.paymentAttempts.orderId, orderIds.slice(i, i + 90)), eq(schema.paymentAttempts.status, "paid")));
        for (const a of att) { const o = optionForWallet(a.coin, a.network); if (o && isTestNetwork(o, a.network)) out.testExcluded++; else real.add(a.orderId); }
      }
      const done = reds.filter((r) => real.has(r.orderId));
      out.orders = new Set(done.map((r) => r.orderId)).size; out.discountCents = done.reduce((n, r) => n + r.discountCents, 0);
      out.revenueCents = [...new Map(done.map((r) => [r.orderId, r.orderTotalCents])).values()].reduce((a, b) => a + b, 0);
    }
    out.ready = true;
  } catch { /* not migrated */ }
  return out;
}
