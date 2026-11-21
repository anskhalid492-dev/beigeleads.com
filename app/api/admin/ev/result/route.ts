import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv } from "@/lib/db";
import { addResult, getEv, log, resultKey } from "@/lib/ev/store";
import { putStream, readHead } from "@/lib/ev/stream";

const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const MAX = 100 * 1024 * 1024; // Worker request body limit
const OK = /\.(csv|xlsx|txt|zip)$/i;

/** Admin uploads a finished result file for an order (private R2, streamed). The job is NOT completed here; completing is a separate, explicit action. */
export async function PUT(req: Request) {
  let admin;
  try { admin = await requireAdmin(); } catch { return json(403, { ok: false, error: "Not allowed." }); }
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const { env } = getCloudflareContext();
  const id = req.headers.get("x-ev-id") ?? "";
  const name = decodeURIComponent(req.headers.get("x-ev-name") ?? "").slice(0, 200);
  const size = Number(req.headers.get("content-length") ?? "0");
  if (!/^EV-[A-Z0-9]{8}$/.test(id)) return json(400, { ok: false, error: "Unknown order." });
  if (!OK.test(name)) return json(415, { ok: false, error: "Upload a CSV, XLSX, TXT or ZIP file." });
  if (!Number.isInteger(size) || size <= 0 || size > MAX || !req.body) return json(413, { ok: false, error: "The file is empty or larger than 100 MB." });
  const db = getDbFromEnv(env);
  const ev = await getEv(db, id);
  if (!ev) return json(404, { ok: false, error: "Order not found." });
  if (ev.status === "completed" || ev.status === "delivered" || ev.status === "cancelled" || ev.status === "refunded") return json(409, { ok: false, error: "This job is closed. Result files cannot be added." });
  const fileId = crypto.randomUUID();
  const body = await readHead(req.body);
  try { await putStream(env.LISTS, resultKey(id, fileId), size, body.head, body.rest, body.reader, body.done); } catch { await env.LISTS.delete(resultKey(id, fileId)).catch(() => undefined); return json(400, { ok: false, error: "The upload was interrupted. Try again." }); }
  await addResult(env, id, { fileId, filename: name, size });
  await log(db, id, admin.email, "result_uploaded", name);
  return json(200, { ok: true, id: fileId });
}
