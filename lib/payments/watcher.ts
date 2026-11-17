import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { formatAtomic, parseAtomic, COINS } from "./amounts";
import { BTC_API, fetchBtcPayments } from "./btc-chain";
import { decideAttempt } from "./decide";
import { confirmationsNeeded } from "./state";

const LATE_WINDOW_MS = 7 * 24 * 3600 * 1000; // keep watching expired quotes for a week to catch late payments
const MAX_PER_RUN = 40;

type Deps = { fetchPayments?: typeof fetchBtcPayments; now?: () => number };

/** Cron entry (every minute). Safe to run twice at once: every write is guarded by the current status. */
export async function runPaymentWatcher(env: CloudflareEnv, deps: Deps = {}) {
  const fetchPayments = deps.fetchPayments ?? fetchBtcPayments;
  const now = (deps.now ?? Date.now)();
  const db = getDbFromEnv(env);

  const attempts = await db
    .select()
    .from(schema.paymentAttempts)
    .where(and(
      eq(schema.paymentAttempts.coin, "BTC"),
      or(
        inArray(schema.paymentAttempts.status, ["open", "partial"]),
        and(eq(schema.paymentAttempts.status, "expired"), gt(schema.paymentAttempts.expiresAt, new Date(now - LATE_WINDOW_MS))),
      ),
    ))
    .limit(MAX_PER_RUN);

  let changed = 0;
  for (const a of attempts) {
    try {
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, a.orderId));
      if (!order) continue;
      const [wallet] = a.walletId ? await db.select().from(schema.wallets).where(eq(schema.wallets.id, a.walletId)) : [];
      const base = a.network === "mainnet" ? BTC_API.mainnet : (env.BTC_TESTNET_API ?? BTC_API.testnet);

      const chain = await fetchPayments(base, a.address);
      for (const t of chain) {
        // tx_hash is UNIQUE: seeing the same transaction again only refreshes its confirmations.
        await db.insert(schema.paymentEvents)
          .values({ attemptId: a.id, txHash: t.txid, amount: formatAtomic(t.sats, COINS.BTC.decimals), confirmations: t.confirmations })
          .onConflictDoUpdate({ target: schema.paymentEvents.txHash, set: { confirmations: t.confirmations } });
      }
      const events = await db.select().from(schema.paymentEvents).where(eq(schema.paymentEvents.attemptId, a.id));
      const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, a.orderId));

      const d = decideAttempt({
        expectedAtomic: parseAtomic(a.expectedAmount, COINS.BTC.decimals),
        txs: events.map((e) => ({ sats: parseAtomic(e.amount, COINS.BTC.decimals), confirmations: e.confirmations, seenAtMs: e.seenAt.getTime() })),
        confirmationsNeeded: confirmationsNeeded("BTC", a.network, item?.priceUsdCents ?? order.totalUsdCents, wallet?.minConfirmations ?? 1),
        expiresAtMs: a.expiresAt.getTime(),
        nowMs: now,
        orderStatus: order.status,
      });
      if (d.action === "none") continue;

      const flip = async (to: typeof order.status, from: (typeof order.status)[], extra: Partial<typeof schema.orders.$inferInsert> = {}) => {
        const r = await db.update(schema.orders).set({ status: to, ...extra }).where(and(eq(schema.orders.id, order.id), inArray(schema.orders.status, from))).returning({ id: schema.orders.id });
        return r.length > 0; // false = someone else already did it: do not notify twice
      };
      const attemptTo = (s: "expired" | "paid" | "partial" | "late") => db.update(schema.paymentAttempts).set({ status: s }).where(eq(schema.paymentAttempts.id, a.id));
      const btc = (n: bigint) => `${formatAtomic(n, COINS.BTC.decimals)} BTC`;

      if (d.action === "expire") {
        if (await flip("expired", ["pending"])) { await attemptTo("expired"); changed++; }
      } else if (d.action === "paid") {
        if (await flip("paid", ["pending", "partial", "late_payment"], { paidAt: new Date(now) })) {
          await attemptTo("paid"); changed++;
          // Phase 4f hooks in here: create the download token and queue the delivery email.
          await notifyOwner(env, "Payment confirmed", `Order ${order.id} paid: received ${btc(d.receivedAtomic)}.${d.overpaidAtomic > 0n ? ` OVERPAID by ${btc(d.overpaidAtomic)}: refund or credit needed.` : ""}`);
        }
      } else if (d.action === "partial") {
        if (await flip("partial", ["pending"])) {
          await attemptTo("partial"); changed++;
          await notifyOwner(env, "Partial payment", `Order ${order.id} received ${btc(d.receivedAtomic)}, still short by ${btc(d.remainingAtomic)}.`);
        }
      } else if (d.action === "late") {
        if (await flip("late_payment", ["pending", "expired", "partial"])) {
          await attemptTo("late"); changed++;
          await notifyOwner(env, "LATE payment needs a decision", `Order ${order.id} received ${btc(d.receivedAtomic)} after the quote expired. Decide: deliver, refund or ask the buyer.`);
        }
      }
    } catch {
      // One failing attempt (chain API hiccup) must not stop the others. It is retried next minute.
    }
  }
  return { checked: attempts.length, changed };
}

/** Housekeeping used by the 15-minute cron: expire open quotes that never received anything. */
export async function expireStaleAttempts(env: CloudflareEnv, now = Date.now()) {
  const db = getDbFromEnv(env);
  const stale = await db.select({ id: schema.paymentAttempts.id, orderId: schema.paymentAttempts.orderId }).from(schema.paymentAttempts)
    .where(and(eq(schema.paymentAttempts.status, "open"), sql`${schema.paymentAttempts.expiresAt} < ${Math.floor(now / 1000)}`,
      sql`NOT EXISTS (SELECT 1 FROM payment_events e WHERE e.attempt_id = payment_attempts.id)`))
    .limit(200);
  for (const s of stale) {
    await db.update(schema.orders).set({ status: "expired" }).where(and(eq(schema.orders.id, s.orderId), eq(schema.orders.status, "pending")));
    await db.update(schema.paymentAttempts).set({ status: "expired" }).where(and(eq(schema.paymentAttempts.id, s.id), eq(schema.paymentAttempts.status, "open")));
  }
  return stale.length;
}
