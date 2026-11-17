"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";
import { requestLabel, sendConfirmation } from "@/lib/sample/requests";

const upd = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["queued", "in_progress", "fulfilled", "closed"]),
  note: z.string().trim().max(1000).optional(),
});

export async function updateSampleAction(form: FormData): Promise<void> {
  await requireAdmin();
  const p = upd.parse({ id: form.get("id"), status: form.get("status"), note: form.get("note") ?? undefined });
  await getDb().update(schema.sampleRequests)
    .set({ status: p.status, adminNote: p.note || null, updatedAt: Date.now() })
    .where(eq(schema.sampleRequests.id, p.id));
  revalidatePath("/admin/sample-requests");
}

/** Retry the confirmation email. Records the real result again; never marks "sent" unless Resend accepted it. */
export async function retrySampleEmailAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const db = getDb();
  const row = await db.query.sampleRequests.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
  if (!row) return;
  const { env } = getCloudflareContext();
  await sendConfirmation(db, env, (m) => sendEmail(env, m), id, row.email, requestLabel(row.productSlug, row.customRequest));
  revalidatePath("/admin/sample-requests");
}
