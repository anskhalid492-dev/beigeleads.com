"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { notifyOwner } from "@/lib/forms/email";
import { getDbFromEnv, schema } from "@/lib/db";
import { applyLinks, type LinkOutcome } from "@/lib/delivery/bulk";

const rowSchema = z.object({ slug: z.string().max(160), pkg: z.string().max(60), url: z.string().max(2000) });
const admin = async () => { try { return await requireAdmin(); } catch { return null; } };

/** One batch of at most 100 rows. The server re-checks every row against the real product list. */
export async function bulkLinksAction(rowsIn: unknown, replace: unknown): Promise<{ ok: boolean; message?: string; outcomes?: LinkOutcome[] }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const r = z.array(rowSchema).max(100).safeParse(rowsIn);
  if (!r.success) return { ok: false, message: `The batch was not valid: ${r.error.issues[0].path.join(".")} ${r.error.issues[0].message}.` };
  const db = getDbFromEnv(getCloudflareContext().env);
  return { ok: true, outcomes: await applyLinks(db, a.email, r.data, replace === true) };
}

/** One audit row and ONE owner email for the whole upload (not one per link). */
export async function finishBulkLinksAction(summary: unknown): Promise<{ ok: boolean }> {
  const a = await admin(); if (!a) return { ok: false };
  const s = z.object({ added: z.number().int(), replaced: z.number().int(), skipped: z.number().int(), failed: z.number().int(), file: z.string().max(120) }).safeParse(summary);
  if (!s.success) return { ok: false };
  const { env } = getCloudflareContext();
  const detail = `Bulk delivery links (${s.data.file}): ${s.data.added} added, ${s.data.replaced} replaced, ${s.data.skipped} skipped, ${s.data.failed} failed`;
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ category: "delivery", settingKey: "bulk-links", oldValue: "", newValue: detail.slice(0, 500), actor: a.email }).catch(() => undefined);
  await notifyOwner(env, "Delivery links changed in bulk", `${a.email}: ${detail}.`);
  return { ok: true };
}
