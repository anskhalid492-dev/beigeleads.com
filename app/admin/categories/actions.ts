"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCategories } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { catalogProductOptions, clearTaxCache, cleanNode, deleteNode, importBuiltIn, loadTaxonomyAdmin, moveNode, saveNode, setNodePublished } from "@/lib/taxonomy-store";

const BASE = "/admin/categories";
const back = (msg: string, kind: "error" | "saved" = "error", to = BASE): never => redirect(`${to}${to.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);

async function ctx() {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const env = getCloudflareContext().env;
  const db = getDbFromEnv(env);
  const log = (key: string, v: string) => db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "taxonomy", settingKey: key, newValue: v }).catch(() => {});
  return { env, db, log };
}
const MIG = "Could not save. Migration 0031 may not be applied yet.";
async function done(env: { CACHE: KVNamespace }, msg: string, to = BASE): Promise<never> {
  await clearTaxCache(env);
  for (const p of [BASE, "/lists", "/sitemap.xml"]) revalidatePath(p);
  return back(msg, "saved", to);
}

export async function importBuiltInAction(): Promise<void> {
  const { env, db, log } = await ctx();
  let n = 0;
  try { n = await importBuiltIn(db); } catch { return back(MIG); }
  await log("import", `${n} rows`);
  await done(env, n ? `Imported ${n} categories. You can edit them now.` : "Nothing new to import: the built-in categories are already here.");
}

const bool = (f: FormData, k: string) => f.get(k) === "on";
export async function saveNodeAction(form: FormData): Promise<void> {
  const { env, db, log } = await ctx();
  const idRaw = Number(form.get("id"));
  const id = Number.isInteger(idRaw) && idRaw > 0 ? idRaw : null;
  const s = (k: string) => String(form.get(k) ?? "");
  const own = `${BASE}/edit${id ? `?id=${id}` : s("parent") ? `?parent=${encodeURIComponent(s("parent"))}` : ""}`;
  const admin = await loadTaxonomyAdmin(db);
  if (!admin.ready) return back(MIG, "error", own);
  const tops = admin.rows.filter((r) => r.parentSlug === "").map((r) => r.slug);
  const existing = id ? admin.rows.find((r) => r.id === id) : undefined;
  if (id && !existing) return back("That category no longer exists.", "error", BASE);
  const { value, error } = cleanNode({
    id: id ?? undefined, parent: existing ? existing.parentSlug : s("parent"), slug: existing ? existing.slug : s("slug"), name: s("name"), menuName: s("menuName"), icon: s("icon"), short: s("short"), blurb: s("blurb"), status: s("status"), compliance: s("compliance"),
    featured: bool(form, "featured"), menuVisible: bool(form, "menuVisible"), published: bool(form, "published"), seoTitle: s("seoTitle"), metaDescription: s("metaDescription"), content: s("content"), products: form.getAll("products").map(String),
  }, { topSlugs: tops, isNew: !existing, productSlugs: catalogProductOptions().map((p) => p.slug), industrySlugs: getCategories().map((c) => c.slug) });
  if (!value) return back(error ?? "Check the form.", "error", own);
  if (!existing && admin.rows.some((r) => r.parentSlug === value.parentSlug && r.slug === value.slug)) return back("That URL name is already used in this category.", "error", own);
  try { await saveNode(db, id, value); } catch (e) { return back(/UNIQUE|constraint/i.test(String(e)) ? "That URL name is already used." : MIG, "error", own); }
  await log(`${value.parentSlug ? `${value.parentSlug}/` : ""}${value.slug}`, id ? "edited" : "created");
  await done(env, id ? "Saved." : "Category created.");
}

export async function togglePublishedAction(form: FormData): Promise<void> {
  const { env, db, log } = await ctx();
  const id = Number(form.get("id")); const on = form.get("on") === "1";
  try { await setNodePublished(db, id, on); } catch { return back(MIG); }
  await log(`node:${id}`, on ? "published" : "unpublished");
  await done(env, on ? "Published." : "Unpublished. Its page now returns not found and it is hidden from the menu and sitemap.");
}
export async function moveAction(form: FormData): Promise<void> {
  const { env, db, log } = await ctx();
  const id = Number(form.get("id")); const dir = form.get("dir") === "up" ? -1 : 1;
  try { await moveNode(db, id, dir); } catch { return back(MIG); }
  await log(`node:${id}`, dir < 0 ? "moved up" : "moved down");
  await done(env, "Order updated.");
}
export async function deleteNodeAction(form: FormData): Promise<void> {
  const { env, db, log } = await ctx();
  const id = Number(form.get("id"));
  if (form.get("confirm") !== "on") return back("Tick the box to confirm the delete.");
  let ok = false;
  try { ok = await deleteNode(db, id); } catch { return back(MIG); }
  if (!ok) return back("This category still has subcategories. Delete or move them first.");
  await log(`node:${id}`, "deleted");
  await done(env, "Deleted.");
}
