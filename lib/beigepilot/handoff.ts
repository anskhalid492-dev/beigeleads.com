import { z } from "zod";
import { ownerRecipients, sendEmail } from "@/lib/forms/email";
import { createLead, setLeadNotify } from "./leads";

export const handoffSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000),
  consent: z.literal("yes", { message: "Please tick the box so we may contact you." }),
  page: z.string().trim().max(80).optional(),
  turnstileToken: z.string().min(1),
  website: z.string().optional(),
});

/** Saves first, then emails the owner and the visitor. A failed email never loses the request. */
export async function submitHandoff(env: CloudflareEnv, d: z.infer<typeof handoffSchema>): Promise<{ reference: string } | null> {
  const lead = await createLead(env, { name: d.name, email: d.email, message: d.message, page: d.page ?? "", consent: true });
  if (!lead) return null;
  let notify: "sent" | "failed" | "skipped" = "skipped";
  const to = await ownerRecipients(env, "contact");
  if (to) {
    const ok = await sendEmail(env, { to, subject: `[BeigeLeads] Chat handoff ${lead.reference}`, text: `Name: ${d.name}\nEmail: ${d.email}\nPage: ${d.page ?? "-"}\n\n${d.message}\n\nThe visitor agreed to be contacted about this. Manage it at /admin/beigepilot/leads` }).catch(() => false);
    notify = ok ? "sent" : "failed";
  }
  await setLeadNotify(env, lead.reference, notify);
  if (env.RESEND_API_KEY) {
    await sendEmail(env, { to: d.email, subject: `We received your message (${lead.reference})`, text: `Hi ${d.name.split(/\s+/)[0]},\n\nThanks for reaching out through BeigePilot. Our team has your message and will read it.\n\nReference: ${lead.reference}\n\nThis email only confirms we received it. You can also find quick answers at https://beigeleads.com/help-center\n\nBeigeLeads`}).catch(() => false);
  }
  return lead;
}
