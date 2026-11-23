// Creator inquiries: save first, then email. A failed email never discards a saved inquiry; the real result of each
// email is stored. Price is recomputed here from the quantity (the browser's estimate is never trusted).
import { eq } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import type { Mail } from "@/lib/forms/email";
import { SITE } from "@/lib/system-emails/brand";
import { systemMail } from "@/lib/system-emails/mail";
import { followerLabel, RESPONSE_HOURS } from "./config";
import { deadlineFor } from "./deadline";
import { estimateCents, formatEstimate } from "./pricing";
import type { CreatorInquiryInput } from "./schema";

type Db = ReturnType<typeof getDbFromEnv>;
type Mailer = (mail: Mail) => Promise<boolean>;
export type EmailStatus = "pending" | "sent" | "failed" | "not_configured";
export type CreatorOutcome = { reference: string; duplicate: boolean; delivery: "sent" | "failed" | "not_configured" | "received"; estimate: string };

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newCreatorReference(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(8))): string {
  return "CR-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
const norm = (s: string | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
export const creatorDedupeKey = (d: Pick<CreatorInquiryInput, "email" | "platforms" | "niche" | "country" | "followerRange" | "quantity" | "notes">) =>
  [d.email, [...d.platforms].sort().join(","), d.niche, d.country, d.followerRange, String(d.quantity), norm(d.notes).slice(0, 200)].map(norm).join("|");

type Row = { id: number; name: string; email: string; platforms: string; niche: string; country: string; followerRange: string; quantity: number; estimatedCents: number; reference: string; attempts: number };
const platformText = (json: string) => { try { return (JSON.parse(json) as string[]).join(", "); } catch { return json; } };
export const firstName = (n: string) => n.trim().split(/\s+/)[0] ?? "";

/** Customer confirmation text. The wording follows the approved brief; the HTML version is the editable "creator_inquiry_received" template. */
export function confirmationMail(r: Row): Mail {
  const est = formatEstimate(r.estimatedCents);
  return {
    to: r.email,
    subject: "We received your creator list inquiry — BeigeLeads",
    text: [
      `Hi ${firstName(r.name)},`, "",
      "Thanks for reaching out to BeigeLeads!", "",
      "We've received your custom creator database inquiry.", "",
      "Here is your request summary:", "",
      `Platforms: ${platformText(r.platforms)}`,
      `Creator Niche: ${r.niche}`,
      `Country/Region: ${r.country}`,
      `Follower Range: ${followerLabel(r.followerRange)}`,
      `Requested Contacts: ${r.quantity.toLocaleString("en-US")}`, "",
      `Estimated Price: ${est}`, "",
      `Our team will review your requirements and get back to you within ${RESPONSE_HOURS} hours.`, "",
      `Your Inquiry ID: ${r.reference}`, "",
      "The final quantity and pricing are subject to data availability and confirmation.", "",
      "Talk soon,", "The BeigeLeads Team",
    ].join("\n"),
    reference: r.reference,
  };
}

export async function sendCreatorConfirmation(db: Db, env: Pick<CloudflareEnv, "RESEND_API_KEY">, send: Mailer, r: Row): Promise<EmailStatus> {
  let status: EmailStatus; let error: string | null = null;
  if (!env.RESEND_API_KEY) { status = "not_configured"; error = "Email service is not configured."; }
  else {
    let ok = false;
    try {
      ok = await send(await systemMail(db, "creator_inquiry_received", r.email, {
        first_name: firstName(r.name), request_reference: r.reference, creator_platforms: platformText(r.platforms), creator_niche: r.niche,
        country: r.country, creator_followers: followerLabel(r.followerRange), quantity: r.quantity.toLocaleString("en-US"), estimated_price: formatEstimate(r.estimatedCents),
      }, confirmationMail(r), { reference: r.reference }));
    } catch { ok = false; }
    status = ok ? "sent" : "failed"; if (!ok) error = "The email service did not accept the message.";
  }
  await db.update(schema.creatorInquiries).set({ emailStatus: status, emailError: error, attempts: r.attempts + 1, updatedAt: Date.now() }).where(eq(schema.creatorInquiries.id, r.id));
  return status;
}

export function salesMail(r: Row & { company: string | null; language: string | null; audienceGeo: string | null; engagement: string | null; notes: string | null; respondBy: number; createdAt: number }, confirmation: EmailStatus) {
  const iso = (t: number) => new Date(t).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  return {
    subject: `New creator inquiry ${r.reference}: ${r.quantity.toLocaleString("en-US")} contacts, ${formatEstimate(r.estimatedCents)} est.`,
    text: [
      `Inquiry ID: ${r.reference}`,
      `Submitted: ${iso(r.createdAt)}`,
      `Reply due by: ${iso(r.respondBy)} (${RESPONSE_HOURS} hours)`, "",
      `Customer: ${r.name} <${r.email}>${r.company ? ` (${r.company})` : ""}`, "",
      `Platforms: ${platformText(r.platforms)}`,
      `Niche: ${r.niche}`,
      `Country/region: ${r.country}`,
      `Followers: ${followerLabel(r.followerRange)}`,
      `Contacts requested: ${r.quantity.toLocaleString("en-US")}`,
      `Estimated order value: ${formatEstimate(r.estimatedCents)}`,
      ...(r.language ? [`Creator language: ${r.language}`] : []),
      ...(r.audienceGeo ? [`Audience geography: ${r.audienceGeo}`] : []),
      ...(r.engagement ? [`Engagement: ${r.engagement}`] : []),
      ...(r.notes ? ["", "Notes:", r.notes] : []), "",
      `Confirmation email to the customer: ${confirmation}`,
      `Open in admin: ${SITE}/admin/creator-inquiries?q=${r.reference}`,
    ].join("\n"),
  };
}

export async function submitCreatorInquiry(
  db: Db, env: CloudflareEnv, send: Mailer,
  notify: (subject: string, text: string) => Promise<"sent" | "failed" | "skipped">,
  d: CreatorInquiryInput, now = Date.now(),
): Promise<CreatorOutcome> {
  const key = creatorDedupeKey(d);
  const estimatedCents = estimateCents(d.quantity);
  const est = formatEstimate(estimatedCents);
  const find = async () => (await db.select({ reference: schema.creatorInquiries.reference }).from(schema.creatorInquiries).where(eq(schema.creatorInquiries.dedupeKey, key)).limit(1))[0];

  // Same person, same request: no second row and no second email.
  const existing = await find();
  if (existing) return { reference: existing.reference, duplicate: true, delivery: "received", estimate: est };

  let id = 0; let reference = "";
  for (let i = 0; i < 5 && !id; i++) {
    reference = newCreatorReference();
    try {
      const [row] = await db.insert(schema.creatorInquiries).values({
        reference, name: d.name, email: d.email, company: d.company ?? null, platforms: JSON.stringify(d.platforms), niche: d.niche, country: d.country,
        followerRange: d.followerRange, quantity: d.quantity, language: d.language ?? null, audienceGeo: d.audienceGeo ?? null, engagement: d.engagement ?? null,
        notes: d.notes ?? null, estimatedCents, dedupeKey: key, respondBy: deadlineFor(now), createdAt: now, updatedAt: now,
      }).returning({ id: schema.creatorInquiries.id });
      id = row.id;
    } catch {
      const again = await find();
      if (again) return { reference: again.reference, duplicate: true, delivery: "received", estimate: est };
    }
  }
  if (!id) throw new Error("could-not-save");

  const row = { id, name: d.name, email: d.email, platforms: JSON.stringify(d.platforms), niche: d.niche, country: d.country, followerRange: d.followerRange, quantity: d.quantity, estimatedCents, reference, attempts: 0 };
  const status = await sendCreatorConfirmation(db, env, send, row);
  const m = salesMail({ ...row, company: d.company ?? null, language: d.language ?? null, audienceGeo: d.audienceGeo ?? null, engagement: d.engagement ?? null, notes: d.notes ?? null, respondBy: deadlineFor(now), createdAt: now }, status);
  let ownerNotify: "sent" | "failed" | "skipped" = "failed";
  try { ownerNotify = await notify(m.subject, m.text); } catch { ownerNotify = "failed"; }
  await db.update(schema.creatorInquiries).set({ ownerNotify }).where(eq(schema.creatorInquiries.id, id));
  return { reference, duplicate: false, delivery: status === "pending" ? "received" : status, estimate: est };
}
