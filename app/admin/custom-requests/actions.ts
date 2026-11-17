"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";

const s = z.object({ id: z.coerce.number().int().positive(), status: z.enum(["new", "in_progress", "quoted", "done", "declined"]) });

export async function setRequestStatusAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const p = s.parse({ id: form.get("id"), status: form.get("status") });
  await getDb().insert(schema.customRequestStatus).values({ requestId: p.id, status: p.status, updatedBy: admin.email })
    .onConflictDoUpdate({ target: schema.customRequestStatus.requestId, set: { status: p.status, updatedBy: admin.email, updatedAt: new Date() } });
  revalidatePath("/admin/custom-requests");
}
