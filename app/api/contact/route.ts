import { getDb, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { contactSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "contact", contactSchema, async (data, { env, waitUntil }) => {
    await getDb()
      .insert(schema.contactMessages)
      .values({ name: data.name ?? null, email: data.email, message: data.message });
    waitUntil(notifyOwner(env, "New contact message", "A new message is waiting in the contact_messages table."));
  });
}
