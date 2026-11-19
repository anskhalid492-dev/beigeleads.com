import { getDb } from "@/lib/db";
import { ownerRecipients, sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { submitContact } from "@/lib/contact/submit";
import { contactInquirySchema } from "@/lib/contact/types";

export async function POST(req: Request) {
  return handleForm(req, "contact", contactInquirySchema, async (data, { env }) => {
    // Saved first; the confirmation is awaited so the response states the real handoff result.
    const out = await submitContact(
      getDb(),
      env,
      (m) => sendEmail(env, m),
      async (subject, text) => {
        const to = await ownerRecipients(env, "contact");
        if (!to) return "skipped";
        return (await sendEmail(env, { to, subject: `[BeigeLeads] ${subject}`, text })) ? "sent" : "failed";
      },
      data,
    );
    return { reference: out.reference, delivery: out.delivery };
  });
}
