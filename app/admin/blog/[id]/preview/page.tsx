import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArticleView } from "@/components/blog/article-view";
import { getAuthorForPreview } from "@/lib/blog/authors";
import { guardBlog } from "@/lib/admin/guard";
import { getPostForEdit } from "@/lib/blog/posts";
import { listCategories } from "@/lib/blog/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Article preview", robots: { index: false, follow: false } };

/** Draft preview: admin only (Access + app login), never indexed, shows the last SAVED version. */
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await guardBlog();
  const id = Number((await params).id);
  const env = getCloudflareContext().env;
  const p = Number.isInteger(id) ? await getPostForEdit(env, id) : null;
  if (!p) notFound();
  const cats = await listCategories(env);
  const c = cats.find((x) => x.id === p.row.categoryId);
  const r = p.row;
  const pa = await getAuthorForPreview(env, r.authorId).catch(() => null);
  return <ArticleView preview related={[]} a={{ title: r.title, slug: r.slug, excerpt: r.excerpt, author: r.author, readingMinutes: r.readingMinutes, featuredImage: r.featuredImage, featuredAlt: r.featuredAlt, featuredCaption: r.featuredCaption, focalX: r.featuredFocalX, focalY: r.featuredFocalY, publishedAt: r.publishedAt ?? new Date(), updatedAt: r.updatedAt, category: c ? { name: c.name, slug: c.slug } : null, tags: [], doc: p.doc, ogImage: r.ogImage, authorProfile: pa ? { slug: pa.slug, name: pa.name, title: pa.title, photo: pa.photo, shortBio: pa.shortBio, links: pa.links } : null }} />;
}
