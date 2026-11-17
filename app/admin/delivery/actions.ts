"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProduct } from "@/lib/catalog";
import { deliverOrder } from "@/lib/delivery/deliver";
import { setDeliveryLink } from "@/lib/delivery/links";
import { notifyOwner } from "@/lib/forms/email";

export type ActionState = { ok: boolean; message: string } | null;

const linkSchema = z.object({ product: z.string().max(100), pkg: z.string().max(60), url: z.string().max(2000) });

export async function saveLinkAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const p = linkSchema.parse({ product: form.get("product"), pkg: form.get("pkg") ?? "", url: form.get("url") ?? "" });
    const product = getProduct(p.product);
    if (!product || (p.pkg !== "" && !product.packages.some((k) => k.name === p.pkg))) throw new Error("Unknown product or package.");
    const { env } = getCloudflareContext();
    const result = await setDeliveryLink(env, admin.email, p.product, p.pkg, p.url);
    // A changed link decides what buyers receive, so the owner is always told.
    await notifyOwner(env, "Delivery link changed", `${admin.email} ${result} the delivery link for ${p.product} / ${p.pkg || "all packages"}.`);
    revalidatePath("/admin/delivery");
    return { ok: true, message: result === "saved" ? "Saved." : "Removed." };
  } catch (e) {
    return { ok: false, message: e instanceof Error && e.message !== "forbidden" ? e.message : "Not allowed." };
  }
}

export async function resendAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("orderId"));
  await deliverOrder(getCloudflareContext().env, id, { force: true });
  revalidatePath("/admin/delivery");
}
