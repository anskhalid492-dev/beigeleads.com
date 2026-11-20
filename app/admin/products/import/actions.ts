"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { clearImportedCache } from "@/lib/catalog-db";
import { getDbFromEnv, schema } from "@/lib/db";
import { reservedSlugs } from "@/lib/import/reserved";
import { applyBatch, createProduct, duplicateProduct, finishImport, importBuiltin, listIds, newProductSchema, productEditSchema, setLastUpdated, updateProduct, importProductSchema, planBatch, rollbackImport, setStatus, startImport, importReady, type DupPolicy, type PlanItem } from "@/lib/import/store";

const env = () => getCloudflareContext().env;
const db = () => getDbFromEnv(env());
const admin = async () => { try { return await requireAdmin(); } catch { return null; } };
const policy = z.enum(["skip", "update", "separate"]);
const rows = z.array(importProductSchema).max(60);
const NOT_READY = "Run migration 0035_catalog_import.sql in D1 first (one statement at a time).";
const audit = (actor: string, detail: string) => db().insert(schema.settingsAuditLog).values({ category: "catalog-import", settingKey: "import", oldValue: "", newValue: detail.slice(0, 500), actor }).catch(() => undefined);
const refresh = async () => { await clearImportedCache(env()); revalidatePath("/admin/products", "layout"); };

/** Dry run: what would these products do against the live catalog? Writes nothing. */
export async function planAction(rowsIn: unknown, pol: unknown): Promise<{ ok: boolean; message?: string; items?: PlanItem[]; ready?: boolean }> {
  if (!(await admin())) return { ok: false, message: "Your session ended. Sign in again." };
  const r = rows.safeParse(rowsIn), p = policy.safeParse(pol);
  if (!r.success || !p.success) return { ok: false, message: `The batch was not valid: ${r.success ? "option" : r.error.issues[0].path.join(".") + " " + r.error.issues[0].message}.` };
  if (!(await importReady(db()))) return { ok: false, ready: false, message: NOT_READY };
  const { items } = await planBatch(db(), r.data, p.data as DupPolicy, reservedSlugs());
  return { ok: true, ready: true, items };
}

export async function startImportAction(filename: string, total: number): Promise<{ ok: boolean; importId?: number; message?: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  if (!(await importReady(db()))) return { ok: false, message: NOT_READY };
  let id: number;
  try { id = await startImport(db(), String(filename ?? "").slice(0, 200), Math.max(0, Math.min(5000, Number(total) || 0))); }
  catch (e) { return { ok: false, message: `The import table is not set up correctly (${e instanceof Error ? e.message.slice(0, 160) : "database error"}). Re-run migration 0035 statement 1 exactly as in drizzle/0035_catalog_import.sql.` }; }
  await audit(a.email, `import ${id} started (${filename}, ${total} products)`);
  return { ok: true, importId: id };
}

export async function importBatchAction(importId: number, rowsIn: unknown, pol: unknown): Promise<{ ok: boolean; message?: string; created?: number; updated?: number; skipped?: number; failed?: number; errors?: { sourceId: string; message: string }[] }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const r = rows.safeParse(rowsIn), p = policy.safeParse(pol);
  if (!r.success || !p.success || !Number.isInteger(importId)) return { ok: false, message: `The batch was not valid: ${r.success ? "option" : r.error.issues[0].path.join(".") + " " + r.error.issues[0].message}.` };
  try {
    const res = await applyBatch(db(), importId, r.data, p.data as DupPolicy, reservedSlugs(), a.email);
    return { ok: true, created: res.created, updated: res.updated, skipped: res.skipped, failed: res.failed, errors: res.errors };
  } catch { return { ok: false, message: "Could not save this batch. It is safe to run the import again: finished products are skipped." }; }
}

export async function finishImportAction(importId: number): Promise<void> {
  const a = await admin(); if (!a) return;
  await finishImport(db(), importId);
  await audit(a.email, `import ${importId} finished`);
  await refresh();
}

export async function rollbackAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || form.get("confirm") !== "1") return;
  const r = await rollbackImport(db(), id);
  await audit(a.email, `import ${id} rolled back: ${r.removed} removed, ${r.kept} kept (published or ordered)`);
  await refresh();
}

export async function bulkStatusAction(idsIn: unknown, to: unknown, allowRestricted: unknown = false): Promise<{ ok: boolean; message: string; refused?: { slug: string; reasons: string[] }[] }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const ids = z.array(z.number().int()).max(200).safeParse(idsIn), st = z.enum(["draft", "published", "archived"]).safeParse(to);
  if (!ids.success || !st.success || !ids.data.length) return { ok: false, message: "Select at least one product." };
  const override = allowRestricted === true;
  const r = await setStatus(db(), ids.data, st.data, { allowRestricted: override });
  await audit(a.email, `${r.changed} product(s) set to ${st.data}${r.refused.length ? `, ${r.refused.length} refused` : ""}${override && st.data === "published" ? " (restricted override ticked by the owner)" : ""}`);
  await refresh();
  return { ok: true, message: `${r.changed} product(s) set to ${st.data}.${r.refused.length ? ` ${r.refused.length} could not be published.` : ""}${r.noLink.length ? ` Warning: ${r.noLink.length} published without a delivery link yet. Add links in Delivery Links, because paid orders for them wait until a link exists.` : ""}`, refused: r.refused.slice(0, 50) };
}

/** Apply a status to EVERY product matching the admin's filters (all pages), in chunks. Same rules as bulkStatusAction. */
export async function bulkStatusByFilterAction(filtersIn: unknown, to: unknown, allowRestricted: unknown = false): Promise<{ ok: boolean; message: string; refused?: { slug: string; reasons: string[] }[] }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const f = z.object({ q: z.string().max(80).optional(), status: z.string().max(20).optional(), channel: z.string().max(40).optional(), restricted: z.enum(["yes", "no"]).optional(), flag: z.string().max(40).optional(), importId: z.number().int().optional() }).safeParse(filtersIn);
  const st = z.enum(["draft", "published", "archived"]).safeParse(to);
  if (!f.success || !st.success) return { ok: false, message: "Those filters were not valid." };
  const override = allowRestricted === true;
  const ids = await listIds(db(), f.data);
  if (!ids.length) return { ok: false, message: "No products match the filters." };
  let changed = 0; const refused: { slug: string; reasons: string[] }[] = []; const noLink: string[] = [];
  for (let i = 0; i < ids.length; i += 40) {
    const r = await setStatus(db(), ids.slice(i, i + 40), st.data, { allowRestricted: override });
    changed += r.changed; refused.push(...r.refused); noLink.push(...r.noLink);
  }
  await audit(a.email, `${changed} of ${ids.length} filtered product(s) set to ${st.data}${refused.length ? `, ${refused.length} refused` : ""}${override && st.data === "published" ? " (restricted override ticked by the owner)" : ""}`);
  await refresh();
  return { ok: true, message: `${changed} of ${ids.length} product(s) set to ${st.data}.${refused.length ? ` ${refused.length} could not be published (for example no price).` : ""}${noLink.length ? ` ${noLink.length} have no delivery link yet: add links in Delivery Links, paid orders wait until then.` : ""}`, refused: refused.slice(0, 50) };
}

export async function saveProductAction(id: unknown, dataIn: unknown): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const i = z.number().int().safeParse(id), d = productEditSchema.safeParse(dataIn);
  if (!i.success || !d.success) return { ok: false, message: `Not saved: ${d.success ? "bad product id" : d.error.issues[0].path.join(".") + " " + d.error.issues[0].message}.` };
  const r = await updateProduct(db(), i.data, d.data);
  if (r.ok) { await audit(a.email, `Edited product #${i.data} (${d.data.name})`); await refresh(); }
  return r;
}

export async function createProductAction(dataIn: unknown): Promise<{ ok: boolean; message: string; id?: number }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const d = newProductSchema.safeParse(dataIn);
  if (!d.success) return { ok: false, message: `Not saved: ${d.error.issues[0].path.join(".")} ${d.error.issues[0].message}.` };
  const r = await createProduct(db(), d.data);
  if (r.ok) { await audit(a.email, `Created product ${r.slug} (draft)`); await refresh(); }
  return r;
}

export async function duplicateProductAction(id: unknown): Promise<{ ok: boolean; message: string; id?: number }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const i = z.number().int().safeParse(id); if (!i.success) return { ok: false, message: "Bad product id." };
  const r = await duplicateProduct(db(), i.data);
  if (r.ok) { await audit(a.email, `Duplicated product #${i.data} as ${r.slug} (draft)`); await refresh(); }
  return r;
}

export async function importBuiltinAction(): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  try {
    const r = await importBuiltin(db());
    await audit(a.email, `Built-in products copied into the database: ${r.added} added, ${r.existing} already there`); await refresh();
    return { ok: true, message: `${r.added} built-in products added, ${r.existing} were already there.` };
  } catch { return { ok: false, message: "Could not copy. Run migration 0036 in D1 first (one statement at a time)." }; }
}

/** Set "Last updated" for the selected products, or for EVERY product matching the filters (all pages). Empty date clears it. */
export async function bulkLastUpdatedAction(target: unknown, dateIn: unknown): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const date = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use the format YYYY-MM-DD").safeParse(dateIn);
  const t = z.union([z.object({ ids: z.array(z.number().int()).max(200) }), z.object({ filters: z.object({ q: z.string().max(80).optional(), status: z.string().max(20).optional(), channel: z.string().max(40).optional(), restricted: z.enum(["yes", "no"]).optional(), flag: z.string().max(40).optional(), importId: z.number().int().optional() }) })]).safeParse(target);
  if (!date.success || !t.success) return { ok: false, message: "Enter the date as YYYY-MM-DD." };
  const ids = "ids" in t.data ? t.data.ids : await listIds(db(), t.data.filters, 5000);
  if (!ids.length) return { ok: false, message: "No products selected." };
  try {
    const n = await setLastUpdated(db(), ids, date.data);
    await audit(a.email, `Last updated set to ${date.data || "(empty)"} for ${n} product(s)`); await refresh();
    return { ok: true, message: `Last updated set to ${date.data || "empty"} on ${n} product(s). Published pages show it within about a minute.` };
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Could not save." }; }
}
