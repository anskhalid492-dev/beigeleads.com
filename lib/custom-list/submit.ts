// Custom list requests: save first, then notify. A failed email never discards a saved request;
// the outcome of each email is stored so the admin can see it.
import { eq } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import { describeLocation, dedupeKey, newReference, type CustomListInput } from "./schema";

type Db = ReturnType<typeof getDbFromEnv>;
type Mailer = (mail: { to: string; subject: string; text: string }) => Promise<boolean>;
export type SubmitResult = { reference: string; duplicate: boolean; ownerNotify: "sent" | "failed"; customerEmail: "sent" | "failed" };

/** Plain text summary used in both emails. */
export function summaryLines(d: CustomListInput): string[] {
  const t = d.targeting;
  const extra = [["Company size", t.companySize], ["Specialization", t.specialization], ["Business type", t.businessType], ["Revenue range", t.revenue], ["Other criteria", t.other]].filter(([, v]) => v);
  return [
    `Industries: ${d.industries.join(", ")}`,
    `Audience: ${d.audience.length ? d.audience.join(", ") : "not stated"}`,
    `Job titles: ${d.jobTitles.length ? d.jobTitles.join(", ") : "not stated"}`,
    ...extra.map(([k, v]) => `${k}: ${v}`),
    `Locations: ${d.locations.map(describeLocation).join("; ")}`,
    ...(d.exclusions.length ? [`Exclude: ${d.exclusions.join(", ")}`] : []),
    `Fields: ${[...d.fields, ...d.customFields].join(", ") || "not stated"}`,
    `Quantity: ${d.quantity ? `${d.quantity.toLocaleString("en-US")}${d.quantityPlus ? "+" : ""}` : "not stated"}`,
    `Instructions: ${d.instructions || "none"}`,
  ];
}

export async function submitCustomList(db: Db, send: Mailer, ownerEmail: string | undefined, d: CustomListInput): Promise<SubmitResult> {
  const key = await dedupeKey(d);
  const existing = await db.select({ reference: schema.customListRequests.reference }).from(schema.customListRequests).where(eq(schema.customListRequests.dedupeKey, key)).limit(1);
  // Same person, same requirement: no second row and no second email.
  if (existing[0]?.reference) return { reference: existing[0].reference, duplicate: true, ownerNotify: "sent", customerEmail: "sent" };

  let reference = "";
  let id = 0;
  for (let i = 0; i < 5 && !id; i++) {
    reference = newReference();
    try {
      const [row] = await db.insert(schema.customListRequests).values({
        // Legacy columns stay filled so older screens and exports keep working.
        email: d.email,
        category: d.industries.join(", ").slice(0, 400),
        country: [...new Set(d.locations.map((l) => l.country))].join(", ").slice(0, 400),
        region: d.locations.flatMap((l) => [...l.regions, ...l.cities]).join(", ").slice(0, 400) || null,
        quantity: d.quantity ?? null,
        jobTitles: d.jobTitles.join(", ") || null,
        fieldsJson: JSON.stringify([...d.fields, ...d.customFields]),
        notes: [d.instructions, d.message].filter(Boolean).join("\n\n") || null,
        originalQuery: d.originalQuery || null,
        reference, name: d.name, company: d.company || null, audience: d.audience.join(", ") || null, dedupeKey: key,
        detailJson: JSON.stringify({
          industries: d.industries, audience: d.audience, jobTitles: d.jobTitles, targeting: d.targeting, locations: d.locations, exclusions: d.exclusions,
          fields: d.fields, customFields: d.customFields, quantity: d.quantity ?? null, quantityPlus: d.quantityPlus, instructions: d.instructions, message: d.message,
        }),
      }).returning({ id: schema.customListRequests.id });
      id = row.id;
    } catch (e) {
      // A reference collision is retried; a dedupe collision means a parallel identical submit won the race.
      const again = await db.select({ reference: schema.customListRequests.reference }).from(schema.customListRequests).where(eq(schema.customListRequests.dedupeKey, key)).limit(1);
      if (again[0]?.reference) return { reference: again[0].reference, duplicate: true, ownerNotify: "sent", customerEmail: "sent" };
      if (i === 4) throw e;
    }
  }

  const lines = summaryLines(d);
  let ownerNotify: "sent" | "failed" = "failed";
  if (ownerEmail) {
    try {
      ownerNotify = (await send({
        to: ownerEmail,
        subject: `[BeigeLeads] New custom list request ${reference}`,
        text: [`Reference: ${reference}`, `From: ${d.name}${d.company ? ` (${d.company})` : ""} <${d.email}>`, ...lines, `Message: ${d.message || "none"}`, `Original search: ${d.originalQuery || "none"}`].join("\n"),
      })) ? "sent" : "failed";
    } catch { ownerNotify = "failed"; }
  }
  let customerEmail: "sent" | "failed" = "failed";
  try {
    customerEmail = (await send({
      to: d.email,
      subject: `We received your custom list request (${reference})`,
      text: [
        `Hi ${d.name},`, "",
        `Thanks. We saved your custom list request. Your reference is ${reference}.`, "",
        "This is a request, not an order. Nothing has been charged and no price or availability has been promised yet. Our team will review your targeting requirements and contact you by email about availability and pricing.", "",
        "What you asked for:", ...lines.map((l) => `- ${l}`), "",
        "To change anything, use https://beigeleads.com/contact and mention your reference.", "", "BeigeLeads",
      ].join("\n"),
    })) ? "sent" : "failed";
  } catch { customerEmail = "failed"; }

  await db.update(schema.customListRequests).set({ ownerNotify, customerEmailStatus: customerEmail }).where(eq(schema.customListRequests.id, id));
  return { reference, duplicate: false, ownerNotify, customerEmail };
}
