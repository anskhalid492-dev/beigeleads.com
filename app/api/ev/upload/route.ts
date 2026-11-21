import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { authorizeUpload, discardPending, finalizeFile, startUpload } from "@/lib/ev/store";
import { HEAD_BYTES, putStream, readHead } from "@/lib/ev/stream";

const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/**
 * Customer upload (file or pasted emails turned into a .txt). PUT with the raw file as the body; the secure token travels in a header
 * (never in the URL, so it stays out of logs). Order of checks: same origin, rate limit, confirmed payment + token, size and real file type,
 * stream into private R2, count, enforce the package limit. Nothing is silently truncated.
 */
export async function PUT(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const { env } = getCloudflareContext();
  const token = req.headers.get("x-ev-token") ?? "";
  if (!/^[0-9a-f]{48}$/.test(token)) return json(404, { ok: false, error: "This link is not valid." });
  const ip = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "ev-upload-ip", ip, 30, 3600) || await isRateLimited(env.CACHE, "ev-upload-token", await sha256Hex(token), 20, 3600)) return json(429, { ok: false, error: "Too many uploads. Try again in a little while." });
  const gate = await authorizeUpload(env, token);
  if (!gate.ok) return json(gate.status, { ok: false, error: gate.error });
  const size = Number(req.headers.get("content-length") ?? "0");
  const name = decodeURIComponent(req.headers.get("x-ev-name") ?? "").slice(0, 200) || "emails.txt";
  const source = req.headers.get("x-ev-source") === "paste" ? "paste" : "upload";
  if (!Number.isInteger(size) || size <= 0 || !req.body) return json(400, { ok: false, error: "The file is empty." });
  const body = await readHead(req.body);
  const start = await startUpload(env, gate.ev, { filename: name, source, size, head: body.head.subarray(0, Math.min(HEAD_BYTES, size)) });
  if (!start.ok) { await req.body.cancel().catch(() => undefined); return json(start.status, { ok: false, error: start.error }); }
  try {
    await putStream(env.LISTS, start.key, size, body.head, body.rest, body.reader, body.done, "application/octet-stream");
  } catch {
    await discardPending(env, gate.ev.id, start.fileId);
    return json(400, { ok: false, error: "The upload was interrupted or did not match its size. Please try again." });
  }
  const r = await finalizeFile(env, gate.ev, start.fileId);
  if (r.ok) return json(200, { ok: true, count: r.count, total: r.total, limit: r.limit, notes: r.notes });
  if ("needColumn" in r) return json(200, { ok: false, needColumn: r.needColumn, fileId: r.fileId });
  return json(422, { ok: false, error: r.error, over: r.over });
}
