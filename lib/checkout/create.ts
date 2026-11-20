import { and, eq, gt } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { MAX_CART_ITEMS, priceCart } from "@/lib/cart/model";
import { sha256Hex } from "@/lib/forms/hash";
import { countUse, resolveDiscount } from "@/lib/partners/discount";
import { buildQuote, formatAtomic, parseAtomic } from "@/lib/payments/amounts";
import { OPTIONS } from "@/lib/payments/options";
import { getUsdPriceCached } from "@/lib/payments/rates";
import { allocateUniqueAmount } from "@/lib/payments/unique-amount";
import { isActive } from "@/lib/wallets/service";

/** Message is safe to show to the buyer. */
export class CheckoutError extends Error {}

/** `option` is a key of OPTIONS, e.g. "BTC", "USDT-TRC20", "USDT-ERC20", "USDC-ERC20", "ETH". */
export type CreateInput = { email: string; items: { productSlug: string; packageName: string }[]; option: string; /** optional partner discount code; valid only with the approved partner's own email */ discountCode?: string };

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
  if (input.items.length === 0) throw new CheckoutError("Your cart is empty.");
  if (input.items.length > MAX_CART_ITEMS) throw new CheckoutError(`You can buy up to ${MAX_CART_ITEMS} lists in one order.`);
  const slugs = input.items.map((i) => i.productSlug);
  if (new Set(slugs).size !== slugs.length) throw new CheckoutError("Each list can be in an order only once.");
  const db = getDbFromEnv(env);
  let discount: { code: string; percent: number } | undefined;
  if (input.discountCode?.trim()) {
    const d = await resolveDiscount(db, input.discountCode, input.email);
    if (!d.ok) throw new CheckoutError(d.reason);
    discount = d.discount;
  }
  const priced = priceCart(input.items.map((i) => ({ slug: i.productSlug, pkg: i.packageName })), { checkoutOpen: true, allowPlaceholder: on(env.CHECKOUT_ALLOW_PLACEHOLDER), discount });
  if (priced.dropped.length > 0) throw new CheckoutError("A list or package in your cart does not exist any more. Review your cart.");
  const unavailable = priced.lines.find((l) => !l.purchasable);
  if (unavailable) throw new CheckoutError(`${unavailable.name} is not on sale yet. Remove it from your cart to continue.`);
  const totalCents = priced.totalCents;

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
  const dedupeKey = `co:${await sha256Hex(`${input.email}|${input.option}|${priced.lines.map((l) => `${l.slug}:${l.packageName}`).sort().join(",")}|${priced.discountCode}`)}`;
  const prev = await env.CACHE.get(dedupeKey).catch(() => null);
  if (prev) {
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, prev));
    const [at] = await db.select({ exp: schema.paymentAttempts.expiresAt, st: schema.paymentAttempts.status }).from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, prev)).limit(1);
    if (o?.status === "pending" && at?.st === "open" && at.exp.getTime() > now + 60_000) return prev;
  }
  const orderId = crypto.randomUUID();

  for (let tryNo = 0; tryNo < 3; tryNo++) {
    const recent = await db.select({ amount: schema.paymentAttempts.expectedAmount }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), eq(schema.paymentAttempts.coin, opt.coin), eq(schema.paymentAttempts.network, network), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    const taken = new Set(recent.map((r) => parseAtomic(r.amount, spec.decimals)));
    const atomic = allocateUniqueAmount(quote.atomic, taken, Math.random, opt.step);
    const amount = formatAtomic(atomic, spec.decimals);

    await db.batch([
      db.insert(schema.orders).values({ id: orderId, email: input.email, status: "pending", totalUsdCents: totalCents, ...(priced.discountPercent > 0 ? { discountCode: priced.discountCode, discountPercent: priced.discountPercent, subtotalCents: priced.subtotalCents } : {}) }),
      db.insert(schema.orderItems).values(priced.lines.map((l) => ({ orderId, productSlug: l.slug, packageName: l.packageName, records: l.records, priceUsdCents: l.payCents }))),
      db.insert(schema.paymentAttempts).values({
        orderId, coin: opt.coin, network, walletId: wallet.id, address: wallet.addressOrXpub,
        expectedAmount: amount, lockedRate: quote.rate, expiresAt: new Date(quote.expiresAt), status: "open",
      }),
    ]);
    // Two buyers can race for the same amount. Keep exactly one: if we are not alone, undo ours and pick again.
    const same = await db.select({ orderId: schema.paymentAttempts.orderId }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), eq(schema.paymentAttempts.coin, opt.coin), eq(schema.paymentAttempts.network, network), eq(schema.paymentAttempts.expectedAmount, amount), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    if (same.length <= 1) { await env.CACHE.put(dedupeKey, orderId, { expirationTtl: 600 }).catch(() => undefined); if (discount) await countUse(db, discount.code).catch(() => undefined); return orderId; }
    await db.batch([
      db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)),
      db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)),
      db.delete(schema.orders).where(eq(schema.orders.id, orderId)),
    ]);
  }
  throw new CheckoutError("We are busy right now. Please try again in a minute.");
}
