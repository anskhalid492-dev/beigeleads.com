"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CATEGORIES, type CategoryId } from "@/lib/settings/registry";
import { SettingsError, saveCategory } from "@/lib/settings/service";

export type SaveResult = { ok: true; changed: number } | { ok: false; error: string; conflict?: boolean };

export async function saveSettingsAction(category: string, values: Record<string, string>, stamp: number): Promise<SaveResult> {
  try {
    const admin = await requireAdmin(); // Access + app login; blog editors are rejected
    if (!CATEGORIES.some((c) => c.id === category)) return { ok: false, error: "Unknown settings section." };
    const r = await saveCategory(getCloudflareContext().env, admin.email, category as CategoryId, values, Number(stamp) || 0);
    revalidatePath("/admin/settings", "layout");
    return { ok: true, changed: r.changed };
  } catch (e) {
    if (e instanceof SettingsError) return { ok: false, error: e.message, conflict: e.conflict };
    return { ok: false, error: "Could not save. Try again." };
  }
}
