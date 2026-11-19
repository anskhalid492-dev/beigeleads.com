"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadCountries } from "@/lib/catalog-extra";
import { getDbFromEnv, schema } from "@/lib/db";
import { cleanKeyword, deleteKeyword, saveKeyword } from "@/lib/seo/keywords";

const fd = (f: FormData) => Object.fromEntries([...f.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

/** Adds or updates one keyword. On a problem the message is passed back in the URL (no client state needed). */
export async function saveKeywordAction(form: FormData): Promise<void> {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const f = fd(form);
  const extra = (await loadCountries(getDbFromEnv(getCloudflareContext().env))).map((c) => c.slug);
  const { value, error } = cleanKeyword({ keyword: f.keyword, intent: f.intent, targetType: f.targetType, targetPath: f.targetPath, category: f.category, country: f.country, place: f.place, status: f.status, notes: f.notes }, extra);
  if (!value) redirect(`/admin/seo/keywords?error=${encodeURIComponent(error ?? "Check the form.")}`);
  const id = Number(f.id) || null;
  const db = getDbFromEnv(getCloudflareContext().env);
  try { await saveKeyword(db, id, value); }
  catch (e) { redirect(`/admin/seo/keywords?error=${encodeURIComponent(/UNIQUE/i.test(String(e)) ? "That keyword already exists." : "Could not save. Migration 0029 may not be applied yet.")}`); }
  await db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "seo", settingKey: `keyword:${value.keyword}`, newValue: `${id ? "updated" : "added"} (${value.status}, ${value.targetPath || "no target"})` }).catch(() => {});
  revalidatePath("/admin/seo/keywords");
  redirect("/admin/seo/keywords?saved=1");
}

export async function deleteKeywordAction(form: FormData): Promise<void> {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const db = getDbFromEnv(getCloudflareContext().env);
  await deleteKeyword(db, id);
  await db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "seo", settingKey: `keyword:${id}`, newValue: "deleted" }).catch(() => {});
  revalidatePath("/admin/seo/keywords");
  redirect("/admin/seo/keywords");
}
