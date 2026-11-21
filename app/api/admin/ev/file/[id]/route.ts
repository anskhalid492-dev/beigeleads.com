import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { log } from "@/lib/ev/store";

/** Admin download of a submitted list or an uploaded result. Streams from private R2; the download is logged. */
export async function GET(_: Request, ctx: RouteContext<"/api/admin/ev/file/[id]">) {
  let admin;
  try { admin = await requireAdmin(); } catch { return new Response("Not allowed", { status: 403 }); }
  const { id } = await ctx.params;
  const { env } = getCloudflareContext();
  const db = getDbFromEnv(env);
  const [f] = await db.select().from(schema.evFiles).where(eq(schema.evFiles.id, id));
  if (!f || f.deletedAt || f.state === "rejected") return new Response("Not found", { status: 404 });
  const obj = await env.LISTS.get(f.r2Key);
  if (!obj) return new Response("The file is no longer stored (retention).", { status: 404 });
  await log(db, f.evOrderId, admin.email, f.kind === "original" ? "original_downloaded" : "result_downloaded", f.filename);
  const name = f.filename.replace(/[^\w .()-]/g, "_") || "file";
  return new Response(obj.body, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store", "x-content-type-options": "nosniff", "content-length": String(obj.size) } });
}
