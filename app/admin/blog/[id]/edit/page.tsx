import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { can } from "@/lib/admin/roles";
import { guardBlog } from "@/lib/admin/guard";
import { authorOptions } from "@/lib/blog/authors";
import { internalTargets } from "@/lib/blog/links";
import { getPostForEdit, postOptions, type PostStatus } from "@/lib/blog/posts";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { Editor, type EditorPost } from "./editor";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: PageProps<"/admin/blog/[id]/edit">) {
  const user = await guardBlog();
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const env = getCloudflareContext().env;
  const post = await getPostForEdit(env, id);
  if (!post) notFound();
  if (!can.editPost(user.role, post.row.status)) {
    return <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">This article is {post.row.status}. Editors can change drafts only; ask an admin to edit it. <Link className="underline" href="/admin/blog">Back to articles</Link></p>;
  }
  const [cats, tags, options, authors] = await Promise.all([listCategories(env), listTags(env), postOptions(env, id), authorOptions(env).catch(() => [])]);
  const r = post.row;
  const initial: EditorPost = {
    id, version: r.version, status: r.status as PostStatus, updatedAt: r.updatedAt.getTime(), publishedAt: r.publishedAt?.getTime() ?? null, doc: post.doc,
    fields: {
      title: r.title, slug: r.slug, excerpt: r.excerpt, categoryId: r.categoryId, author: r.author.includes("@") ? "" : r.author, authorId: r.authorId, featuredImage: r.featuredImage, featuredAlt: r.featuredAlt, featuredCaption: r.featuredCaption, featuredFocalX: r.featuredFocalX, featuredFocalY: r.featuredFocalY,
      seoTitle: r.seoTitle, metaDescription: r.metaDescription, canonicalUrl: r.canonicalUrl, noindex: r.noindex, ogTitle: r.ogTitle, ogDescription: r.ogDescription, ogImage: r.ogImage,
      focusKeyword: r.focusKeyword, related: JSON.parse(r.relatedJson || "[]") as number[], tagIds: post.tagIds, scheduledAt: r.scheduledAt?.getTime() ?? null,
    },
  };
  return <Editor role={user.role} post={initial} authors={authors} cats={cats.map((c) => ({ id: c.id, name: c.name }))} tags={tags.map((t) => ({ id: t.id, name: t.name }))} options={options} targets={internalTargets()} />;
}
