import { and, eq, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner, sendEmail } from "@/lib/forms/email";
import { findDeliveryLink } from "./links";

const MAX_ATTEMPTS = 5;
const SITE = "https://beigeleads.com";

export function deliveryEmailText(i: { orderId: string; packageName: string; records: number; productName: string; url: string }): string {
  return [
    "Thank you for your order. Your payment is confirmed.",
    "",
    `Order: ${i.orderId}`,
    `List: ${i.productName}, ${i.packageName} package (${i.records.toLocaleString("en-US")} records)`,
    "",
    "Your download link:",
    i.url,
    "",
    "Permitted use: you may use this list for your own lawful business outreach. You must not use it for spam, fraud, harassment or unlawful processing, and you must not resell or publish it.",
    `Lawful use policy: ${SITE}/legal/lawful-use`,
    `Replacement and refund policy: ${SITE}/legal/refund-replacement`,
    `Opt-out requests (people who ask to be removed from our data): ${SITE}/opt-out`,
    "",
    "Keep this email as your receipt. If the link does not work, reply to this email or use the contact page and quote your order number.",
    "",
    "BeigeLeads",
  ].join("\n");
}

export type DeliverResult = "sent" | "already-sent" | "no-link" | "not-paid" | "failed" | "busy";

/**
 * Emails the owner-configured external link for a PAID order. Idempotent: the unique order_id row is claimed before
 * sending, so two cron runs can never send twice. A failed send is retried by the cron (max 5 attempts).
 */
export async function deliverOrder(env: CloudflareEnv, orderId: string, opts: { force?: boolean } = {}): Promise<DeliverResult> {
  const db = getDbFromEnv(env);
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order || order.status !== "paid") return "not-paid";
  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  if (!item) return "not-paid";

  const [existing] = await db.select().from(schema.deliveries).where(eq(schema.deliveries.orderId, orderId));
  if (existing?.status === "sent" && !opts.force) return "already-sent";
  if (existing && existing.status === "failed" && existing.attempts >= MAX_ATTEMPTS && !opts.force) return "failed";

  const url = await findDeliveryLink(env, item.productSlug, item.packageName);
  if (!url) {
    const key = `nolink:${orderId}`;
    if (!(await env.CACHE.get(key))) {
      await env.CACHE.put(key, "1", { expirationTtl: 24 * 3600 });
      await notifyOwner(env, "PAID order has no delivery link", `Order ${orderId} (${item.productSlug}, ${item.packageName}) is paid but no delivery link is set. Add one in /admin/delivery; it is sent automatically within a minute.`);
    }
    return "no-link";
  }

  // Claim the order. Only one runner can move a row into "sending".
  if (!existing) {
    const ins = await db.insert(schema.deliveries).values({ orderId, url, status: "sending", attempts: 1 }).onConflictDoNothing({ target: schema.deliveries.orderId }).returning({ id: schema.deliveries.id });
    if (ins.length === 0) return "busy";
  } else {
    const upd = await db.update(schema.deliveries)
      .set({ status: "sending", url, attempts: opts.force ? 1 : sql`${schema.deliveries.attempts} + 1` })
      .where(and(eq(schema.deliveries.orderId, orderId), eq(schema.deliveries.status, existing.status)))
      .returning({ id: schema.deliveries.id });
    if (upd.length === 0) return "busy";
  }

  const { getProduct } = await import("@/lib/catalog");
  const product = getProduct(item.productSlug);
  const ok = await sendEmail(env, {
    to: order.email,
    subject: `Your BeigeLeads list: ${product?.name ?? item.productSlug}`,
    text: deliveryEmailText({ orderId, packageName: item.packageName, records: item.records, productName: product?.name ?? item.productSlug, url }),
  });
  if (ok) {
    await db.update(schema.deliveries).set({ status: "sent", sentAt: new Date() }).where(eq(schema.deliveries.orderId, orderId));
    await notifyOwner(env, "List delivered", `Order ${orderId}: the delivery link was emailed to the buyer.`);
    return "sent";
  }
  await db.update(schema.deliveries).set({ status: "failed" }).where(eq(schema.deliveries.orderId, orderId));
  const [row] = await db.select({ a: schema.deliveries.attempts }).from(schema.deliveries).where(eq(schema.deliveries.orderId, orderId));
  if ((row?.a ?? 0) >= MAX_ATTEMPTS) await notifyOwner(env, "Delivery email FAILED", `Order ${orderId}: the delivery email failed ${MAX_ATTEMPTS} times. Resend it from /admin/delivery or contact the buyer.`);
  return "failed";
}

/** Cron helper: every paid order whose delivery is not sent yet (new, failed or waiting for a link). */
export async function deliverPendingOrders(env: CloudflareEnv): Promise<number> {
  const db = getDbFromEnv(env);
  const rows = await db.all<{ id: string }>(sql`
    SELECT o.id FROM orders o
    WHERE o.status = 'paid'
      AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.order_id = o.id AND (d.status = 'sent' OR d.status = 'sending' OR (d.status = 'failed' AND d.attempts >= ${MAX_ATTEMPTS})))
    ORDER BY o.paid_at LIMIT 20`);
  let sent = 0;
  for (const r of rows) if ((await deliverOrder(env, r.id)) === "sent") sent++;
  return sent;
}
