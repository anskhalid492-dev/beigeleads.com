// 15-minute cron: one "due soon" and one "overdue" internal email per inquiry. Each is CLAIMED first with a guarded
// UPDATE (WHERE ... IS NULL), so two overlapping runs can never send the same reminder twice.
import { and, eq, inArray, isNull, lte, gt } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { SITE } from "@/lib/system-emails/brand";
import { formatEstimate } from "./pricing";
import { REMINDER_BEFORE_MS } from "./config";

export async function sendCreatorReminders(env: CloudflareEnv, now = Date.now()): Promise<{ soon: number; overdue: number }> {
  let soon = 0, overdue = 0;
  try {
    const db = getDbFromEnv(env);
    const open = and(isNull(schema.creatorInquiries.respondedAt), inArray(schema.creatorInquiries.status, ["new", "in_review"]));
    const dueSoon = await db.select().from(schema.creatorInquiries).where(and(open, isNull(schema.creatorInquiries.reminderSentAt), gt(schema.creatorInquiries.respondBy, now), lte(schema.creatorInquiries.respondBy, now + REMINDER_BEFORE_MS)));
    for (const r of dueSoon) {
      const c = await db.update(schema.creatorInquiries).set({ reminderSentAt: now }).where(and(eq(schema.creatorInquiries.id, r.id), isNull(schema.creatorInquiries.reminderSentAt))).returning({ id: schema.creatorInquiries.id });
      if (!c.length) continue;
      soon++;
      await notifyOwner(env, `Creator inquiry ${r.reference} is due soon`, `Reply promised by ${new Date(r.respondBy).toISOString().slice(0, 16).replace("T", " ")} UTC.\n${r.quantity.toLocaleString("en-US")} contacts, ${formatEstimate(r.estimatedCents)} estimated.\n${SITE}/admin/creator-inquiries?q=${r.reference}`, "contact");
    }
    const late = await db.select().from(schema.creatorInquiries).where(and(open, isNull(schema.creatorInquiries.overdueSentAt), lte(schema.creatorInquiries.respondBy, now)));
    for (const r of late) {
      const c = await db.update(schema.creatorInquiries).set({ overdueSentAt: now }).where(and(eq(schema.creatorInquiries.id, r.id), isNull(schema.creatorInquiries.overdueSentAt))).returning({ id: schema.creatorInquiries.id });
      if (!c.length) continue;
      overdue++;
      await notifyOwner(env, `OVERDUE: creator inquiry ${r.reference}`, `The 12-hour reply promise has passed and no customer response is recorded.\n${r.quantity.toLocaleString("en-US")} contacts, ${formatEstimate(r.estimatedCents)} estimated.\n${SITE}/admin/creator-inquiries?q=${r.reference}`, "contact");
    }
  } catch { /* migration 0049 not applied */ }
  return { soon, overdue };
}
