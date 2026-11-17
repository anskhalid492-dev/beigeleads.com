import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";

const claimSchema = z.object({
  orderId: z.string().uuid(),
  txHash: z.string().trim().regex(/^(0x)?[0-9a-fA-F]{16,128}$/, "Enter the transaction ID (hash) from your wallet or exchange."),
  note: z.string().trim().max(500).optional(),
  turnstileToken: z.string().min(1),
  website: z.string().optional(),
});

/** "I already paid" form. Only stores the claim and tells the owner; it never changes an order by itself. */
export async function POST(req: Request) {
  return handleForm(req, "claim", claimSchema, async (data, { env, waitUntil }) => {
    const db = getDb();
    const [o] = await db.select({ id: schema.orders.id, status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, data.orderId));
    if (!o || o.status === "paid" || o.status === "refunded") return; // same answer either way: nothing to leak
    const dup = await db.select({ id: schema.paymentClaims.id }).from(schema.paymentClaims).where(and(eq(schema.paymentClaims.orderId, o.id), eq(schema.paymentClaims.txHash, data.txHash)));
    if (dup.length > 0) return;
    await db.insert(schema.paymentClaims).values({ orderId: o.id, txHash: data.txHash, note: data.note ?? null }).onConflictDoNothing();
    waitUntil(notifyOwner(env, "Buyer says they paid", `Order ${o.id} (status ${o.status}): buyer submitted tx ${data.txHash}. Check it in /admin/orders.`));
  });
}
