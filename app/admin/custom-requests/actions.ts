"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";

// Stored values stay as they were (in_progress = Reviewing, done = Completed) so older records keep working.
const s = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["new", "in_progress", "quoted", "done", "declined"]),
  note: z.string().trim().max(4000).default(""),
});

export async function setRequestStatusAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const p = s.parse({ id: form.get("id"), status: form.get("status"), note: form.get("note") ?? "" });
  await getDb().insert(schema.customRequestStatus).values({ requestId: p.id, status: p.status, note: p.note, updatedBy: admin.email })
    .onConflictDoUpdate({ target: schema.customRequestStatus.requestId, set: { status: p.status, note: p.note, updatedBy: admin.email, updatedAt: new Date() } });
  revalidatePath("/admin/custom-requests");
}
