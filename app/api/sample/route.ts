import { getDb, schema } from "@/lib/db";
import { notifyOwner, sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { sampleSchema } from "@/lib/forms/schemas";
import { getProduct } from "@/lib/catalog";

export async function POST(req: Request) {
  return handleForm(req, "sample", sampleSchema, async (data, { env, waitUntil }) => {
    const db = getDb();
    // Only accept a product that exists; otherwise store a general request.
    const product = data.product ? getProduct(data.product) : undefined;
    const productRow = product
      ? await db.query.products.findFirst({ where: (p, { eq }) => eq(p.slug, product.slug) })
      : undefined;

    // Duplicate (same email + product) is ignored silently so the form never leaks who has asked.
    await db
      .insert(schema.sampleRequests)
      .values({ email: data.email, productId: productRow?.id ?? null })
      .onConflictDoNothing();

    const what = product ? product.title : data.category ? `${data.category} lists` : "your list";
    waitUntil(
      Promise.all([
        sendEmail(env, {
          to: data.email,
          subject: "We received your sample request",
          text: `Thanks. We have your request for a sample of ${what}.\n\nWe will email you when a sample is ready. You do not need to do anything else.\n\nBeigeLeads`,
        }),
        notifyOwner(env, "New sample request", `Product: ${product?.slug ?? "(general)"}\nCategory: ${data.category ?? "-"}`),
      ]),
    );
  });
}
