import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MediaKitError, addFile, replaceFile } from "@/lib/media-kit/store";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** Upload an extra media-kit file (or replace one with ?replace=<id>). Admin only, same-origin only. */
export async function POST(req: Request) {
  let admin;
  try { admin = await requireAdmin(); } catch { return json({ error: "Not allowed." }, 403); }
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) return json({ error: "Not allowed." }, 403);
  const { env } = getCloudflareContext();
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return json({ error: "Choose a file." }, 400);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const replace = Number(new URL(req.url).searchParams.get("replace"));
    if (replace) { await replaceFile(env, admin.email, replace, { name: f.name, bytes }); return json({ ok: true }); }
    const file = await addFile(env, admin.email, { name: f.name, bytes }, { label: String(form.get("label") ?? ""), description: String(form.get("description") ?? "") });
    return json({ ok: true, id: file.id });
  } catch (e) {
    return json({ error: e instanceof MediaKitError ? e.message : "Upload failed. Check that migration 0018 has been run, then try again." }, e instanceof MediaKitError ? 400 : 500);
  }
}
