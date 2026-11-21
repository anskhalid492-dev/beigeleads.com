// What a customer may see and download from their order status page. The token alone shows status; results also need the order email.
import { and, eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { loadEvSettings } from "./settings";
import { LABEL, isStatus } from "./state";
import { filesOf, getEvByToken, markDelivered, resultsOpen, type EvRow } from "./store";
import { signFile } from "./token";

export type PublicOrder = { id: string; packageName: string; limit: number; status: string; statusLabel: string; submitted: number; createdAt: number; submittedAt: number | null; completedAt: number | null; resultsReady: boolean; resultsExpired: boolean; actionReason: string; fileCount: number };

export async function publicOrder(env: CloudflareEnv, token: string): Promise<{ ev: EvRow; view: PublicOrder } | null> {
  const ev = await getEvByToken(env, token);
  if (!ev) return null;
  const s = await loadEvSettings(env);
  const files = await filesOf(getDbFromEnv(env), ev.id);
  const results = files.filter((f) => f.kind === "result" && f.state === "accepted");
  const done = ev.status === "completed" || ev.status === "delivered";
  return { ev, view: {
    id: ev.id, packageName: ev.packageName, limit: ev.limitCount, status: ev.status, statusLabel: isStatus(ev.status) ? LABEL[ev.status] : ev.status, submitted: ev.submittedCount,
    createdAt: ev.createdAt, submittedAt: ev.submittedAt, completedAt: ev.completedAt, resultsReady: resultsOpen(ev, s) && results.length > 0, resultsExpired: done && !resultsOpen(ev, s), actionReason: ev.status === "needs_action" ? ev.actionReason : "", fileCount: results.length,
  } };
}

export async function customerDownload(env: CloudflareEnv, token: string, email: string, fileId?: string): Promise<{ ok: true; files: { id: string; name: string; size: number; url: string }[] } | { ok: false; error: string }> {
  const bad = { ok: false as const, error: "We could not confirm this order with that email address." };
  const ev = await getEvByToken(env, token);
  if (!ev || ev.email.trim().toLowerCase() !== email.trim().toLowerCase()) return bad;
  const s = await loadEvSettings(env);
  if (!resultsOpen(ev, s)) return { ok: false, error: ev.status === "completed" || ev.status === "delivered" ? "The download period for these results has ended. Contact support and quote your order number." : "Your results are not ready yet." };
  const db = getDbFromEnv(env);
  const rows = (await db.select().from(schema.evFiles).where(and(eq(schema.evFiles.evOrderId, ev.id), eq(schema.evFiles.kind, "result"), eq(schema.evFiles.state, "accepted")))).filter((f) => !fileId || f.id === fileId);
  if (rows.length === 0) return { ok: false, error: "No result file is available." };
  const files = [];
  for (const f of rows) { const sg = await signFile(env, f.id, 600); files.push({ id: f.id, name: f.filename, size: f.sizeBytes, url: `/api/ev/file/${f.id}?exp=${sg.exp}&sig=${sg.sig}` }); }
  return { ok: true, files };
}

export { markDelivered };
