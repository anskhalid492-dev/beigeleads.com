import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { COINS, buildQuote, formatAtomic, parseAtomic } from "@/lib/payments/amounts";
import { getUsdPriceCached } from "@/lib/payments/rates";
import { BTC_STEP, USDT_STEP, allocateUniqueAmount } from "@/lib/payments/unique-amount";
import { isActive } from "@/lib/wallets/service";

/** Message is safe to show to the buyer. */
export class CheckoutError extends Error {}

export type Coin = "BTC" | "USDT";
export type CreateInput = { email: string; productSlug: string; packageName: string; coin: Coin };

const on = (v: string | undefined) => v === "true";
const WINDOW_MS = 7 * 24 * 3600 * 1000; // amounts stay reserved while late payments can still arrive

/** The wallet network used for a coin. Mainnet only after MAINNET_ENABLED=true (testing gate, CLAUDE.md section 7). */
export function walletNetwork(env: CloudflareEnv, coin: Coin): string {
  const main = on(env.MAINNET_ENABLED);
  return coin === "BTC" ? (main ? "mainnet" : "testnet") : main ? "TRC20" : "nile";
}

/**
 * Creates an order with ONE payment attempt. Everyone pays into the admin's fixed wallet address; the order is
 * identified by a unique amount (satoshis for BTC, 4 decimals for USDT). Throws CheckoutError for expected problems.
 */
export async function createOrder(env: CloudflareEnv, input: CreateInput): Promise<string> {
  if (!on(env.CHECKOUT_ENABLED)) throw new CheckoutError("Checkout is not open yet.");
  const product = getProduct(input.productSlug);
  const pkg = product?.packages.find((p) => p.name === input.packageName);
  if (!product || !pkg) throw new CheckoutError("That package does not exist.");
  if ((product.status !== "live" || product.placeholderData) && !on(env.CHECKOUT_ALLOW_PLACEHOLDER)) {
    throw new CheckoutError("This list is not on sale yet.");
  }

  const network = walletNetwork(env, input.coin);
  if (input.coin === "USDT" && network === "nile" && !env.TRON_NILE_USDT) throw new CheckoutError("USDT test payments are not configured.");
  const spec = input.coin === "BTC" ? COINS.BTC : COINS.USDT_TRC20;
  const db = getDb();
  const wallet = (await db.select().from(schema.wallets).where(and(eq(schema.wallets.coin, input.coin), eq(schema.wallets.network, network)))).find((w) => isActive(w));
  if (!wallet) throw new CheckoutError(`${input.coin} payments are not available right now. Please try again later.`);

  let rate: string;
  try {
    rate = await getUsdPriceCached(env.CACHE, input.coin);
  } catch {
    throw new CheckoutError("We could not get a reliable price. Please try again in a few minutes.");
  }
  const now = Date.now();
  const quote = buildQuote(spec, pkg.priceUsdCents, rate, now);
  const orderId = crypto.randomUUID();

  for (let tryNo = 0; tryNo < 3; tryNo++) {
    const recent = await db.select({ amount: schema.paymentAttempts.expectedAmount }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    const taken = new Set(recent.map((r) => parseAtomic(r.amount, spec.decimals)));
    const atomic = allocateUniqueAmount(quote.atomic, taken, Math.random, input.coin === "BTC" ? BTC_STEP : USDT_STEP);
    const amount = formatAtomic(atomic, spec.decimals);

    await db.batch([
      db.insert(schema.orders).values({ id: orderId, email: input.email, status: "pending", totalUsdCents: pkg.priceUsdCents }),
      db.insert(schema.orderItems).values({ orderId, productSlug: product.slug, packageName: pkg.name, records: pkg.records, priceUsdCents: pkg.priceUsdCents }),
      db.insert(schema.paymentAttempts).values({
        orderId, coin: input.coin, network, walletId: wallet.id, address: wallet.addressOrXpub,
        expectedAmount: amount, lockedRate: quote.rate, expiresAt: new Date(quote.expiresAt), status: "open",
      }),
    ]);
    // Two buyers can race for the same amount. Keep exactly one: if we are not alone, undo ours and pick again.
    const same = await db.select({ orderId: schema.paymentAttempts.orderId }).from(schema.paymentAttempts)
      .where(and(eq(schema.paymentAttempts.address, wallet.addressOrXpub), eq(schema.paymentAttempts.expectedAmount, amount), gt(schema.paymentAttempts.expiresAt, new Date(now - WINDOW_MS))));
    if (same.length <= 1) return orderId;
    await db.batch([
      db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)),
      db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)),
      db.delete(schema.orders).where(eq(schema.orders.id, orderId)),
    ]);
  }
  throw new CheckoutError("We are busy right now. Please try again in a minute.");
}
