import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { guardAdmin } from "@/lib/admin/guard";
import { internalTargets } from "@/lib/blog/links";
import { getPostForEdit, postOptions, type PostStatus } from "@/lib/blog/posts";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { Editor, type EditorPost } from "./editor";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: PageProps<"/admin/blog/[id]/edit">) {
  const admin = await guardAdmin();
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const env = getCloudflareContext().env;
  const post = await getPostForEdit(env, id);
  if (!post) notFound();
  const [cats, tags, options] = await Promise.all([listCategories(env), listTags(env), postOptions(env, id)]);
  const r = post.row;
  const initial: EditorPost = {
    id, version: r.version, status: r.status as PostStatus, updatedAt: r.updatedAt.getTime(), publishedAt: r.publishedAt?.getTime() ?? null, doc: post.doc,
    fields: {
      title: r.title, slug: r.slug, excerpt: r.excerpt, categoryId: r.categoryId, author: r.author || (admin?.email ?? ""), featuredImage: r.featuredImage, featuredAlt: r.featuredAlt,
      seoTitle: r.seoTitle, metaDescription: r.metaDescription, canonicalUrl: r.canonicalUrl, noindex: r.noindex, ogTitle: r.ogTitle, ogDescription: r.ogDescription, ogImage: r.ogImage,
      focusKeyword: r.focusKeyword, related: JSON.parse(r.relatedJson || "[]") as number[], tagIds: post.tagIds, scheduledAt: r.scheduledAt?.getTime() ?? null,
    },
  };
  return <Editor post={initial} cats={cats.map((c) => ({ id: c.id, name: c.name }))} tags={tags.map((t) => ({ id: t.id, name: t.name }))} options={options} targets={internalTargets()} />;
}
