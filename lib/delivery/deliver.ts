import { hydrateCatalog } from "@/lib/catalog-db";
import { and, eq, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner, sendEmail } from "@/lib/forms/email";
import { systemMail } from "@/lib/system-emails/mail";
import { sendOnce } from "@/lib/system-emails/triggers";
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

export function deliveryEmailMultiText(i: { orderId: string; items: { productName: string; packageName: string; records: number; url: string; bundle?: string }[] }): string {
  return [
    "Thank you for your order. Your payment is confirmed.",
    "",
    `Order: ${i.orderId}`,
    `You bought ${i.items.length} lists. Each one has its own download link:`,
    "",
    ...i.items.flatMap((x, n) => [`${n + 1}. ${x.productName}, ${x.packageName} package${x.records > 0 ? ` (${x.records.toLocaleString("en-US")} records)` : ""}${x.bundle ? ` - part of the ${x.bundle} bundle` : ""}`, x.url, ""]),
    "Permitted use: you may use these lists for your own lawful business outreach. You must not use them for spam, fraud, harassment or unlawful processing, and you must not resell or publish them.",
    `Lawful use policy: ${SITE}/legal/lawful-use`,
    `Replacement and refund policy: ${SITE}/legal/refund-replacement`,
    `Opt-out requests (people who ask to be removed from our data): ${SITE}/opt-out`,
    "",
    "Keep this email as your receipt. If a link does not work, reply to this email or use the contact page and quote your order number.",
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
  await hydrateCatalog(env);
  const db = getDbFromEnv(env);
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order || order.status !== "paid") return "not-paid";
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).orderBy(schema.orderItems.id);
  const item = items[0];
  if (!item) return "not-paid";
  const multi = items.length > 1;

  const [existing] = await db.select().from(schema.deliveries).where(eq(schema.deliveries.orderId, orderId));
  if (existing?.status === "sent" && !opts.force) return "already-sent";
  if (existing && existing.status === "failed" && existing.attempts >= MAX_ATTEMPTS && !opts.force) return "failed";

  // "Payment received" note (template payment_received): once per order, never blocks delivery.
  try {
    const { getProduct: gp } = await import("@/lib/catalog");
    await sendOnce(env, db, "payment_received", order.email, { order_number: orderId, product_name: items.map((x) => gp(x.productSlug)?.name ?? x.productSlug).join(", "), order_url: `${SITE}/checkout/${orderId}` }, orderId);
  } catch { /* delivery must never depend on this note */ }
  // Second Purchase Offer: first paid order -> personal 50% code, emailed right away (idempotent, never blocks delivery).
  try { const { issueReward } = await import("@/lib/sales/reward"); await issueReward(env, orderId); } catch { /* the cron retries */ }
  // Team Purchase Request paid by a manager: mark it paid and tell both people (idempotent, never blocks delivery).
  try { const { onOrderPaid } = await import("@/lib/sales/team"); await onOrderPaid(env, orderId); } catch { /* idempotent: the next run tries again */ }

  // Every list in the order needs its own delivery link. If any is missing nothing is sent (the cron retries every minute).
  const links = await Promise.all(items.map((x) => findDeliveryLink(env, x.productSlug, x.packageName)));
  const missing = items.filter((_, n) => !links[n]);
  if (missing.length > 0) {
    const key = `nolink:${orderId}`;
    if (!(await env.CACHE.get(key))) {
      await env.CACHE.put(key, "1", { expirationTtl: 24 * 3600 });
      await notifyOwner(env, "PAID order has no delivery link", `Order ${orderId} (${missing.map((m) => `${m.productSlug}, ${m.packageName}`).join("; ")}) is paid but no delivery link is set. Add one in /admin/delivery; it is sent automatically within a minute.`);
    }
    return "no-link";
  }
  const url = multi ? links.join("\n") : (links[0] as string); // snapshot of what was sent

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

  // Lists bought inside a curated bundle are named in the email (a snapshot kept with the order; missing table = no bundles).
  const bundleOf = new Map<string, string>();
  try {
    for (const b of await db.select().from(schema.orderBundles).where(eq(schema.orderBundles.orderId, orderId))) {
      for (const x of JSON.parse(b.itemsJson) as { slug: string }[]) bundleOf.set(x.slug, b.bundleName);
    }
  } catch { /* orders without bundles never need this */ }
  const { getProduct } = await import("@/lib/catalog");
  const nameOf = (slug: string) => getProduct(slug)?.name ?? slug;
  let mail;
  if (multi) {
    // Several lists in one email: plain text (the branded template has one download link).
    mail = {
      to: order.email,
      subject: `Your BeigeLeads lists (${items.length})`,
      text: deliveryEmailMultiText({ orderId, items: items.map((x, n) => ({ productName: nameOf(x.productSlug), packageName: x.packageName, records: x.records, url: links[n] as string, bundle: bundleOf.get(x.productSlug) })) }),
    };
  } else {
    const productName = nameOf(item.productSlug);
    const legacy = {
      to: order.email,
      subject: `Your BeigeLeads list: ${productName}`,
      text: deliveryEmailText({ orderId, packageName: item.packageName, records: item.records, productName, url }),
    };
    // The branded template is used when it renders cleanly; otherwise the built-in text above is sent unchanged.
    mail = await systemMail(db, "product_delivery", order.email, { order_number: orderId, product_name: productName, package_name: item.packageName, records: item.records.toLocaleString("en-US"), download_url: url }, legacy, { reference: orderId });
  }
  const ok = await sendEmail(env, mail);
  if (ok) {
    await db.update(schema.deliveries).set({ status: "sent", sentAt: new Date() }).where(eq(schema.deliveries.orderId, orderId));
    await notifyOwner(env, "List delivered", `Order ${orderId}: the delivery link was emailed to the buyer.`, "delivered");
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
