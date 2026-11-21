"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { clearImportedCache } from "@/lib/catalog-db";
import { getDbFromEnv, schema } from "@/lib/db";
import { applyLocal, createUsLocalPages, listBatches, movesReady, rollbackLocal, scanLocal, type ScanItem } from "@/lib/import/local-move";

const env = () => getCloudflareContext().env;
const db = () => getDbFromEnv(env());
const admin = async () => { try { return await requireAdmin(); } catch { return null; } };
const NOT_READY = "Run migration 0040_category_moves.sql in D1 first.";
const audit = (actor: string, detail: string) => db().insert(schema.settingsAuditLog).values({ category: "catalog-import", settingKey: "local-businesses", oldValue: "", newValue: detail.slice(0, 500), actor }).catch(() => undefined);
const refresh = async () => { await clearImportedCache(env()); revalidatePath("/admin/products", "layout"); revalidatePath("/lists", "layout"); };

export async function scanLocalAction(): Promise<{ ok: boolean; message?: string; ready?: boolean; items?: ScanItem[]; totals?: { scanned: number; moves: number; review: number; keep: number; already: number; builtinNotInDb: number }; batches?: Awaited<ReturnType<typeof listBatches>> }> {
  if (!(await admin())) return { ok: false, message: "Your session ended. Sign in again." };
  const ready = await movesReady(db());
  const s = await scanLocal(db());
  return { ok: true, ready, items: s.items, totals: { scanned: s.scanned, moves: s.moves, review: s.review, keep: s.keep, already: s.already, builtinNotInDb: s.builtinNotInDb }, batches: ready ? await listBatches(db()) : [] };
}

export async function applyLocalAction(slugs: string[], copyBuiltin: boolean, allowReview: boolean): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  if (!(await movesReady(db()))) return { ok: false, message: NOT_READY };
  const list = (Array.isArray(slugs) ? slugs : []).map(String).slice(0, 2000);
  if (!list.length) return { ok: false, message: "Nothing selected." };
  const batch = `lb-${Date.now().toString(36)}`;
  try {
    const r = await applyLocal(db(), list, { batch, copyBuiltin: !!copyBuiltin, allowReview: !!allowReview });
    await audit(a.email, `batch ${batch}: ${r.moved} moved, ${r.skipped} skipped`);
    await refresh();
    return { ok: true, message: `Batch ${batch}: ${r.moved} product(s) moved, ${r.skipped} skipped. ${r.notes.join(" ")}` };
  } catch (e) { return { ok: false, message: `The move failed: ${e instanceof Error ? e.message.slice(0, 160) : "database error"}.` }; }
}

export async function rollbackLocalAction(batch: string): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  if (!(await movesReady(db()))) return { ok: false, message: NOT_READY };
  const n = await rollbackLocal(db(), String(batch).slice(0, 40));
  await audit(a.email, `batch ${batch} rolled back (${n} products)`);
  await refresh();
  return { ok: true, message: `${n} product(s) went back to their previous category.` };
}

export async function createUsPagesAction(offset = 0): Promise<{ ok: boolean; message: string; next?: number | null; total?: number; created?: number; existing?: number; failed?: number }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  try {
    const r = await createUsLocalPages(db(), { offset: Math.max(0, Math.floor(Number(offset) || 0)), limit: 25 });
    if (r.next === null || r.created) await audit(a.email, `US local pages batch from ${offset}: ${r.created} created, ${r.existing} existing, ${r.failed} failed`);
    if (r.next === null) await refresh();
    return { ok: true, message: "", next: r.next, total: r.total, created: r.created, existing: r.existing, failed: r.failed };
  } catch (e) { return { ok: false, message: `Creating the pages failed: ${e instanceof Error ? e.message.slice(0, 160) : "database error"}. Run migrations 0035 and 0036 first.` }; }
}
