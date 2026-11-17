import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { COINS, buildQuote } from "@/lib/payments/amounts";
import { deriveBtcAddress } from "@/lib/payments/derive";
import { getUsdPriceCached } from "@/lib/payments/rates";
import { isActive } from "@/lib/wallets/service";

/** Message is safe to show to the buyer. */
export class CheckoutError extends Error {}

export type CreateInput = { email: string; productSlug: string; packageName: string; coin: "BTC" };

const on = (v: string | undefined) => v === "true";

/** Creates an order, one payment attempt, and returns the order id. Throws CheckoutError for expected problems. */
export async function createOrder(env: CloudflareEnv, input: CreateInput): Promise<string> {
  if (!on(env.CHECKOUT_ENABLED)) throw new CheckoutError("Checkout is not open yet.");
  const product = getProduct(input.productSlug);
  const pkg = product?.packages.find((p) => p.name === input.packageName);
  if (!product || !pkg) throw new CheckoutError("That package does not exist.");
  if ((product.status !== "live" || product.placeholderData) && !on(env.CHECKOUT_ALLOW_PLACEHOLDER)) {
    throw new CheckoutError("This list is not on sale yet.");
  }

  // BTC only until TRC20 ships (Phase 4e). Mainnet stays closed until the testnet gate has passed.
  const network = on(env.MAINNET_ENABLED) ? "mainnet" : "testnet";
  const db = getDb();
  const candidates = await db
    .select()
    .from(schema.wallets)
    .where(and(eq(schema.wallets.coin, "BTC"), eq(schema.wallets.network, network)));
  const wallet = candidates.find((w) => isActive(w));
  if (!wallet) throw new CheckoutError("Bitcoin payments are not available right now. Please try again later.");

  let rate: string;
  try {
    rate = await getUsdPriceCached(env.CACHE, "BTC");
  } catch {
    throw new CheckoutError("We could not get a reliable Bitcoin price. Please try again in a few minutes.");
  }
  const now = Date.now();
  const quote = buildQuote(COINS.BTC, pkg.priceUsdCents, rate, now);

  // Atomic: each order gets its own never-reused derivation index.
  const [bumped] = await db
    .update(schema.wallets)
    .set({ nextIndex: sql`${schema.wallets.nextIndex} + 1` })
    .where(eq(schema.wallets.id, wallet.id))
    .returning({ next: schema.wallets.nextIndex });
  const index = bumped.next - 1;
  const address = deriveBtcAddress(wallet.addressOrXpub, index);

  const orderId = crypto.randomUUID();
  await db.batch([
    db.insert(schema.orders).values({ id: orderId, email: input.email, status: "pending", totalUsdCents: pkg.priceUsdCents }),
    db.insert(schema.orderItems).values({ orderId, productSlug: product.slug, packageName: pkg.name, records: pkg.records, priceUsdCents: pkg.priceUsdCents }),
    db.insert(schema.paymentAttempts).values({
      orderId, coin: "BTC", network: wallet.network, walletId: wallet.id, derivationIndex: index, address,
      expectedAmount: quote.amount, lockedRate: quote.rate, expiresAt: new Date(quote.expiresAt), status: "open",
    }),
  ]);
  return orderId;
}
