// Free-sample requests: save, dedupe, confirmation email with a REAL handoff result.
// "sent" is only recorded when Resend accepted the message. Samples themselves are fulfilled by the owner.
import { eq } from "drizzle-orm";
import { getCategory, getProduct } from "@/lib/catalog";
import { schema, type getDbFromEnv } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";

export type EmailStatus = "pending" | "sent" | "failed" | "not_configured";
export type SampleOutcome = { delivery: "sent" | "failed" | "not_configured" | "received"; label: string };

export const dedupeKey = (email: string, product?: string, custom?: string) =>
  `${email}|${product ? `product:${product}` : custom ? `custom:${custom.toLowerCase().replace(/\s+/g, " ").slice(0, 120)}` : "general"}`;

/** Name shown to the person and to the owner for what was asked. */
export function requestLabel(productSlug: string | null, custom: string | null): string {
  const p = productSlug ? getProduct(productSlug) : undefined;
  if (p) return p.title;
  return custom ? custom : "a general sample";
}

export type Db = ReturnType<typeof getDbFromEnv>;
type Mailer = (mail: { to: string; subject: string; text: string }) => Promise<boolean>;

export function confirmationMail(email: string, label: string) {
  return {
    to: email,
    subject: "We received your sample request",
    text: `Thanks. We have your request for a free sample of: ${label}.\n\nThis email only confirms that we received it. The sample is prepared by our team and sent to this address. You do not need to do anything else.\n\nA sample contains masked data only, so you can inspect the structure before you buy.\n\nBeigeLeads`,
  };
}

/** Sends the confirmation and records the real result on the row. Never throws. */
export async function sendConfirmation(
  db: Db,
  env: Pick<CloudflareEnv, "RESEND_API_KEY">,
  send: Mailer,
  id: number,
  email: string,
  label: string,
): Promise<EmailStatus> {
  let status: EmailStatus;
  let error: string | null = null;
  if (!env.RESEND_API_KEY) {
    status = "not_configured";
    error = "Email service is not configured.";
  } else {
    const ok = await send(confirmationMail(email, label));
    status = ok ? "sent" : "failed";
    if (!ok) error = "The email service did not accept the message.";
  }
  const row = await db.query.sampleRequests.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
  await db
    .update(schema.sampleRequests)
    .set({ emailStatus: status, emailError: error, attempts: (row?.attempts ?? 0) + 1, updatedAt: Date.now() })
    .where(eq(schema.sampleRequests.id, id));
  return status;
}

export async function submitSample(
  db: Db,
  env: CloudflareEnv,
  send: Mailer,
  data: { email: string; product?: string; custom?: string; category?: string },
): Promise<SampleOutcome & { created: boolean }> {
  const product = data.product ? getProduct(data.product) : undefined;
  // ?category=<slug> from category pages: use the category name as the custom text when no product is chosen.
  const cat = !product && data.category ? getCategory(data.category) : undefined;
  const custom = product ? null : (data.custom || cat?.name || data.category || "").trim() || null;
  if (!product && !custom) throw new Error("no-target");

  const productRow = product
    ? await db.query.products.findFirst({ where: (p, { eq: e }) => e(p.slug, product.slug) })
    : undefined;
  const key = dedupeKey(data.email, product?.slug, custom ?? undefined);

  const inserted = await db
    .insert(schema.sampleRequests)
    .values({
      email: data.email,
      productId: productRow?.id ?? null,
      productSlug: product?.slug ?? null,
      customRequest: custom,
      dedupeKey: key,
      updatedAt: Date.now(),
    })
    .onConflictDoNothing()
    .returning({ id: schema.sampleRequests.id });

  const label = requestLabel(product?.slug ?? null, custom);
  if (inserted.length === 0) {
    // Same email + same request: no second email, and the response does not reveal that it existed.
    return { created: false, delivery: "received", label };
  }
  const id = inserted[0].id;
  const status = await sendConfirmation(db, env, send, id, data.email, label);
  await notifyOwner(
    env,
    "New sample request",
    `List: ${product?.slug ?? "(custom)"}\nRequest: ${custom ?? "-"}\nConfirmation email: ${status}\nOpen /admin/sample-requests to fulfil it.`,
  );
  return { created: true, delivery: status === "pending" ? "received" : status, label };
}
