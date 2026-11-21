// Custom quote requests for lists above the largest package. Saved first, then emailed; a failed email never discards the request.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { sha256Hex } from "@/lib/forms/hash";
import { notifyOwner, sendEmail } from "@/lib/forms/email";
import { loadEvSettings } from "./settings";

export const quoteSchema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  estimatedCount: z.string().trim().min(1, "Enter the estimated number of emails.").max(40),
  requirements: z.string().trim().max(2000).optional().default(""),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

const ref = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8)); return `VQ-${[...r].map((x) => a[x % a.length]).join("")}`; };

export async function submitQuote(env: CloudflareEnv, d: QuoteInput): Promise<{ reference: string; duplicate: boolean }> {
  const db = getDbFromEnv(env);
  const key = await sha256Hex(`vq|${d.email}|${d.estimatedCount}|${d.requirements.slice(0, 200)}`);
  const [prev] = await db.select({ reference: schema.evQuotes.reference }).from(schema.evQuotes).where(eq(schema.evQuotes.dedupeKey, key)).limit(1);
  if (prev) return { reference: prev.reference, duplicate: true };
  const reference = ref();
  await db.insert(schema.evQuotes).values({ reference, name: d.name, email: d.email, estimatedCount: d.estimatedCount, requirements: d.requirements, dedupeKey: key });
  const s = await loadEvSettings(env);
  const body = [`New email verification quote request ${reference}`, "", `Name: ${d.name}`, `Email: ${d.email}`, `Estimated emails: ${d.estimatedCount}`, `Requirements: ${d.requirements || "none"}`, "", "Open /admin/email-verification/quotes to manage it."].join("\n");
  let ok = false;
  try {
    if (s.quoteRecipient) ok = await sendEmail(env, { to: s.quoteRecipient, subject: `[BeigeLeads] Verification quote request ${reference}`, text: body });
    else { await notifyOwner(env, `Verification quote request ${reference}`, body, "contact"); ok = true; }
  } catch { ok = false; }
  await db.update(schema.evQuotes).set({ ownerNotify: ok ? "sent" : "failed" }).where(eq(schema.evQuotes.reference, reference));
  try {
    await sendEmail(env, { to: d.email, subject: "We received your custom verification quote request", text: `Hi ${d.name.split(" ")[0]},\n\nThanks for your request (reference ${reference}). Our team will review it and reply by email. We have not promised a price or a response time yet.\n\nBeigeLeads` });
  } catch { /* the request is saved */ }
  return { reference, duplicate: false };
}
