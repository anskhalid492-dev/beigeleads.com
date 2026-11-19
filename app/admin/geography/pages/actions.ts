"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { cleanGeoContent, saveGeoContent } from "@/lib/geo/page-content";
import { geoPageList } from "@/lib/geo/store";

/** Saves owner-written SEO title, meta description and intro for ONE geography page. An empty form resets the page to generated copy. */
export async function saveGeoContentAction(form: FormData): Promise<void> {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const path = String(form.get("path") ?? "");
  const back = `/admin/geography/pages/edit?path=${encodeURIComponent(path)}`;
  const db = getDbFromEnv(getCloudflareContext().env);
  if (!(await geoPageList(db)).some((p) => p.path === path)) redirect("/admin/geography/pages");
  const { value, error } = cleanGeoContent({ seoTitle: form.get("seoTitle"), metaDescription: form.get("metaDescription"), intro: form.get("intro"), primaryKeyword: form.get("primaryKeyword"), secondaryKeywords: form.get("secondaryKeywords") });
  if (!value) redirect(`${back}&error=${encodeURIComponent(error ?? "Check the form.")}`);
  try { await saveGeoContent(db, path, value); } catch { redirect(`${back}&error=${encodeURIComponent("Could not save. Migration 0029 may not be applied yet.")}`); }
  await db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "geography", settingKey: `page:${path}`, newValue: "page copy saved" }).catch(() => {});
  revalidatePath("/admin/geography/pages");
  redirect(`${back}&saved=1`);
}
