import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { QUOTE_LOCK_MS, formatAtomic, parseAtomic } from "./amounts";
import { EVM_MAINNET_API, EVM_SEPOLIA_API, fetchEvmPayments } from "./evm-chain";
import { optionForWallet, type PayOption } from "./options";
import { BTC_API, fetchBtcPayments, type ChainTx } from "./btc-chain";
import { deliverPendingOrders } from "@/lib/delivery/deliver";
import { decideAttempt } from "./decide";
import { matchPayments } from "./match";
import { confirmationsNeeded } from "./state";
import { TRON_MAINNET, fetchTronPayments } from "./tron-chain";

const LATE_WINDOW_MS = 7 * 24 * 3600 * 1000; // keep watching expired quotes for a week to catch late payments
const MAX_PER_RUN = 60;

type Deps = {
  fetchBtc?: typeof fetchBtcPayments;
  fetchTron?: typeof fetchTronPayments;
  fetchEvm?: typeof fetchEvmPayments;
  now?: () => number;
};

/**
 * Cron entry (every minute). Everyone pays into one fixed address per coin, so per address we read the chain ONCE,
 * match each incoming transfer to an order by its exact unique amount, then decide per order.
 * Safe to run twice at once: every write is guarded by the current status.
 */
export async function runPaymentWatcher(env: CloudflareEnv, deps: Deps = {}) {
  const fetchBtc = deps.fetchBtc ?? fetchBtcPayments;
  const fetchTron = deps.fetchTron ?? fetchTronPayments;
  const fetchEvm = deps.fetchEvm ?? fetchEvmPayments;
  const now = (deps.now ?? Date.now)();
  const db = getDbFromEnv(env);

  const attempts = await db
    .select()
    .from(schema.paymentAttempts)
    .where(or(
      inArray(schema.paymentAttempts.status, ["open", "partial"]),
      and(eq(schema.paymentAttempts.status, "expired"), gt(schema.paymentAttempts.expiresAt, new Date(now - LATE_WINDOW_MS))),
    ))
    .limit(MAX_PER_RUN);

  // One chain read per (coin, network, address).
  const groups = new Map<string, typeof attempts>();
  for (const a of attempts) groups.set(`${a.coin}|${a.network}|${a.address}`, [...(groups.get(`${a.coin}|${a.network}|${a.address}`) ?? []), a]);

  let changed = 0;
  for (const list of groups.values()) {
    const first = list[0];
    const opt = optionForWallet(first.coin, first.network);
    if (!opt) continue;
    const spec = { decimals: opt.decimals };
    try {
      let chain: ChainTx[];
      const isMain = first.network === opt.mainnet;
      if (opt.chain === "bitcoin") {
        chain = await fetchBtc(isMain ? BTC_API.mainnet : (env.BTC_TESTNET_API ?? BTC_API.testnet), first.address);
      } else if (opt.chain === "tron") {
        const cfg = isMain ? TRON_MAINNET : { api: env.TRON_NILE_API ?? "https://nile.trongrid.io", usdt: env.TRON_NILE_USDT ?? "" };
        if (!cfg.usdt) continue;
        const since = Math.min(...list.map((a) => a.expiresAt.getTime() - QUOTE_LOCK_MS));
        chain = await fetchTron(cfg, first.address, since, fetch, env.TRONGRID_API_KEY);
      } else {
        const base = isMain ? (env.EVM_API_BASE ?? EVM_MAINNET_API) : (env.EVM_TEST_API_BASE ?? EVM_SEPOLIA_API);
        const contract = opt.contract ? (isMain ? opt.contract : evmTestContract(env, opt)) : undefined;
        if (opt.contract && !contract) continue;
        const wanted = new Set(list.map((a) => parseAtomic(a.expectedAmount, opt.decimals)));
        chain = await fetchEvm({ base, apiKey: env.BLOCKSCOUT_API_KEY }, first.address, contract ? { kind: "erc20", contract } : { kind: "native" }, wanted);
      }

      const { byAttempt, unmatched } = matchPayments(
        list.map((a) => ({ id: a.id, expectedAtomic: parseAtomic(a.expectedAmount, spec.decimals), expiresAtMs: a.expiresAt.getTime() })),
        chain,
        now,
      );

      // Money that matches no order needs a human. Tell the owner once per transaction.
      for (const tx of unmatched) {
        const [known] = await db.select({ id: schema.paymentEvents.id }).from(schema.paymentEvents).where(eq(schema.paymentEvents.txHash, tx.txid));
        const key = `unmatched:${tx.txid}`;
        if (known || (await env.CACHE.get(key))) continue;
        await env.CACHE.put(key, "1", { expirationTtl: 30 * 24 * 3600 });
        await notifyOwner(env, "Payment matches no order", `${opt.label} transfer ${tx.txid} of ${formatAtomic(tx.sats, spec.decimals)} to ${first.address} matches no open order (wrong amount, fee deducted, or unrelated deposit). Review it.`);
      }

      for (const a of list) {
        const mine = byAttempt.get(a.id) ?? [];
        for (const t of mine) {
          // tx_hash is UNIQUE: a transfer already claimed (by this or another order) is never counted twice.
          await db.insert(schema.paymentEvents)
            .values({ attemptId: a.id, txHash: t.txid, amount: formatAtomic(t.sats, spec.decimals), confirmations: t.confirmations, seenAt: new Date(Math.min(now, t.timeMs ?? now)) })
            .onConflictDoNothing({ target: schema.paymentEvents.txHash });
          await db.update(schema.paymentEvents).set({ confirmations: t.confirmations }).where(and(eq(schema.paymentEvents.txHash, t.txid), eq(schema.paymentEvents.attemptId, a.id)));
        }
        if (await processAttempt(env, a, now)) changed++;
      }
    } catch {
      // One failing address (chain API hiccup) must not stop the others. It is retried next minute.
    }
  }
  // Delivery: email the owner-set external link for every paid order (also retries failures / missing links).
  let delivered = 0;
  try { delivered = await deliverPendingOrders(env); } catch { /* retried next minute */ }
  return { checked: attempts.length, changed, delivered };
}

async function processAttempt(env: CloudflareEnv, a: typeof schema.paymentAttempts.$inferSelect, now: number): Promise<boolean> {
  const db = getDbFromEnv(env);
  const opt = optionForWallet(a.coin, a.network);
  if (!opt) return false;
  const spec = { decimals: opt.decimals };
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, a.orderId));
  if (!order) return false;
  const [wallet] = a.walletId ? await db.select().from(schema.wallets).where(eq(schema.wallets.id, a.walletId)) : [];
  const events = await db.select().from(schema.paymentEvents).where(eq(schema.paymentEvents.attemptId, a.id));
  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, a.orderId));

  const d = decideAttempt({
    expectedAtomic: parseAtomic(a.expectedAmount, spec.decimals),
    txs: events.map((e) => ({ sats: parseAtomic(e.amount, spec.decimals), confirmations: e.confirmations, seenAtMs: e.seenAt.getTime() })),
    confirmationsNeeded: confirmationsNeeded(a.coin, opt.chain, item?.priceUsdCents ?? order.totalUsdCents, wallet?.minConfirmations ?? 1),
    expiresAtMs: a.expiresAt.getTime(),
    nowMs: now,
    orderStatus: order.status,
  });
  if (d.action === "none") return false;

  const flip = async (to: typeof order.status, from: (typeof order.status)[], extra: Partial<typeof schema.orders.$inferInsert> = {}) => {
    const r = await db.update(schema.orders).set({ status: to, ...extra }).where(and(eq(schema.orders.id, order.id), inArray(schema.orders.status, from))).returning({ id: schema.orders.id });
    return r.length > 0; // false = someone else already did it: do not notify twice
  };
  const attemptTo = (s: "expired" | "paid" | "partial" | "late") => db.update(schema.paymentAttempts).set({ status: s }).where(eq(schema.paymentAttempts.id, a.id));
  const amt = (n: bigint) => `${formatAtomic(n, spec.decimals)} ${a.coin}`;

  if (d.action === "expire") {
    if (await flip("expired", ["pending"])) { await attemptTo("expired"); return true; }
  } else if (d.action === "paid") {
    if (await flip("paid", ["pending", "partial", "late_payment"], { paidAt: new Date(now) })) {
      await attemptTo("paid");
      await notifyOwner(env, "Payment confirmed", `Order ${order.id} paid: received ${amt(d.receivedAtomic)}.${d.overpaidAtomic > 0n ? ` OVERPAID by ${amt(d.overpaidAtomic)}: refund or credit needed.` : ""}`);
      return true;
    }
  } else if (d.action === "partial") {
    if (await flip("partial", ["pending"])) {
      await attemptTo("partial");
      await notifyOwner(env, "Partial payment", `Order ${order.id} received ${amt(d.receivedAtomic)}, still short by ${amt(d.remainingAtomic)}.`);
      return true;
    }
  } else if (d.action === "late") {
    if (await flip("late_payment", ["pending", "expired", "partial"])) {
      await attemptTo("late");
      await notifyOwner(env, "LATE payment needs a decision", `Order ${order.id} received ${amt(d.receivedAtomic)} after the quote expired. Decide: deliver, refund or ask the buyer.`);
      return true;
    }
  }
  return false;
}

function evmTestContract(env: CloudflareEnv, opt: PayOption): string | undefined {
  return opt.id === "USDT-ERC20" ? env.EVM_TEST_USDT : opt.id === "USDC-ERC20" ? env.EVM_TEST_USDC : undefined;
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
