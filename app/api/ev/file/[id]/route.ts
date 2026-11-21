import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { loadEvSettings } from "@/lib/ev/settings";
import { getEv, markDelivered, resultsOpen } from "@/lib/ev/store";
import { verifyFile } from "@/lib/ev/token";

const deny = (s = 403) => new Response("Not allowed", { status: s, headers: { "cache-control": "no-store" } });

/** Short-lived signed result download (the link comes from the order status page after the email check). Streams from private R2. */
export async function GET(req: Request, ctx: RouteContext<"/api/ev/file/[id]">) {
  const { id } = await ctx.params;
  const u = new URL(req.url);
  const { env } = getCloudflareContext();
  if (!(await verifyFile(env, id, Number(u.searchParams.get("exp")), u.searchParams.get("sig") ?? ""))) return deny();
  const db = getDbFromEnv(env);
  const [f] = await db.select().from(schema.evFiles).where(and(eq(schema.evFiles.id, id), eq(schema.evFiles.kind, "result"), eq(schema.evFiles.state, "accepted")));
  if (!f) return deny(404);
  const ev = await getEv(db, f.evOrderId);
  if (!ev || !resultsOpen(ev, await loadEvSettings(env))) return deny(410);
  const obj = await env.LISTS.get(f.r2Key);
  if (!obj) return deny(404);
  await markDelivered(env, ev);
  const name = f.filename.replace(/[^\w .()-]/g, "_") || "results";
  return new Response(obj.body, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store", "x-content-type-options": "nosniff", "content-length": String(obj.size) } });
}
