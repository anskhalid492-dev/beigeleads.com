import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { authorizeUpload, discardPending, finalizeFile } from "@/lib/ev/store";

const schema = z.object({ token: z.string().regex(/^[0-9a-f]{48}$/), fileId: z.string().uuid(), column: z.number().int().min(0).max(500).optional(), cancel: z.boolean().optional() });
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** The customer chose the email column of a spreadsheet that has several candidates (or cancelled the upload). */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, { ok: false, error: "Check the form and try again." });
  const { env } = getCloudflareContext();
  const ip = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "ev-column", ip, 60, 3600)) return json(429, { ok: false, error: "Too many attempts. Try again in a little while." });
  const gate = await authorizeUpload(env, p.data.token);
  if (!gate.ok) return json(gate.status, { ok: false, error: gate.error });
  if (p.data.cancel) { await discardPending(env, gate.ev.id, p.data.fileId); return json(200, { ok: true, cancelled: true }); }
  if (p.data.column === undefined) return json(400, { ok: false, error: "Choose the column that holds the email addresses." });
  const r = await finalizeFile(env, gate.ev, p.data.fileId, p.data.column);
  if (r.ok) return json(200, { ok: true, count: r.count, total: r.total, limit: r.limit, notes: r.notes });
  if ("needColumn" in r) return json(200, { ok: false, needColumn: r.needColumn, fileId: r.fileId });
  return json(422, { ok: false, error: r.error, over: r.over });
}
