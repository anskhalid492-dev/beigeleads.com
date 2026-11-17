import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Serves blog images from R2. Only the blog/media/ prefix is reachable, never article bodies or drafts. */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (!/^[\w./-]+$/.test(rel) || rel.includes("..")) return new Response("Not found", { status: 404 });
  const { env } = getCloudflareContext();
  const obj = await env.LISTS.get(`blog/media/${rel}`);
  if (!obj) return new Response("Not found", { status: 404 });
  const type = obj.httpMetadata?.contentType ?? "application/octet-stream";
  if (!type.startsWith("image/")) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: { "content-type": type, "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" },
  });
}
