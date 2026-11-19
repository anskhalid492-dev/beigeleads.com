import { getDb } from "@/lib/db";
import { submitCustomList } from "@/lib/custom-list/submit";
import { sendEmail, ownerRecipients } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { customListSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "custom-list", customListSchema, async (data, { env }) => {
    const r = await submitCustomList(getDb(), (m) => sendEmail(env, m), await ownerRecipients(env, "custom_list"), data);
    return { reference: r.reference, emailed: r.customerEmail === "sent" };
  });
}
