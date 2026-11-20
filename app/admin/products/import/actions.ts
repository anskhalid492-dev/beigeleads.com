"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { clearImportedCache } from "@/lib/catalog-db";
import { getDbFromEnv, schema } from "@/lib/db";
import { reservedSlugs } from "@/lib/import/reserved";
import { applyBatch, finishImport, importProductSchema, planBatch, rollbackImport, setStatus, startImport, importReady, type DupPolicy, type PlanItem } from "@/lib/import/store";

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
