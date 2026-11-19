import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { can } from "@/lib/admin/roles";
import { guardBlog } from "@/lib/admin/guard";
import { authorOptions } from "@/lib/blog/authors";
import { internalTargets } from "@/lib/blog/links";
import { loadHelp } from "@/lib/help/store";
import { getPostForEdit, postOptions, type PostStatus } from "@/lib/blog/posts";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { Editor, type EditorPost } from "./editor";

export async function EditView({ params, pathIsGuide }: { params: Promise<{ id: string }>; pathIsGuide: boolean }) {
  const user = await guardBlog();
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const env = getCloudflareContext().env;
  const post = await getPostForEdit(env, id);
  if (!post) notFound();
  if (post.row.kind === "guide" && user.role !== "admin") redirect("/admin/blog");
  if (post.row.kind === "guide" && !pathIsGuide) redirect(`/admin/guides/${id}/edit`);
  if (post.row.kind !== "guide" && pathIsGuide) redirect(`/admin/blog/${id}/edit`);
  if (!can.editPost(user.role, post.row.status)) {
    return <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">This article is {post.row.status}. Editors can change drafts only; ask an admin to edit it. <Link className="underline" href={pathIsGuide ? "/admin/guides" : "/admin/blog"}>Back</Link></p>;
  }
  const [cats, tags, options, authors] = await Promise.all([listCategories(env, post.row.kind === "guide" ? "guide" : "blog"), listTags(env), postOptions(env, id, post.row.kind === "guide" ? "guide" : "blog"), authorOptions(env).catch(() => [])]);
  const r = post.row;
  const initial: EditorPost = {
    kind: r.kind === "guide" ? "guide" : "blog", id, version: r.version, status: r.status as PostStatus, updatedAt: r.updatedAt.getTime(), publishedAt: r.publishedAt?.getTime() ?? null, doc: post.doc,
    fields: {
      title: r.title, slug: r.slug, excerpt: r.excerpt, categoryId: r.categoryId, author: r.author.includes("@") ? "" : r.author, authorId: r.authorId, featuredImage: r.featuredImage, featuredAlt: r.featuredAlt, featuredCaption: r.featuredCaption, featuredFocalX: r.featuredFocalX, featuredFocalY: r.featuredFocalY,
      seoTitle: r.seoTitle, metaDescription: r.metaDescription, canonicalUrl: r.canonicalUrl, noindex: r.noindex, ogTitle: r.ogTitle, ogDescription: r.ogDescription, ogImage: r.ogImage,
      focusKeyword: r.focusKeyword, secondaryKeywords: r.secondaryKeywords, related: JSON.parse(r.relatedJson || "[]") as number[], tagIds: post.tagIds, scheduledAt: r.scheduledAt?.getTime() ?? null,
    },
  };
  return <Editor role={user.role} post={initial} authors={authors} cats={cats.map((c) => ({ id: c.id, name: c.name }))} tags={tags.map((t) => ({ id: t.id, name: t.name }))} options={options} targets={internalTargets((await loadHelp(getCloudflareContext().env)).articles)} />;
}
