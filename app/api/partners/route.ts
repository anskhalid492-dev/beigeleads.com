import { getDb } from "@/lib/db";
import { ownerRecipients, sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { submitPartnerApplication } from "@/lib/partners/submit";
import { partnerApplicationSchema } from "@/lib/partners/types";

export async function POST(req: Request) {
  // handleForm: honeypot, validation, Turnstile, KV rate limit (5/hour/IP). Saved first; the answer states the real result.
  return handleForm(req, "partners", partnerApplicationSchema, async (data, { env }) => {
    const out = await submitPartnerApplication(getDb(), env, async (subject, text) => {
      const to = await ownerRecipients(env, "contact");
      if (!to) return "skipped";
      return (await sendEmail(env, { to, subject: `[BeigeLeads] ${subject}`, text })) ? "sent" : "failed";
    }, data);
    return { reference: out.reference, email: out.email };
  });
}
