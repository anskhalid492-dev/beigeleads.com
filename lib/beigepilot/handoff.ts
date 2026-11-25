import { emailConfigured } from "@/lib/email/credentials";
import { z } from "zod";
import { sendEmailDetailed, ownerRecipients } from "@/lib/forms/email";
import { redact } from "./history";
import { createLead, getLeadByReference, setLeadCustomerEmail, setLeadNotify, type Lead } from "./leads";
import { getSettings } from "./store";

export const handoffSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(2000),
  consent: z.literal("yes", { message: "Please tick the box so we may contact you." }),
  /** The visitor separately agreed to share a short summary of the chat with support. Without it no summary is stored or sent. */
  shareChat: z.enum(["yes", "no"]).optional(),
  summary: z.string().max(4000).optional(),
  page: z.string().trim().max(80).optional(),
  turnstileToken: z.string().min(1),
  website: z.string().optional(),
});

/** Short, redacted summary of the last few messages. Used only when the visitor ticked the share box. */
export function cleanSummary(raw: string | undefined): string {
  return (raw ?? "").split("\n").map((l) => redact(l.trim()).slice(0, 260)).filter(Boolean).slice(0, 8).join("\n").slice(0, 1800);
}

const ADMIN_LINK = "https://beigeleads.com/admin/beigepilot/leads";

/** Owner mail: exactly the fields support needs. The admin link has no customer data in it. */
export function supportMail(l: Pick<Lead, "reference" | "name" | "email" | "message" | "summary">): { subject: string; text: string } {
  return {
    subject: `New BeigePilot Support Request — ${l.reference}`,
    text: `Customer: ${l.name}\nEmail: ${l.email}\nTicket ID: ${l.reference}\n\nMessage:\n\n${l.message}\n\nConversation summary:\n\n${l.summary || "(not shared by the customer)"}\n\nSource: BeigePilot AI Assistant\n\nOpen the ticket in the admin dashboard (sign-in required): ${ADMIN_LINK}`,
  };
}

/** Customer acknowledgment. No response time is promised. `note` is the optional extra line the admin configured. */
export function ackMail(l: Pick<Lead, "reference" | "name">, note = ""): { subject: string; text: string } {
  return {
    subject: "We've Received Your BeigeLeads Support Request",
    text: `Hi ${l.name.split(/\s+/)[0]},\n\nThank you for contacting BeigeLeads.\n\nOur support team has received your request.\n\nYour reference number is:\n\n${l.reference}\n\nWe'll respond to your email as soon as possible.${note ? `\n\n${note}` : ""}\n\nThank you,\nBeigeLeads Support`,
  };
}

/** Sends the two emails. Safe to repeat: `only` limits it (used by the admin Retry). Results are stored; a failure never loses the ticket. */
export async function sendLeadEmails(env: CloudflareEnv, l: Lead, only?: "owner" | "customer"): Promise<{ owner: string; customer: string }> {
  const { s } = await getSettings(env);
  let owner = l.ownerNotify, customer = l.customerEmail;
  if (only !== "customer") {
    const to = s.sales.supportEmail || (await ownerRecipients(env, "contact"));
    if (!to) owner = "skipped";
    else { const m = supportMail(l); owner = (await sendEmailDetailed(env, { to, subject: m.subject, text: m.text, templateKey: "beigepilot_support_owner", reference: l.reference }).catch(() => ({ ok: false }))).ok ? "sent" : "failed"; }
    await setLeadNotify(env, l.reference, owner as "sent" | "failed" | "skipped");
  }
  if (only !== "owner") {
    const m = ackMail(l, s.sales.ackNote);
    customer = (await emailConfigured(env)) ? ((await sendEmailDetailed(env, { to: l.email, subject: m.subject, text: m.text, templateKey: "beigepilot_support_ack", reference: l.reference }).catch(() => ({ ok: false }))).ok ? "sent" : "failed") : "skipped";
    await setLeadCustomerEmail(env, l.reference, customer as "sent" | "failed" | "skipped");
  }
  return { owner, customer };
}

/** Saves first, then emails support and the customer. A repeat of the same message returns the same ticket and sends nothing again. */
export async function submitHandoff(env: CloudflareEnv, d: z.infer<typeof handoffSchema>): Promise<{ reference: string } | null> {
  const { s } = await getSettings(env);
  if (!s.sales.handoff) return null;
  const summary = d.shareChat === "yes" ? cleanSummary(d.summary) : "";
  const lead = await createLead(env, { name: d.name, email: d.email, message: d.message, page: d.page ?? "", consent: true, summary });
  if (!lead) return null;
  if (lead.duplicate) return { reference: lead.reference };
  const row = await getLeadByReference(env, lead.reference);
  if (row) await sendLeadEmails(env, row);
  return { reference: lead.reference };
}
