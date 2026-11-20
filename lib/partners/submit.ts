// Partner applications: save first, then email. A failed email never discards an application.
import { and, eq, ne } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { cleanWebsite, type PartnerApplicationInput } from "./types";

type Db = ReturnType<typeof getDbFromEnv>;
export type PartnerOutcome = { reference: string; duplicate: boolean; email: "sent" | "failed" | "skipped" | "received" };

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const newPartnerReference = (bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(8))) => "PT-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");

/** One application per email + business: an identical re-submit never creates a second row or email. */
export const partnerDedupeKey = (d: Pick<PartnerApplicationInput, "email" | "businessName">) =>
  [d.email, d.businessName].map((x) => x.toLowerCase().replace(/\s+/g, " ").trim()).join("|");

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";

export function ownerMail(d: PartnerApplicationInput, reference: string) {
  return {
    subject: `New partner application ${reference}: ${d.businessName}`,
    text: [`Reference: ${reference}`, `From: ${d.fullName} <${d.email}>`, `Business: ${d.businessName}`, `Country: ${d.country}`, "", "Review it in /admin/partner-requests."].join("\n"),
  };
}

export async function submitPartnerApplication(
  db: Db,
  env: CloudflareEnv,
  notify: (subject: string, text: string) => Promise<"sent" | "failed" | "skipped">,
  d: PartnerApplicationInput,
): Promise<PartnerOutcome> {
  const key = partnerDedupeKey(d);

  // Duplicate detection: same email + business, OR any application from this email that is still open or approved.
  const findDup = async () => {
    const [byKey] = await db.select({ reference: schema.partnerApplications.reference }).from(schema.partnerApplications).where(eq(schema.partnerApplications.dedupeKey, key)).limit(1);
    if (byKey) return byKey;
    const [open] = await db.select({ reference: schema.partnerApplications.reference }).from(schema.partnerApplications)
      .where(and(eq(schema.partnerApplications.email, d.email), ne(schema.partnerApplications.status, "declined"))).limit(1);
    return open;
  };
  const dup = await findDup();
  if (dup) return { reference: dup.reference, duplicate: true, email: "received" };

  let id = 0;
  let reference = "";
  for (let i = 0; i < 5 && !id; i++) {
    reference = newPartnerReference();
    try {
      const [row] = await db.insert(schema.partnerApplications).values({
        reference, fullName: d.fullName, businessName: d.businessName, email: d.email, website: cleanWebsite(d.websiteUrl) ?? d.websiteUrl,
        country: d.country, businessType: d.businessType, resalePlan: d.resalePlan, monthlyVolume: d.monthlyVolume || null, notes: d.notes || null,
        termsAcceptedAt: Math.floor(Date.now() / 1000), dedupeKey: key, updatedAt: Date.now(),
      }).returning({ id: schema.partnerApplications.id });
      id = row.id;
    } catch {
      const again = await findDup(); // a parallel identical submit won, or only the reference collided (retry)
      if (again) return { reference: again.reference, duplicate: true, email: "received" };
    }
  }
  if (!id) throw new Error("could-not-save");

  const sent = await sendOnce(env, db, "partner_application_received", d.email, { first_name: firstName(d.fullName), business_name: d.businessName, request_reference: reference }, reference);
  const emailStatus = sent === "sent" || sent === "already-sent" ? "sent" : sent === "failed" ? "failed" : "skipped";
  const m = ownerMail(d, reference);
  let ownerNotify: "sent" | "failed" | "skipped" = "failed";
  try { ownerNotify = await notify(m.subject, m.text); } catch { ownerNotify = "failed"; }
  await db.update(schema.partnerApplications).set({ emailStatus, ownerNotify }).where(eq(schema.partnerApplications.id, id));
  return { reference, duplicate: false, email: emailStatus };
}
