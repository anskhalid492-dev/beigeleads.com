import { and, count, eq, gte } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { optionForWallet } from "@/lib/payments/options";

export const EVENTS = ["add_to_cart", "remove_from_cart", "view_cart", "begin_checkout"] as const;

/** Share of `to` out of `from` as a percentage, or null when there is nothing to divide by (never a made-up number). */
export const rate = (to: number, from: number): number | null => (from > 0 ? Math.round((to / from) * 1000) / 10 : null);

export type CartStats = {
  ready: boolean; days: number;
  events: Record<(typeof EVENTS)[number], number>;
  ordersCreated: number; paidReal: number; paidTest: number; multiItemOrders: number; itemsInOrders: number;
};

/** Real numbers only: anonymous cart counters from `cart_events` and orders from the orders tables. */
export async function cartStats(env: CloudflareEnv, days = 30): Promise<CartStats> {
  const db = getDbFromEnv(env);
  const since = new Date(Date.now() - days * 86_400_000);
  const out: CartStats = { ready: true, days, events: { add_to_cart: 0, remove_from_cart: 0, view_cart: 0, begin_checkout: 0 }, ordersCreated: 0, paidReal: 0, paidTest: 0, multiItemOrders: 0, itemsInOrders: 0 };
  try {
    const ev = await db.select({ event: schema.cartEvents.event, n: count() }).from(schema.cartEvents).where(gte(schema.cartEvents.createdAt, since)).groupBy(schema.cartEvents.event);
    for (const e of ev) if ((EVENTS as readonly string[]).includes(e.event)) out.events[e.event as (typeof EVENTS)[number]] = e.n;
  } catch { out.ready = false; }

  const [{ n }] = await db.select({ n: count() }).from(schema.orders).where(gte(schema.orders.createdAt, since));
  out.ordersCreated = n;
  const per = await db.select({ orderId: schema.orderItems.orderId, k: count() }).from(schema.orderItems).innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId)).where(gte(schema.orders.createdAt, since)).groupBy(schema.orderItems.orderId);
  out.multiItemOrders = per.filter((p) => p.k > 1).length;
  out.itemsInOrders = per.reduce((s, p) => s + p.k, 0);

  const paid = await db.select({ orderId: schema.paymentAttempts.orderId, coin: schema.paymentAttempts.coin, network: schema.paymentAttempts.network })
    .from(schema.paymentAttempts).innerJoin(schema.orders, eq(schema.orders.id, schema.paymentAttempts.orderId))
    .where(and(eq(schema.orders.status, "paid"), gte(schema.orders.createdAt, since)));
  const seen = new Set<string>();
  for (const a of paid) {
    if (seen.has(a.orderId)) continue;
    seen.add(a.orderId);
    const o = optionForWallet(a.coin, a.network);
    if (o && a.network === o.test) out.paidTest++; else out.paidReal++;
  }
  return out;
}

export async function purgeCartEvents(env: CloudflareEnv): Promise<void> {
  await env.DB.prepare("DELETE FROM cart_events WHERE created_at < unixepoch() - 7776000").run().catch(() => undefined); // 90 days
}
