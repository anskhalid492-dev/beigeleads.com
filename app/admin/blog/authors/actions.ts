"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { can } from "@/lib/admin/roles";
import { requireBlogUser } from "@/lib/admin/require-admin";
import { authorSchema, authorUsage, createAuthor, deleteAuthor, slugify, updateAuthor } from "@/lib/blog/authors";
import { BlogError } from "@/lib/blog/taxonomy";
import { getDbFromEnv, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Fail = { ok: false; error: string };
export type AuthorResult<T = object> = ({ ok: true } & T) | Fail;

async function admin() {
  const u = await requireBlogUser();
  if (!can.manageAuthors(u.role)) throw new BlogError("Only an admin can manage authors.");
  return u;
}

const fail = (e: unknown): Fail => {
  if (e instanceof BlogError) return { ok: false, error: e.message };
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Some fields are not valid." };
  console.error("author action failed:", e instanceof Error ? `${e.name}: ${e.message}` : "unknown");
  return { ok: false, error: "Something went wrong. Try again." };
};

const refresh = (slug?: string) => {
  revalidatePath("/admin/blog/authors");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/author/${slug}`);
};

export async function saveAuthorAction(id: number | null, input: unknown): Promise<AuthorResult<{ id: number }>> {
  try {
    const u = await admin();
    const { env } = getCloudflareContext();
    const data = authorSchema.parse(input);
    if (id) { await updateAuthor(env, u.email, id, data); refresh(data.slug); return { ok: true, id }; }
    const row = await createAuthor(env, u.email, data);
    refresh(data.slug);
    return { ok: true, id: row.id };
  } catch (e) { return fail(e); }
}

/** Used from the article editor: makes a DRAFT profile (name + title) so the article draft is not lost. It is completed and published later under Authors. */
export async function quickCreateAuthorAction(name: string, title: string): Promise<AuthorResult<{ author: { id: number; name: string; title: string; photo: string | null; status: "draft" | "published" } }>> {
  try {
    const u = await admin();
    const { env } = getCloudflareContext();
    const n = z.string().trim().min(2, "Enter the author's name.").max(120).parse(name);
    const t = z.string().trim().max(120).parse(title);
    const db = getDbFromEnv(env);
    const base = slugify(n) || "author";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const hit = await db.select({ id: schema.blogAuthors.id }).from(schema.blogAuthors).where(eq(schema.blogAuthors.slug, slug)).limit(1);
      if (!hit.length) break;
      slug = `${base}-${i}`;
    }
    const row = await createAuthor(env, u.email, {
      fullName: n, displayName: n, slug, title: t, email: "", shortBio: "", fullBio: "", expertise: [], company: "", location: "", photo: null,
      links: { linkedin: "", twitter: "", website: "", github: "", other: "" }, seoTitle: "", metaDescription: "", ogImage: null, canonicalUrl: "", noindex: false, status: "draft",
    });
    refresh();
    return { ok: true, author: { id: row.id, name: row.displayName, title: row.title, photo: null, status: "draft" } };
  } catch (e) { return fail(e); }
}

export async function authorUsageAction(id: number): Promise<AuthorResult<{ total: number; published: number; titles: string[] }>> {
  try {
    await admin();
    const u = await authorUsage(getCloudflareContext().env, id);
    return { ok: true, total: u.posts.length, published: u.published, titles: u.posts.slice(0, 8).map((p) => p.title || "Untitled") };
  } catch (e) { return fail(e); }
}

export async function deleteAuthorAction(id: number, reassignTo: number | null): Promise<AuthorResult> {
  try {
    await admin();
    await deleteAuthor(getCloudflareContext().env, id, reassignTo);
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
