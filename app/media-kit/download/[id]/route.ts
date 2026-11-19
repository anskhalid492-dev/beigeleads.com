import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublishedFile } from "@/lib/media-kit/store";

/** Public download of a PUBLISHED extra media-kit file. Always an attachment, never rendered in the browser. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
  const { env } = getCloudflareContext();
  const row = await getPublishedFile(env, id).catch(() => null);
  if (!row) return new Response("Not found", { status: 404 });
  const obj = await env.LISTS.get(row.r2Key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": row.contentType,
      "content-disposition": `attachment; filename="${row.filename}"`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
