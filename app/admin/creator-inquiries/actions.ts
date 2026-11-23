"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { STATUSES } from "@/lib/creators/config";
import { sendCreatorConfirmation } from "@/lib/creators/submit";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";

const upd = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).optional(),
  assignedTo: z.string().trim().max(120).optional(),
});

export async function updateCreatorInquiryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const p = upd.parse({ id: form.get("id"), status: form.get("status"), note: form.get("note") ?? undefined, assignedTo: form.get("assignedTo") ?? undefined });
  await getDb().update(schema.creatorInquiries).set({ status: p.status, internalNote: p.note || null, assignedTo: p.assignedTo || null, updatedAt: Date.now() }).where(eq(schema.creatorInquiries.id, p.id));
  revalidatePath("/admin/creator-inquiries");
}

/** The ONLY way an inquiry becomes "responded": an admin confirms a real reply went to the customer. */
export async function recordCreatorResponseAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  if (form.get("confirm") !== "on") return;
  const db = getDb();
  const row = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.id, id)).limit(1))[0];
  if (!row || row.respondedAt != null) return;
  await db.update(schema.creatorInquiries).set({ respondedAt: Date.now(), status: row.status === "new" || row.status === "in_review" ? "contacted" : row.status, updatedAt: Date.now() }).where(eq(schema.creatorInquiries.id, id));
  revalidatePath("/admin/creator-inquiries");
}

export async function retryCreatorEmailAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const db = getDb();
  const row = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.id, id)).limit(1))[0];
  if (!row) return;
  const { env } = getCloudflareContext();
  await sendCreatorConfirmation(db, env, (m) => sendEmail(env, m), row);
  revalidatePath("/admin/creator-inquiries");
}
