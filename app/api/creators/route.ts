import { getDb } from "@/lib/db";
import { submitCreatorInquiry } from "@/lib/creators/submit";
import { creatorInquirySchema } from "@/lib/creators/schema";
import { ownerRecipients, sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";

export async function POST(req: Request) {
  return handleForm(req, "creators", creatorInquirySchema, async (data, { env }) => {
    // Saved first. The response says "saved" only after the row exists; email results are stored, never assumed.
    const out = await submitCreatorInquiry(
      getDb(), env, (m) => sendEmail(env, m),
      async (subject, text) => {
        const to = await ownerRecipients(env, "contact");
        if (!to) return "skipped";
        return (await sendEmail(env, { to, subject: `[BeigeLeads] ${subject}`, text })) ? "sent" : "failed";
      },
      data,
    );
    return { reference: out.reference, delivery: out.delivery, estimate: out.estimate };
  });
}
