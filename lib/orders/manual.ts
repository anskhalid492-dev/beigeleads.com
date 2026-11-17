import { and, eq, inArray } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { deliverOrder } from "@/lib/delivery/deliver";
import { notifyOwner } from "@/lib/forms/email";

type Db = ReturnType<typeof getDbFromEnv>;

async function audit(db: Db, orderId: string, actor: string, action: string, detail?: string) {
  await db.insert(schema.orderAuditLog).values({ orderId, actor, action, detail: detail ?? null });
}

/**
 * Owner marks an order paid after checking the chain by hand (claim, late payment, fee-deducted payment).
 * Follows the state machine (an expired order goes through late_payment) and is guarded, so it cannot run twice.
 */
export async function markOrderPaid(env: CloudflareEnv, actor: string, orderId: string, detail: string): Promise<"paid" | "not-allowed"> {
  const db = getDbFromEnv(env);
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!o) return "not-allowed";
  if (o.status === "expired") {
    await db.update(schema.orders).set({ status: "late_payment" }).where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "expired")));
  }
  const r = await db.update(schema.orders).set({ status: "paid", paidAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, ["pending", "partial", "late_payment"])))
    .returning({ id: schema.orders.id });
  if (r.length === 0) return "not-allowed";
  await db.update(schema.paymentAttempts).set({ status: "paid" }).where(eq(schema.paymentAttempts.orderId, orderId));
  await audit(db, orderId, actor, "mark_paid", detail);
  await notifyOwner(env, "Order marked paid by hand", `${actor} marked order ${orderId} paid. ${detail}`);
  await deliverOrder(env, orderId);
  return "paid";
}

/** Records that the owner refunded (off-site). Only paid/partial/late orders can be marked. */
export async function markOrderRefunded(env: CloudflareEnv, actor: string, orderId: string, detail: string): Promise<"refunded" | "not-allowed"> {
  const db = getDbFromEnv(env);
  const r = await db.update(schema.orders).set({ status: "refunded" })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, ["partial", "late_payment", "paid"])))
    .returning({ id: schema.orders.id });
  if (r.length === 0) return "not-allowed";
  await audit(db, orderId, actor, "mark_refunded", detail);
  await notifyOwner(env, "Order marked refunded", `${actor} marked order ${orderId} refunded. ${detail}`);
  return "refunded";
}

export async function decideClaim(env: CloudflareEnv, actor: string, claimId: number, approve: boolean): Promise<void> {
  const db = getDbFromEnv(env);
  const [c] = await db.select().from(schema.paymentClaims).where(eq(schema.paymentClaims.id, claimId));
  if (!c || c.status !== "pending") return;
  if (approve) {
    const res = await markOrderPaid(env, actor, c.orderId, `Claim #${c.id} (tx ${c.txHash}) verified on the explorer.`);
    if (res !== "paid") return; // order not in a payable state: leave the claim pending for a human look
  }
  await db.update(schema.paymentClaims).set({ status: approve ? "approved" : "rejected" }).where(eq(schema.paymentClaims.id, claimId));
  await audit(db, c.orderId, actor, approve ? "claim_approved" : "claim_rejected", `claim #${c.id}`);
}
