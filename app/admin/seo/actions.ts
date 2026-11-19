"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { saveSeoSettings } from "@/lib/seo/settings";

export async function saveSeoSettingsAction(input: { siteName: string; defaultDescription: string; defaultOgImage: string; twitterSite: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    await saveSeoSettings(getCloudflareContext().env, admin.email, input);
    revalidatePath("/admin/seo/settings");
    return { ok: true };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Some fields are not valid." };
    return { ok: false, error: "Could not save. Check that migration 0014 has been run, then try again." };
  }
}
