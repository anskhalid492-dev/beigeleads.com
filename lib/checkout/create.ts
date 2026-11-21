import { hydrateCatalog } from "@/lib/catalog-db";
import { loadPublished } from "@/lib/bundles/store";
import { EV_SLUG, loadEvSettings } from "@/lib/ev/settings";
import { evInsertRow } from "@/lib/ev/store";
import { DFY_OWN_SLUG, DFY_SLUG, loadDfySettings } from "@/lib/dfy/settings";
import { dfyInsertRow } from "@/lib/dfy/store";
import { and, eq, gt } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { MAX_CART_ITEMS, priceCart } from "@/lib/cart/model";
import { sha256Hex } from "@/lib/forms/hash";
import { countUse, resolveDiscount } from "@/lib/partners/discount";
import { isPartnerCode } from "@/lib/partners/types";
import { dropReservations, loadCandidates, reserveRedemptions } from "@/lib/promos/store";
import { buildQuote, formatAtomic, parseAtomic } from "@/lib/payments/amounts";
import { OPTIONS } from "@/lib/payments/options";
import { getUsdPriceCached } from "@/lib/payments/rates";
import { allocateUniqueAmount } from "@/lib/payments/unique-amount";
import { isActive } from "@/lib/wallets/service";
import { loadSalesSettings } from "@/lib/sales/settings";

/** Message is safe to show to the buyer. */
export class CheckoutError extends Error {}

/** `option` is a key of OPTIONS, e.g. "BTC", "USDT-TRC20", "USDT-ERC20", "USDC-ERC20", "ETH". */
export type CreateInput = { /** DFY Outbound: package NAME and the ownership choice (the server reads prices and allocations from its own settings) */ dfy?: { pkg: string; ownership: boolean }; email: string; items: { productSlug: string; packageName: string }[]; option: string; /** optional partner discount code; valid only with the approved partner's own email */ discountCode?: string; /** curated bundles (slugs); the server reads each bundle's lists and price */ bundles?: string[]; /** Email Verification package NAME (the server reads its price and limit from its own settings) */ verification?: string };

const on = (v: string | undefined) => v === "true";
const WINDOW_MS = 7 * 24 * 3600 * 1000; // amounts stay reserved while late payments can still arrive

/** Test tokens need their contract configured (var), otherwise that test option is unavailable. */
export function testContract(env: CloudflareEnv, optionId: string): string | undefined {
  return { "USDT-TRC20": env.TRON_NILE_USDT, "USDT-ERC20": env.EVM_TEST_USDT, "USDC-ERC20": env.EVM_TEST_USDC }[optionId];
}

/**
 * Creates an order (one or more lists) with ONE payment attempt for the whole total. Prices are always read from the catalog here;
 * nothing the browser sends can change the amount. A repeated identical request returns the order that is still open instead of creating a second one. Everyone pays into the admin's fixed wallet address; the order is
 * identified by a unique amount (satoshis for BTC, 4 decimals for USDT). Throws CheckoutError for expected problems.
 */
export async function createOrder(env: CloudflareEnv, input: CreateInput): Promise<string> {
  if (!on(env.CHECKOUT_ENABLED)) throw new CheckoutError("Checkout is not open yet.");
  await hydrateCatalog(env, true);
  const bundleSlugs = [...new Set(input.bundles ?? [])];
  if (input.items.length === 0 && bundleSlugs.length === 0 && !input.verification && !input.dfy) throw new CheckoutError("Your cart is empty.");
  if (input.items.length > MAX_CART_ITEMS) throw new CheckoutError(`You can buy up to ${MAX_CART_ITEMS} lists in one order.`);
  const slugs = input.items.map((i) => i.productSlug);
  if (new Set(slugs).size !== slugs.length) throw new CheckoutError("Each list can be in an order only once.");
  const db = getDbFromEnv(env);
  // One code box: a partner code (PARTNER-XXXX-XXXX, needs the partner's own email) or a public promotion code.
  const typed = input.discountCode?.trim() ?? "";
  let discount: { code: string; percent: number } | undefined;
  if (typed && isPartnerCode(typed)) {
    const d = await resolveDiscount(db, typed, input.email);
    if (!d.ok) throw new CheckoutError(d.reason);
    discount = d.discount;
  }
  const candidates = await loadCandidates(db, input.email);
  const sales = await loadSalesSettings(env);
  // Curated bundles are read fresh from the database (never from the browser or a cache) and priced by the same pure code as the cart.
  const bundleDefs = bundleSlugs.length ? await loadPublished(env, true) : [];
  const ev = await loadEvSettings(env);
  if (input.verification && !ev.packages.some((x) => x.name === input.verification)) throw new CheckoutError("The verification package in your cart does not exist any more. Review your cart.");
  // DFY Outbound: a new service (package from the server settings) (one-time since 21 Nov 2026).
  const dfySet = await loadDfySettings(env);
  let dfyCtx: Parameters<typeof priceCart>[1]["dfy"];
  if (input.dfy) {
    if (!dfySet.packages.some((x) => x.name === input.dfy?.pkg)) throw new CheckoutError("The DFY Outbound package in your cart does not exist any more. Review your cart.");
    dfyCtx = { pkg: input.dfy.pkg, ownership: input.dfy.ownership, enabled: dfySet.enabled, ownershipEnabled: dfySet.ownershipEnabled, ownershipCents: dfySet.ownershipCents, packages: dfySet.packages };
  }
  const priced = priceCart(
    input.items.map((i) => ({ slug: i.productSlug, pkg: i.packageName })),
    { dfy: dfyCtx, verification: { pkg: input.verification ?? null, enabled: ev.enabled, packages: ev.packages.map((x) => ({ name: x.name, limit: x.limit, priceCents: x.priceCents })) }, bundles: { slugs: bundleSlugs, defs: bundleDefs }, checkoutOpen: true, allowPlaceholder: on(env.CHECKOUT_ALLOW_PLACEHOLDER), discount, volume: sales.volume, rewardCombineVolume: sales.reward.combineVolume, promo: { candidates, enteredCode: typed && !discount ? typed : undefined, nowSec: Math.floor(Date.now() / 1000), emailKnown: true } },
  );
  if (priced.dropped.length > 0) throw new CheckoutError("A list or package in your cart does not exist any more. Review your cart.");
  if (priced.droppedBundles.length > 0) throw new CheckoutError("A bundle in your cart is not available any more. Review your cart.");
  const unavailable = priced.lines.find((l) => !l.purchasable);
  if (unavailable) throw new CheckoutError(unavailable.reason && unavailable.reason !== "This list is not on sale yet." ? unavailable.reason : `${unavailable.name} is not on sale yet. Remove it from your cart to continue.`);
  const unavailableBundle = priced.bundles.find((b) => !b.purchasable);
  if (unavailableBundle) throw new CheckoutError(`${unavailableBundle.name}: ${unavailableBundle.reason} Review your cart.`);
  if (priced.lines.length + priced.bundles.reduce((n, b) => n + b.components.length, 0) > 40) throw new CheckoutError("This order is too large. Remove something from your cart.");
  // A code the buyer typed that does not apply stops the order: they must not pay a price they did not expect.
  if (typed && !discount && priced.codeError) throw new CheckoutError(priced.codeError);
  if (priced.service && !priced.service.purchasable) throw new CheckoutError(priced.service.reason || "Email list verification is not available right now.");
  if (priced.dfy && !priced.dfy.purchasable) throw new CheckoutError(priced.dfy.reason || "DFY Outbound is not available right now.");
  const totalCents = priced.totalCents;
  // One order item per list. A bundle's lists carry their share of the bundle price, so the items always add up to the amount paid
  // (refunds and reports use what was actually paid, never the list price).
  const itemRows = (orderId: string) => [
    ...priced.lines.map((l) => ({ orderId, productSlug: l.slug, packageName: l.packageName, records: l.records, priceUsdCents: l.payCents })),
    ...priced.bundles.flatMap((b) => b.components.map((c) => ({ orderId, productSlug: c.slug, packageName: c.packageName, records: c.records, priceUsdCents: c.shareCents }))),
    // The verification service is a normal order line (full price, never discounted), recognised by its fixed slug.
    // DFY Outbound: the monthly service line, and (once) the optional ownership fee as its own line. Never discounted.
    ...(priced.dfy ? [{ orderId, productSlug: DFY_SLUG, packageName: priced.dfy.name, records: priced.dfy.leads, priceUsdCents: priced.dfy.monthlyCents }] : []),
    ...(priced.dfy?.ownership ? [{ orderId, productSlug: DFY_OWN_SLUG, packageName: "Ownership", records: 0, priceUsdCents: priced.dfy.ownershipCents }] : []),
    ...(priced.service ? [{ orderId, productSlug: EV_SLUG, packageName: priced.service.name, records: priced.service.limit, priceUsdCents: priced.service.priceCents }] : []),
  ];
  const bundleRows = (orderId: string) => priced.bundles.map((b) => ({ orderId, bundleSlug: b.slug, bundleName: b.name, priceCents: b.priceCents, listCents: b.listCents, itemsJson: JSON.stringify(b.components.map((c) => ({ slug: c.slug, name: c.name, pkg: c.packageName, records: c.records, listCents: c.listCents, shareCents: c.shareCents }))) }));
  if (itemRows("x").reduce((n, r) => n + r.priceUsdCents, 0) !== totalCents) throw new Error("Order items do not add up to the order total.");

  const opt = OPTIONS[input.option];
  if (!opt) throw new CheckoutError("Choose a payment method.");
  const main = on(env.MAINNET_ENABLED);
  const network = main ? opt.mainnet : opt.test;
  if (!main && opt.contract !== undefined && !testContract(env, opt.id)) throw new CheckoutError("Test payments for this token are not configured.");
  const spec = { coin: opt.coin, network: opt.chain, decimals: opt.decimals };
  const wallet = (await db.select().from(schema.wallets).where(and(eq(schema.wallets.coin, opt.coin), eq(schema.wallets.network, network)))).find((w) => isActive(w));
  if (!wallet) throw new CheckoutError(`${opt.label} payments are not available right now. Please try again later.`);

  let rate: string;
  try {
    rate = await getUsdPriceCached(env.CACHE, opt.rateCoin);
  } catch {
    throw new CheckoutError("We could not get a reliable price. Please try again in a few minutes.");
  }
  const now = Date.now();
  const quote = buildQuote(spec, totalCents, rate, now);

  // Same buyer, same cart, same coin within 10 minutes: hand back the order that is still open (no second order, no second payment session).
  const dedupeKey = `co:${await sha256Hex(`${input.email}|${input.option}|${priced.lines.map((l) => `${l.slug}:${l.packageName}`).sort().join(",")}|${priced.discountCode}|${priced.totalCents}|${priced.bundles.map((b) => b.slug).sort().join(",")}|${priced.service?.name ?? ""}|${priced.dfy?.name ?? ""}:${priced.dfy?.ownership ?? ""}:`)}`;
  const prev = await env.CACHE.get(dedupeKey).catch(() => null);
  if (prev) {
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, prev));
    const [at] = await db.select({ exp: schema.paymentAttempts.expiresAt, st: schema.paymentAttempts.status }).from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, prev)).limit(1);
    if (o?.status === "pending" && at?.st === "open" && at.exp.getTime() > now + 60_000) return prev;
  }
  const orderId = crypto.randomUUID();
  const dfyPkg = priced.dfy ? dfySet.packages.find((x) => x.name === priced.dfy?.name) : undefined;
  const dfyIns = dfyPkg && priced.dfy ? await dfyInsertRow(env, orderId, input.email, dfyPkg, { selected: priced.dfy.ownership, cents: priced.dfy.ownershipCents }) : null;
  const evRow = priced.service ? await evInsertRow(env, orderId, input.email, { name: priced.service.name, limit: priced.service.limit, priceCents: priced.service.priceCents }) : null;

  /** Removes a half-created order (the order_bundles table is touched only when the order has a bundle). */
  const undo = async () => {
    if (priced.bundles.length) await db.delete(schema.orderBundles).where(eq(schema.orderBundles.orderId, orderId));
    if (evRow) await db.delete(schema.evOrders).where(eq(schema.evOrders.orderId, orderId));
    if (dfyIns) { await db.delete(schema.dfyCycles).where(eq(schema.dfyCycles.orderId, orderId)); await db.delete(schema.dfyOrders).where(eq(schema.dfyOrders.orderId, orderId)); }
    await db.batch([
      db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)),
      db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)),
      db.delete(schema.orders).where(eq(schema.orders.id, orderId)),
    ]);
  };
  for (let tryNo = 0; tryNo < 3; tryNo++) {
    const recent = await db.select({ amount: schema.paymentAttempts.expectedAmount }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), eq(schema.paymentAttempts.coin, opt.coin), eq(schema.paymentAttempts.network, network), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    const taken = new Set(recent.map((r) => parseAtomic(r.amount, spec.decimals)));
    const atomic = allocateUniqueAmount(quote.atomic, taken, Math.random, opt.step);
    const amount = formatAtomic(atomic, spec.decimals);

    const writes = [
      db.insert(schema.orders).values({ id: orderId, email: input.email, status: "pending", totalUsdCents: totalCents, ...(priced.discountCents > 0 ? { ...(priced.discountCode ? { discountCode: priced.discountCode } : {}), subtotalCents: priced.subtotalCents, discountCents: priced.discountCents, ...(priced.discountPercent > 0 ? { discountPercent: priced.discountPercent } : {}) } : {}) }),
      db.insert(schema.orderItems).values(itemRows(orderId)),
      db.insert(schema.paymentAttempts).values({
        orderId, coin: opt.coin, network, walletId: wallet.id, address: wallet.addressOrXpub,
        expectedAmount: amount, lockedRate: quote.rate, expiresAt: new Date(quote.expiresAt), status: "open",
      }),
      ...(priced.bundles.length ? [db.insert(schema.orderBundles).values(bundleRows(orderId))] : []),
      ...(evRow ? [db.insert(schema.evOrders).values(evRow)] : []),
      ...(dfyIns ? [db.insert(schema.dfyOrders).values(dfyIns.row), db.insert(schema.dfyCycles).values(dfyIns.cycle)] : []),
    ];
    await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);
    // Two buyers can race for the same amount. Keep exactly one: if we are not alone, undo ours and pick again.
    const same = await db.select({ orderId: schema.paymentAttempts.orderId }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), eq(schema.paymentAttempts.coin, opt.coin), eq(schema.paymentAttempts.network, network), eq(schema.paymentAttempts.expectedAmount, amount), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    if (same.length <= 1) {
      // Reserve the promotion use. If the last use went to someone else a moment ago, undo this order.
      const res = await reserveRedemptions(db, orderId, input.email, priced.applied, totalCents);
      if (!res.ok) {
        await dropReservations(db, orderId);
        await undo();
        throw new CheckoutError(res.reason === "customer" ? "You have already used this code the maximum number of times." : res.reason === "limit" ? "This code has just reached its usage limit." : "We could not apply your discount. Please try again.");
      }
      await env.CACHE.put(dedupeKey, orderId, { expirationTtl: 600 }).catch(() => undefined);
      if (discount) await countUse(db, discount.code).catch(() => undefined);
      return orderId;
    }
    await undo();
  }
  throw new CheckoutError("We are busy right now. Please try again in a minute.");
}
