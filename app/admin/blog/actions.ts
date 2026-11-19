"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { can, type BlogUser } from "@/lib/admin/roles";
import { requireBlogUser } from "@/lib/admin/require-admin";
import { createPost, deletePost, duplicatePost, getPost, restoreRevision, savePost, transition, type Action } from "@/lib/blog/posts";
import { deleteCategory, deleteTag, saveCategory, saveTag, BlogError } from "@/lib/blog/taxonomy";
import { deleteMedia, listMedia, mediaByUrl, mediaUsage, originalUrlOf, setAlt, setMediaMeta } from "@/lib/blog/media";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; conflict?: boolean };

const need = (ok: boolean) => { if (!ok) throw new BlogError("Only an admin can do this."); };
/** Editors may only change drafts. Admins may change anything. */
async function mayEdit(u: BlogUser, id: number) {
  const post = await getPost(getCloudflareContext().env, id);
  if (!post) throw new BlogError("Article not found.");
  need(can.editPost(u.role, post.status));
}

const fail = (e: unknown): { ok: false; error: string; conflict?: boolean } => {
  if (e instanceof BlogError) return e.message === "conflict" ? { ok: false, error: "A newer version of this article was saved elsewhere. Reload to see it before you save again.", conflict: true } : { ok: false, error: e.message };
  if (e instanceof z.ZodError) return { ok: false, error: "Some fields are not valid." };
  if (e instanceof Error && e.message === "forbidden") return { ok: false, error: "Not allowed." };
  // Admin-only screen: show the technical reason so a failing save can be diagnosed (no article text or personal data in it).
  const detail = e instanceof Error ? `${e.name}: ${e.message}`.replace(/\s+/g, " ").slice(0, 300) : "unknown error";
  console.error("blog action failed:", detail);
  return { ok: false, error: `Something went wrong. Try again. (${detail})` };
};

const inputSchema = z.object({
  title: z.string().max(300), slug: z.string().max(200), excerpt: z.string().max(1000), categoryId: z.number().int().nullable(), author: z.string().max(200), authorId: z.number().int().nullish().transform((v) => v ?? null),
  featuredImage: z.string().max(600).nullable(), featuredAlt: z.string().max(400), featuredCaption: z.string().max(400).default(""), featuredFocalX: z.number().min(0).max(100).default(50), featuredFocalY: z.number().min(0).max(100).default(50), seoTitle: z.string().max(300), metaDescription: z.string().max(600), canonicalUrl: z.string().max(2100), noindex: z.boolean(),
  ogTitle: z.string().max(300), ogDescription: z.string().max(600), ogImage: z.string().max(600).nullable(), focusKeyword: z.string().max(200),
  related: z.array(z.number().int()).max(10), tagIds: z.array(z.number().int()).max(30), scheduledAt: z.number().nullable(), doc: z.unknown(),
});

export async function saveAction(id: number, input: unknown, expectedVersion: number, kind: "autosave" | "manual"): Promise<Result<{ version: number; updatedAt: number }>> {
  try {
    const admin = await requireBlogUser();
    await mayEdit(admin, id);
    const r = await savePost(getCloudflareContext().env, admin.email, id, inputSchema.parse(input), expectedVersion, kind);
    return { ok: true, version: r.version, updatedAt: r.updatedAt };
  } catch (e) { return fail(e); }
}

export async function transitionAction(id: number, action: Action, at?: number | null): Promise<Result> {
  try {
    const admin = await requireBlogUser();
    need(can.publish(admin.role));
    z.enum(["publish", "schedule", "unpublish", "archive", "restore"]).parse(action);
    await transition(getCloudflareContext().env, admin.email, id, action, at);
    revalidatePath("/admin/blog"); revalidatePath("/blog");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function createAction(): Promise<void> {
  const admin = await requireBlogUser();
  const id = await createPost(getCloudflareContext().env, admin.email);
  redirect(`/admin/blog/${id}/edit`);
}

export async function duplicateAction(id: number): Promise<Result<{ id: number }>> {
  try {
    const admin = await requireBlogUser();
    const nid = await duplicatePost(getCloudflareContext().env, admin.email, id);
    revalidatePath("/admin/blog");
    return { ok: true, id: nid };
  } catch (e) { return fail(e); }
}

export async function bulkAction(ids: number[], action: "publish" | "archive" | "delete"): Promise<Result<{ done: number; failed: string[] }>> {
  try {
    const admin = await requireBlogUser();
    need(can.publish(admin.role));
    const list = z.array(z.number().int()).max(100).parse(ids);
    const env = getCloudflareContext().env;
    let done = 0; const failed: string[] = [];
    for (const id of list) {
      try {
        if (action === "delete") await deletePost(env, admin.email, id); else await transition(env, admin.email, id, action);
        done++;
      } catch (e) { failed.push(`#${id}: ${e instanceof BlogError ? e.message : "failed"}`); }
    }
    revalidatePath("/admin/blog"); revalidatePath("/blog");
    return { ok: true, done, failed };
  } catch (e) { return fail(e); }
}

export async function deleteAction(id: number): Promise<Result> {
  try {
    const admin = await requireBlogUser();
    need(can.delete(admin.role));
    await deletePost(getCloudflareContext().env, admin.email, id);
    revalidatePath("/admin/blog"); revalidatePath("/blog");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function restoreRevisionAction(postId: number, revisionId: number, expectedVersion: number): Promise<Result<{ version: number }>> {
  try {
    const admin = await requireBlogUser();
    await mayEdit(admin, postId);
    const r = await restoreRevision(getCloudflareContext().env, admin.email, postId, revisionId, expectedVersion);
    revalidatePath(`/admin/blog/${postId}/edit`); revalidatePath("/blog");
    return { ok: true, version: r.version };
  } catch (e) { return fail(e); }
}

// ----- categories, tags, media -----
export async function categoryAction(form: FormData): Promise<Result> {
  try {
    need(can.manageTaxonomy((await requireBlogUser()).role));
    const env = getCloudflareContext().env;
    const id = Number(form.get("id")) || undefined;
    if (String(form.get("intent")) === "delete" && id) await deleteCategory(env, id);
    else await saveCategory(env, { id, name: String(form.get("name") ?? ""), slug: String(form.get("slug") ?? ""), description: String(form.get("description") ?? ""), seoTitle: String(form.get("seoTitle") ?? ""), metaDescription: String(form.get("metaDescription") ?? "") });
    revalidatePath("/admin/blog/taxonomy"); revalidatePath("/blog");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function tagAction(form: FormData): Promise<Result> {
  try {
    need(can.manageTaxonomy((await requireBlogUser()).role));
    const env = getCloudflareContext().env;
    const id = Number(form.get("id")) || undefined;
    if (String(form.get("intent")) === "delete" && id) await deleteTag(env, id);
    else await saveTag(env, { id, name: String(form.get("name") ?? ""), slug: String(form.get("slug") ?? "") });
    revalidatePath("/admin/blog/taxonomy");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function mediaAltAction(id: number, alt: string): Promise<Result> {
  try { await requireBlogUser(); await setAlt(getCloudflareContext().env, id, alt); revalidatePath("/admin/media"); return { ok: true }; } catch (e) { return fail(e); }
}

const metaSchema = z.object({ alt: z.string().max(400).optional(), title: z.string().max(300).optional(), description: z.string().max(1500).optional(), attribution: z.string().max(400).optional() });
export type MediaInfo = { id: number; url: string; width: number | null; height: number | null; size: number; mime: string; filename: string; alt: string; title: string; description: string; attribution: string; originalUrl: string | null; originalId: number | null };

/** Library record for a /media/... path, so the editor can show and edit its title, description and credit. */
export async function mediaInfoAction(url: string): Promise<Result<{ info: MediaInfo | null }>> {
  try {
    await requireBlogUser();
    const env = getCloudflareContext().env;
    const m = await mediaByUrl(env, url);
    if (!m) return { ok: true, info: null };
    const originalUrl = m.originalId ? await originalUrlOf(env, m.originalId) : null;
    return { ok: true, info: { id: m.id, url: m.url, width: m.width, height: m.height, size: m.size, mime: m.mime, filename: m.filename, alt: m.alt, title: m.title, description: m.description, attribution: m.attribution, originalUrl, originalId: m.originalId } };
  } catch (e) { return fail(e); }
}

export async function mediaMetaAction(id: number, meta: unknown): Promise<Result> {
  try { await requireBlogUser(); await setMediaMeta(getCloudflareContext().env, id, metaSchema.parse(meta)); revalidatePath("/admin/media"); return { ok: true }; } catch (e) { return fail(e); }
}

export async function mediaDeleteAction(id: number, force: boolean): Promise<Result> {
  try { need(can.deleteMedia((await requireBlogUser()).role)); await deleteMedia(getCloudflareContext().env, id, force); revalidatePath("/admin/media"); return { ok: true }; } catch (e) { return fail(e); }
}

export async function listMediaAction(q: string, page: number): Promise<Result<{ items: { id: number; url: string; alt: string; filename: string; width: number | null; height: number | null }[]; total: number }>> {
  try {
    await requireBlogUser();
    const r = await listMedia(getCloudflareContext().env, { q: q.slice(0, 60), page: Math.max(1, Math.floor(page) || 1), per: 18 });
    return { ok: true, total: r.total, items: r.rows.map((m) => ({ id: m.id, url: m.url, alt: m.alt, filename: m.filename, width: m.width, height: m.height })) };
  } catch (e) { return fail(e); }
}

export async function mediaUsageAction(id: number): Promise<Result<{ posts: { id: number; title: string }[] }>> {
  try { await requireBlogUser(); return { ok: true, posts: await mediaUsage(getCloudflareContext().env, id) }; } catch (e) { return fail(e); }
}
