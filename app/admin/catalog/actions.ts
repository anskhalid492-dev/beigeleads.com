"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCountries } from "@/lib/catalog";
import { addConsumer, addCountry, addSubindustry, cleanConsumer, cleanCountry, cleanSubindustry, deleteConsumer, deleteCountry, deleteSubindustry, setCountryEnabled, updateConsumer, updateSubindustry } from "@/lib/catalog-extra";
import { getDbFromEnv, schema } from "@/lib/db";

const BASE = "/admin/catalog";
const back = (msg: string, kind: "error" | "saved" = "error"): never => redirect(`${BASE}?${kind}=${encodeURIComponent(msg)}`);

async function ctx() {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const db = getDbFromEnv(getCloudflareContext().env);
  const log = (key: string, v: string) => db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "catalog", settingKey: key, newValue: v }).catch(() => {});
  return { db, log };
}
const MIG = "Could not save. Migration 0030 may not be applied yet.";
const done = (m: string): never => { revalidatePath(BASE); revalidatePath("/shop"); return back(m, "saved"); };

export async function addCountryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const { value, error } = cleanCountry({ name: form.get("name"), code: form.get("code") }, getCountries().map((c) => c.slug));
  if (!value) return back(error ?? "Check the form.");
  try { await addCountry(db, value); } catch (e) { return back(/UNIQUE|constraint/i.test(String(e)) ? "That country already exists." : MIG); }
  await log(`country:${value.slug}`, "added");
  done(`${value.name} added. Import its places on the Geography page.`);
}
export async function toggleCountryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const slug = String(form.get("slug") ?? ""); const enabled = form.get("enable") === "1";
  try { await setCountryEnabled(db, slug, enabled); } catch { return back(MIG); }
  await log(`country:${slug}`, enabled ? "enabled" : "disabled");
  done(enabled ? "Country enabled." : "Country hidden. Its pages now return not found.");
}
export async function deleteCountryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const slug = String(form.get("slug") ?? "");
  let ok = false;
  try { ok = await deleteCountry(db, slug); } catch { return back(MIG); }
  if (!ok) return back("This country already has places or counts. Hide it instead of deleting it.");
  await log(`country:${slug}`, "deleted");
  done("Country deleted.");
}

export async function addSubindustryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const { value, error } = cleanSubindustry({ category: form.get("category"), name: form.get("name"), description: form.get("description") });
  if (!value) return back(error ?? "Check the form.");
  try { await addSubindustry(db, value); } catch (e) { return back(/UNIQUE|constraint/i.test(String(e)) ? "That sub-industry already exists in this industry." : MIG); }
  await log(`subindustry:${value.categorySlug}/${value.slug}`, "added");
  done("Sub-industry added.");
}
export async function updateSubindustryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const id = Number(form.get("id"));
  const c = cleanConsumer({ name: form.get("name"), description: form.get("description") });
  if (!Number.isInteger(id) || !c.value) return back(c.error ?? "Check the form.");
  try { await updateSubindustry(db, id, { name: c.value.name, description: c.value.description, enabled: form.get("enabled") === "on" }); } catch { return back(MIG); }
  await log(`subindustry:${id}`, "updated");
  done("Saved.");
}
export async function deleteSubindustryAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  try { await deleteSubindustry(db, id); } catch { return back(MIG); }
  await log(`subindustry:${id}`, "deleted");
  done("Deleted.");
}

export async function addConsumerAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const { value, error } = cleanConsumer({ name: form.get("name"), description: form.get("description") });
  if (!value) return back(error ?? "Check the form.");
  try { await addConsumer(db, value); } catch (e) { return back(/UNIQUE|constraint/i.test(String(e)) ? "That category already exists." : MIG); }
  await log(`consumer:${value.slug}`, "added (hidden)");
  done("Consumer category added. It stays hidden from the public shop.");
}
export async function updateConsumerAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const id = Number(form.get("id"));
  const c = cleanConsumer({ name: form.get("name"), description: form.get("description") });
  if (!Number.isInteger(id) || !c.value) return back(c.error ?? "Check the form.");
  try { await updateConsumer(db, id, { name: c.value.name, description: c.value.description, enabled: form.get("enabled") === "on" }); } catch { return back(MIG); }
  await log(`consumer:${id}`, "updated");
  done("Saved.");
}
export async function deleteConsumerAction(form: FormData): Promise<void> {
  const { db, log } = await ctx();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  try { await deleteConsumer(db, id); } catch { return back(MIG); }
  await log(`consumer:${id}`, "deleted");
  done("Deleted.");
}
