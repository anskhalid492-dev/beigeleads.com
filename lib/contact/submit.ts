// Contact inquiries: save first, then email. A failed email never discards a saved inquiry;
// the real result of each email is stored so the admin can see it.
import { eq } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import { inquiryLabel, isOrderType, type ContactInquiryInput } from "./types";

type Db = ReturnType<typeof getDbFromEnv>;
type Mailer = (mail: { to: string; subject: string; text: string }) => Promise<boolean>;
export type EmailStatus = "pending" | "sent" | "failed" | "not_configured";
export type ContactOutcome = { reference: string; duplicate: boolean; delivery: "sent" | "failed" | "not_configured" | "received" };

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newContactReference(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(8))): string {
  return "CT-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const contactDedupeKey = (d: Pick<ContactInquiryInput, "email" | "inquiryType" | "subject" | "message">) =>
  [d.email, d.inquiryType, d.subject, d.message.slice(0, 200)].map((x) => x.toLowerCase().replace(/\s+/g, " ").trim()).join("|");

export function confirmationMail(d: { name: string; email: string; inquiryType: string; subject: string }, reference: string) {
  const first = d.name.trim().split(/\s+/)[0];
  return {
    to: d.email,
    subject: `We received your message (${reference})`,
    text: [
      `Hi ${first},`, "",
      `Thanks for contacting BeigeLeads. We saved your message and our team will read it.`, "",
      `Reference: ${reference}`,
      `Topic: ${inquiryLabel(d.inquiryType)}`,
      `Subject: ${d.subject}`, "",
      `This email only confirms that we received your message. If you need to add something, reply to this email or write again at https://beigeleads.com/contact and mention your reference.`, "",
      `For quick answers about delivery, payments and policies, see https://beigeleads.com/help-center`, "",
      `BeigeLeads`,
    ].join("\n"),
  };
}

/** Sends the confirmation and records the real result. Never throws. */
export async function sendContactConfirmation(
  db: Db,
  env: Pick<CloudflareEnv, "RESEND_API_KEY">,
  send: Mailer,
  row: { id: number; name: string; email: string; inquiryType: string; subject: string; reference: string; attempts: number },
): Promise<EmailStatus> {
  let status: EmailStatus;
  let error: string | null = null;
  if (!env.RESEND_API_KEY) {
    status = "not_configured";
    error = "Email service is not configured.";
  } else {
    let ok = false;
    try { ok = await send(confirmationMail(row, row.reference)); } catch { ok = false; }
    status = ok ? "sent" : "failed";
    if (!ok) error = "The email service did not accept the message.";
  }
  await db.update(schema.contactInquiries)
    .set({ emailStatus: status, emailError: error, attempts: row.attempts + 1, updatedAt: Date.now() })
    .where(eq(schema.contactInquiries.id, row.id));
  return status;
}

export function ownerMail(d: ContactInquiryInput, reference: string, confirmation: EmailStatus) {
  return {
    subject: `New contact inquiry ${reference}: ${inquiryLabel(d.inquiryType)}`,
    text: [
      `Reference: ${reference}`,
      `From: ${d.name} <${d.email}>`,
      `Topic: ${inquiryLabel(d.inquiryType)}`,
      ...(isOrderType(d.inquiryType) && d.orderNumber ? [`Order number: ${d.orderNumber}`] : []),
      `Subject: ${d.subject}`, "",
      d.message, "",
      `Confirmation email to the sender: ${confirmation}`,
      `Manage it in /admin/contact-inquiries.`,
    ].join("\n"),
  };
}

export async function submitContact(
  db: Db,
  env: CloudflareEnv,
  send: Mailer,
  notify: (subject: string, text: string) => Promise<"sent" | "failed" | "skipped">,
  d: ContactInquiryInput,
): Promise<ContactOutcome> {
  const key = contactDedupeKey(d);
  const orderNumber = isOrderType(d.inquiryType) ? d.orderNumber || null : null;

  const find = async () =>
    (await db.select({ reference: schema.contactInquiries.reference }).from(schema.contactInquiries).where(eq(schema.contactInquiries.dedupeKey, key)).limit(1))[0];

  // Same person, same message: no second row, no second email, and the answer looks the same.
  const existing = await find();
  if (existing) return { reference: existing.reference, duplicate: true, delivery: "received" };

  let id = 0;
  let reference = "";
  for (let i = 0; i < 5 && !id; i++) {
    reference = newContactReference();
    try {
      const [row] = await db.insert(schema.contactInquiries).values({
        reference, name: d.name, email: d.email, inquiryType: d.inquiryType, orderNumber, subject: d.subject, message: d.message, dedupeKey: key, updatedAt: Date.now(),
      }).returning({ id: schema.contactInquiries.id });
      id = row.id;
    } catch {
      // A dedupe collision means a parallel identical submit won; a reference collision is retried.
      const again = await find();
      if (again) return { reference: again.reference, duplicate: true, delivery: "received" };
    }
  }
  if (!id) throw new Error("could-not-save");

  const status = await sendContactConfirmation(db, env, send, { id, name: d.name, email: d.email, inquiryType: d.inquiryType, subject: d.subject, reference, attempts: 0 });
  const m = ownerMail(d, reference, status);
  let ownerNotify: "sent" | "failed" | "skipped" = "failed";
  try { ownerNotify = await notify(m.subject, m.text); } catch { ownerNotify = "failed"; }
  await db.update(schema.contactInquiries).set({ ownerNotify }).where(eq(schema.contactInquiries.id, id));
  return { reference, duplicate: false, delivery: status === "pending" ? "received" : status };
}
