import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { rewardSentForOrder } from "@/lib/sales/reward";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Read-only status for the checkout page poll. Reveals nothing beyond what the page already shows. */
export async function GET(_: Request, ctx: RouteContext<"/api/checkout/[orderId]/status">) {
  const { orderId } = await ctx.params;
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (!UUID.test(orderId)) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers });
  const db = getDb();
  const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!o) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers });
  const [a] = await db
    .select({ status: schema.paymentAttempts.status, expiresAt: schema.paymentAttempts.expiresAt })
    .from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)).orderBy(desc(schema.paymentAttempts.id)).limit(1);
  const reward = o.status === "paid" ? await rewardSentForOrder(db, orderId) : false;
  return new Response(JSON.stringify({ status: o.status, reward, attempt: a?.status ?? null, expiresAt: a ? a.expiresAt.getTime() : null }), { headers });
}
