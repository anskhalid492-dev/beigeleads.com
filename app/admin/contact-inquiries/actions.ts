"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendContactConfirmation } from "@/lib/contact/submit";
import { STATUSES } from "@/lib/contact/types";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";

const upd = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).optional(),
});

export async function updateInquiryAction(form: FormData): Promise<void> {
  await requireAdmin();
  const p = upd.parse({ id: form.get("id"), status: form.get("status"), note: form.get("note") ?? undefined });
  await getDb().update(schema.contactInquiries)
    .set({ status: p.status, internalNote: p.note || null, updatedAt: Date.now() })
    .where(eq(schema.contactInquiries.id, p.id));
  revalidatePath("/admin/contact-inquiries");
}

/** Retry the confirmation email. Records the real result; "sent" only when Resend accepted it. */
export async function retryInquiryEmailAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const db = getDb();
  const row = await db.query.contactInquiries.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
  if (!row) return;
  const { env } = getCloudflareContext();
  await sendContactConfirmation(db, env, (m) => sendEmail(env, m), row);
  revalidatePath("/admin/contact-inquiries");
}
