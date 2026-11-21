"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getDbFromEnv, schema } from "@/lib/db";
import { BundleError, bundleInput, clearBundleCache, createBundle, deleteBundle, deleteCategory, duplicateBundle, saveCategory, setBundleStatus, updateBundle } from "@/lib/bundles/store";
import { ctxOf } from "@/lib/bundles/public";
import { saveBuilderSettings } from "@/lib/bundles/settings";

type Res = { ok: true; message: string } | { ok: false; error: string };
const actor = async () => { try { return (await requireAdmin()).email; } catch { return null; } };
const audit = (who: string, key: string, what: string) => getDbFromEnv(getCloudflareContext().env).insert(schema.settingsAuditLog).values({ actor: who, category: "bundles", settingKey: key, newValue: what }).catch(() => {});
const MIGRATION = "Could not save. Run migration 0044_bundles.sql in D1 (one statement at a time) if you have not yet.";
const done = async () => { await clearBundleCache(getCloudflareContext().env); revalidatePath("/admin/bundles", "layout"); revalidatePath("/bundles", "layout"); };
const json = <T,>(raw: FormDataEntryValue | null, fallback: T): T => { try { return JSON.parse(String(raw ?? "")) as T; } catch { return fallback; } };

function read(f: FormData) {
  const g = (k: string) => (f.get(k) ?? "") as string;
  return bundleInput.safeParse({
    name: g("name"), slug: g("slug"), shortDescription: g("shortDescription"), description: g("description"), categorySlug: g("categorySlug"), label: g("label"), image: g("image"),
    items: json(f.get("items"), []), priceMode: g("priceMode") || "percent", discountPercent: g("discountPercent"), fixedPrice: g("fixedPrice"),
    featured: f.get("featured") === "on", status: g("status") || "draft", excluded: json(f.get("excluded"), []), seoTitle: g("seoTitle"), metaDescription: g("metaDescription"), sortOrder: g("sortOrder"),
  });
}

/** Create (no id) or update. A published bundle is checked against the live catalog; the real outcome is returned. */
export async function saveBundleAction(_: unknown, form: FormData): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const p = read(form);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the form and try again." };
  const env = getCloudflareContext().env;
  await hydrateCatalog(env, true);
  const db = getDbFromEnv(env);
  const rawId = String(form.get("id") ?? "");
  let created = 0;
  try {
    if (rawId) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id < 1) return { ok: false, error: "Invalid request." };
      await updateBundle(db, id, p.data, ctxOf(env));
      await audit(who, `bundle:${id}`, `updated (${p.data.status})`);
    } else {
      created = await createBundle(db, p.data, ctxOf(env));
      await audit(who, `bundle:${created}`, `created (${p.data.status})`);
    }
  } catch (e) { return { ok: false, error: e instanceof BundleError ? e.message : MIGRATION }; }
  await done();
  if (created) redirect(`/admin/bundles/${created}?created=1`);
  return { ok: true, message: p.data.status === "published" ? "Saved. The bundle is live." : "Saved." };
}

async function row(form: FormData, fn: (db: ReturnType<typeof getDbFromEnv>, id: number, who: string, env: CloudflareEnv) => Promise<string>): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { ok: false, error: "Invalid request." };
  const env = getCloudflareContext().env;
  await hydrateCatalog(env, true);
  try { const message = await fn(getDbFromEnv(env), id, who, env); await done(); return { ok: true, message }; }
  catch (e) { return { ok: false, error: e instanceof BundleError ? e.message : "Something went wrong. Try again." }; }
}
export async function statusAction(_: unknown, form: FormData): Promise<Res> {
  const s = String(form.get("status"));
  if (s !== "draft" && s !== "published") return { ok: false, error: "Invalid request." };
  return row(form, async (db, id, who, env) => { await setBundleStatus(db, id, s, ctxOf(env)); await audit(who, `bundle:${id}`, `status -> ${s}`); return s === "published" ? "Published. It is live within a minute." : "Unpublished. It disappears within a minute."; });
}
export async function duplicateAction(_: unknown, form: FormData): Promise<Res> {
  return row(form, async (db, id, who) => { const n = await duplicateBundle(db, id); await audit(who, `bundle:${n}`, `duplicated from ${id}`); return "Copied as a draft."; });
}
export async function deleteAction(_: unknown, form: FormData): Promise<Res> {
  return row(form, async (db, id, who) => { await deleteBundle(db, id); await audit(who, `bundle:${id}`, "deleted"); return "Deleted."; });
}

export async function saveCategoryAction(_: unknown, form: FormData): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const id = Number(form.get("id")) || undefined;
  try { await saveCategory(getDbFromEnv(getCloudflareContext().env), { name: form.get("name"), sortOrder: form.get("sortOrder") || 0 }, id); await audit(who, "bundle-category", `${id ? "renamed" : "added"} ${String(form.get("name"))}`); }
  catch (e) { return { ok: false, error: e instanceof BundleError ? e.message : MIGRATION }; }
  await done();
  return { ok: true, message: "Saved." };
}
export async function deleteCategoryAction(_: unknown, form: FormData): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  try { await deleteCategory(getDbFromEnv(getCloudflareContext().env), Number(form.get("id"))); await audit(who, "bundle-category", `deleted ${String(form.get("id"))}`); }
  catch (e) { return { ok: false, error: e instanceof BundleError ? e.message : "Could not delete." }; }
  await done();
  return { ok: true, message: "Deleted." };
}

export async function saveBuilderAction(_: unknown, form: FormData): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const r = await saveBuilderSettings(getCloudflareContext().env, { enabled: form.get("enabled") === "on", excluded: String(form.get("excluded") ?? "").split(/[\s,]+/).map((x) => x.trim()).filter(Boolean) }, who);
  if (!r.ok) return { ok: false, error: r.message };
  await done();
  return { ok: true, message: "Saved. The builder updates within a minute." };
}

export type PickProduct = { slug: string; name: string; category: string; packages: { name: string; priceCents: number; records: number }[] };
/** Admin product search for the bundle form (any catalog product, including drafts, so a bundle can be prepared before its lists are on sale). */
export async function searchProductsAction(q: string): Promise<PickProduct[]> {
  if (!(await actor())) return [];
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const { getProducts, getCategory, offeredPackages } = await import("@/lib/catalog");
  const t = String(q).toLowerCase().trim().slice(0, 80);
  const words = t.split(/\s+/).filter(Boolean);
  return getProducts()
    .filter((p) => offeredPackages(p).length > 0)
    .filter((p) => { const hay = `${p.name} ${p.slug} ${getCategory(p.categorySlug)?.name ?? ""}`.toLowerCase(); return words.every((w) => hay.includes(w)); })
    .slice(0, 15)
    .map((p) => ({ slug: p.slug, name: p.name, category: getCategory(p.categorySlug)?.name ?? "", packages: offeredPackages(p).map((k) => ({ name: k.name, priceCents: k.priceUsdCents, records: k.records })) }));
}
