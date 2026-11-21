"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { clearImportedCache } from "@/lib/catalog-db";
import { getDbFromEnv, schema } from "@/lib/db";
import { listBatches, movesReady } from "@/lib/import/local-move";
import { applyGeneral, scanGeneral, type GScan } from "@/lib/import/reorganize";

const env = () => getCloudflareContext().env;
const db = () => getDbFromEnv(env());
const admin = async () => { try { return await requireAdmin(); } catch { return null; } };
const audit = (actor: string, detail: string) => db().insert(schema.settingsAuditLog).values({ category: "catalog-import", settingKey: "reorganize-general", oldValue: "", newValue: detail.slice(0, 500), actor }).catch(() => undefined);

export async function scanGeneralAction(): Promise<{ ok: boolean; message?: string; ready?: boolean; scan?: GScan; batches?: Awaited<ReturnType<typeof listBatches>> }> {
  if (!(await admin())) return { ok: false, message: "Your session ended. Sign in again." };
  const ready = await movesReady(db());
  return { ok: true, ready, scan: await scanGeneral(db()), batches: ready ? await listBatches(db()) : [] };
}

export async function applyGeneralAction(slugs: string[], includeReview: boolean): Promise<{ ok: boolean; message: string }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  if (!(await movesReady(db()))) return { ok: false, message: "Run migration 0040_category_moves.sql in D1 first." };
  const list = (Array.isArray(slugs) ? slugs : []).map((s) => ({ slug: String(s) })).slice(0, 3000);
  if (!list.length) return { ok: false, message: "Nothing selected." };
  const batch = `gt-${Date.now().toString(36)}`;
  try {
    const r = await applyGeneral(db(), list, { batch, includeReview: !!includeReview });
    await audit(a.email, `batch ${batch}: ${r.moved} moved, ${r.skipped} skipped`);
    await clearImportedCache(env()); revalidatePath("/admin/products", "layout"); revalidatePath("/lists", "layout");
    return { ok: true, message: `Batch ${batch}: ${r.moved} product(s) moved, ${r.skipped} skipped. Roll back from the batch list below if needed.` };
  } catch (e) { return { ok: false, message: `The move failed: ${e instanceof Error ? e.message.slice(0, 160) : "database error"}.` }; }
}
