import { getDb, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { customListSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "custom-list", customListSchema, async (data, { env, waitUntil }) => {
    await getDb()
      .insert(schema.customListRequests)
      .values({
        email: data.email,
        category: data.category,
        country: data.country,
        region: data.region || null,
        quantity: data.quantity ?? null,
        jobTitles: data.jobTitles || null,
        fieldsJson: JSON.stringify(data.fields),
        notes: data.notes || null,
        originalQuery: data.originalQuery || null,
      });
    waitUntil(
      notifyOwner(
        env,
        "New custom list request",
        [
          `Category: ${data.category}`,
          `Country: ${data.country}${data.region ? ` / ${data.region}` : ""}`,
          `Quantity: ${data.quantity ?? "not stated"}`,
          `Job titles: ${data.jobTitles || "not stated"}`,
          `Fields: ${data.fields.join(", ") || "not stated"}`,
          `Notes: ${data.notes || "none"}`,
          `Reply to: ${data.email}`,
        ].join("\n"),
      ),
    );
  });
}
