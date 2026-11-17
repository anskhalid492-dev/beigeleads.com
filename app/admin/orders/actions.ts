"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { decideClaim, markOrderPaid, markOrderRefunded } from "@/lib/orders/manual";

const id = z.string().uuid();

// Every action re-checks the admin login. "confirm" must be ticked: these decisions move real money.
function confirmed(form: FormData) {
  if (form.get("confirm") !== "yes") throw new Error("Tick the box to confirm you checked the blockchain.");
}

export async function markPaidAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  confirmed(form);
  await markOrderPaid(getCloudflareContext().env, admin.email, id.parse(form.get("orderId")), "Verified by hand on the blockchain.");
  revalidatePath("/admin/orders");
}

export async function markRefundedAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  confirmed(form);
  await markOrderRefunded(getCloudflareContext().env, admin.email, id.parse(form.get("orderId")), "Refund or credit handled outside the site.");
  revalidatePath("/admin/orders");
}

export async function claimAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const approve = form.get("decision") === "approve";
  if (approve) confirmed(form);
  const claimId = z.coerce.number().int().positive().parse(form.get("claimId"));
  await decideClaim(getCloudflareContext().env, admin.email, claimId, approve);
  revalidatePath("/admin/orders");
}
