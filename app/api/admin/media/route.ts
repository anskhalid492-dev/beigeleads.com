import { getCloudflareContext } from "@opennextjs/cloudflare";
import { can } from "@/lib/admin/roles";
import { requireBlogUser } from "@/lib/admin/require-admin";
import { replaceUpload, saveUpload } from "@/lib/blog/media";
import { BlogError } from "@/lib/blog/taxonomy";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** Upload (or replace with ?replace=<id>). Admin only: Access + app session, and the request must come from our own origin. */
export async function POST(req: Request) {
  let admin;
  try { admin = await requireBlogUser(); } catch { return json({ error: "Not allowed." }, 403); }
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json({ error: "Not allowed." }, 403);
  const { env } = getCloudflareContext();
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return json({ error: "Choose an image." }, 400);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const replace = Number(new URL(req.url).searchParams.get("replace"));
    if (replace && !can.replaceMedia(admin.role)) return json({ error: "Only an admin can replace an image." }, 403);
    if (replace) { await replaceUpload(env, replace, { bytes }); return json({ ok: true }); }
    const originalId = Number(form.get("originalId")) || undefined;
    const m = await saveUpload(env, admin.email, { name: f.name, bytes }, { originalId });
    return json({ ok: true, media: { id: m.id, url: m.url, filename: m.filename, alt: m.alt, title: m.title, description: m.description, attribution: m.attribution, width: m.width, height: m.height } });
  } catch (e) {
    return json({ error: e instanceof BlogError ? e.message : "Upload failed. Try again." }, e instanceof BlogError ? 400 : 500);
  }
}
