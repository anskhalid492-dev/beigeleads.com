import { getDb, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { categoryRequestSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "category-request", categoryRequestSchema, async (data, { env, waitUntil }) => {
    await getDb()
      .insert(schema.categoryRequests)
      .values({ email: data.email, requestedCategory: data.requestedCategory, details: data.details ?? null });
    waitUntil(notifyOwner(env, "New category request", `Category: ${data.requestedCategory}`, "category"));
  });
}
