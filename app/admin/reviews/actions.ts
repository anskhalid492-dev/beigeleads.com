"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadFollowups, saveFollowups } from "@/lib/followups/settings";
import { moderate } from "@/lib/followups/reviews";

const bool = (f: FormData, k: string) => f.get(k) === "on";

export async function saveFollowupSettingsAction(_prev: { ok: boolean; message: string } | null, f: FormData): Promise<{ ok: boolean; message: string }> {
  const a = await requireAdmin();
  const { env } = getCloudflareContext();
  const cur = await loadFollowups(env);
  const r = await saveFollowups(env, a.email ?? "admin", {
    reviewsOn: bool(f, "reviewsOn"), reviewDays: Number(f.get("reviewDays")), sampleOn: bool(f, "sampleOn"), sampleDays: Number(f.get("sampleDays")),
    showPublic: bool(f, "showPublic"), minToShow: Number(f.get("minToShow") ?? cur.minToShow),
  });
  if (!r.ok) return { ok: false, message: r.error };
  await env.CACHE.delete("reviews:pub:v1").catch(() => null);
  revalidatePath("/admin/reviews");
  return { ok: true, message: "Saved." };
}

export async function moderateReviewAction(f: FormData): Promise<void> {
  const a = await requireAdmin();
  const id = z.coerce.number().int().positive().parse(f.get("id"));
  const to = z.enum(["approved", "hidden"]).parse(f.get("to"));
  await moderate(getCloudflareContext().env, id, to, a.email ?? "admin");
  revalidatePath("/admin/reviews");
}
