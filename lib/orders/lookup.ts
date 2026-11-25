// Order lookup (section 170). A buyer enters the order number AND the email on the order. The answer is deliberately small:
// status, what was ordered, and whether the delivery email went out. Download links are NEVER shown here; "resend" emails them to the order email only.
import { z } from "zod";
import { getProduct } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { deliverOrder } from "@/lib/delivery/deliver";

type Env = CloudflareEnv;
export const lookupInput = z.object({
  orderId: z.string().trim().min(8, "Enter the order number from your email.").max(64).regex(/^[A-Za-z0-9_-]+$/, "Enter the order number from your email."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter the email you used at checkout.").max(254)),
  resend: z.boolean().optional(),
});
export type LookupView = {
  id: string; statusLabel: string; detail: string; created: number; items: string[]; deliverySent: boolean; canResend: boolean; payUrl: string | null;
};
export type LookupResult = { ok: true; order: LookupView; resent?: "sent" | "limit" | "failed" } | { ok: false };

export const STATUS: Record<string, { label: string; detail: string }> = {
  pending: { label: "Waiting for payment", detail: "We have not seen a confirmed payment yet. If you already paid, it can take a short while to confirm on the network." },
  paid: { label: "Paid", detail: "Your payment is confirmed." },
  expired: { label: "Quote expired", detail: "The price quote ran out before a payment arrived. You can start a new order from the list page." },
  partial: { label: "Partial payment", detail: "We saw a payment smaller than the amount due. Contact us with your order number and we will tell you the next step." },
  late_payment: { label: "Payment arrived late", detail: "A payment arrived after the quote expired. Our team reviews these by hand. Contact us with your order number." },
  refunded: { label: "Refunded", detail: "This order was refunded." },
};

export async function lookupOrder(env: Env, input: z.infer<typeof lookupInput>): Promise<LookupResult> {
  try {
    await hydrateCatalog(env);
    const o = await env.DB.prepare("SELECT id, email, status, created_at FROM orders WHERE id = ?").bind(input.orderId).first<{ id: string; email: string; status: string; created_at: number }>();
    // Same answer for "no such order" and "wrong email": nobody can probe which order numbers exist.
    if (!o || o.email.trim().toLowerCase() !== input.email) return { ok: false };
    const items = (await env.DB.prepare("SELECT product_slug, package_name FROM order_items WHERE order_id = ? ORDER BY id").bind(o.id).all<{ product_slug: string; package_name: string }>()).results;
    const names = items.map((i) => i.product_slug === "email-verification" ? "Email list verification" : i.product_slug.startsWith("dfy-") ? "DFY Outbound" : `${getProduct(i.product_slug)?.name ?? i.product_slug}${i.package_name ? ` (${i.package_name})` : ""}`);
    const d = await env.DB.prepare("SELECT status FROM deliveries WHERE order_id = ?").bind(o.id).first<{ status: string }>().catch(() => null);
    const sent = d?.status === "sent";
    const s = STATUS[o.status] ?? { label: "In review", detail: "Contact us with your order number." };
    const hasLists = items.some((i) => i.product_slug !== "email-verification" && !i.product_slug.startsWith("dfy-"));
    let detail = s.detail;
    if (o.status === "paid" && hasLists) detail += sent ? " The delivery email was sent to the address on the order. Check your spam folder if you cannot find it." : " Your delivery email is being prepared. Delivery is mostly instant and in some cases takes up to 12 hours.";
    return { ok: true, order: { id: o.id, statusLabel: s.label, detail, created: o.created_at, items: names, deliverySent: sent, canResend: o.status === "paid" && hasLists && sent, payUrl: o.status === "pending" ? `/checkout/${o.id}` : null } };
  } catch { return { ok: false }; }
}

/** Re-sends the delivery email to the address on the order. At most 2 per order per day (KV), and only for paid orders that were already delivered. */
export async function resendDelivery(env: Env, view: LookupView): Promise<"sent" | "limit" | "failed"> {
  if (!view.canResend) return "failed";
  const key = `ol:resend:${view.id}:${new Date().toISOString().slice(0, 10)}`;
  const n = Number((await env.CACHE.get(key)) ?? 0);
  if (n >= 2) return "limit";
  await env.CACHE.put(key, String(n + 1), { expirationTtl: 90_000 });
  const r = await deliverOrder(env, view.id, { force: true });
  return r === "sent" ? "sent" : "failed";
}
