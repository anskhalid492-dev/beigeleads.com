import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArticleView } from "@/components/blog/article-view";
import { getPublishedBySlug, relatedPublished } from "@/lib/blog/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try { return await getPublishedBySlug(getCloudflareContext().env, slug); } catch { return null; }
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const p = await load((await props.params).slug);
  if (!p) return { title: "Article not found", robots: { index: false } };
  const r = p.row;
  const title = r.seoTitle || r.title;
  const description = r.metaDescription || r.excerpt || undefined;
  const img = r.ogImage || r.featuredImage;
  const abs = img ? (img.startsWith("http") ? img : `${SITE_URL}${img}`) : undefined;
  return {
    title, description,
    alternates: { canonical: r.canonicalUrl || `/blog/${r.slug}` },
    ...(r.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "article", siteName: SITE_NAME, title: r.ogTitle || title, description: r.ogDescription || description, url: `${SITE_URL}/blog/${r.slug}`, images: abs ? [abs] : undefined, publishedTime: (r.publishedAt ?? r.scheduledAt)?.toISOString() },
    twitter: { card: abs ? "summary_large_image" : "summary", title: r.ogTitle || title, description: r.ogDescription || description, images: abs ? [abs] : undefined },
  };
}

export default async function BlogArticle(props: PageProps<"/blog/[slug]">) {
  const p = await load((await props.params).slug);
  if (!p) notFound();
  const { row } = p;
  const related = await relatedPublished(getCloudflareContext().env, row).catch(() => []);
  return (
    <ArticleView related={related} a={{
      title: row.title, slug: row.slug, excerpt: row.excerpt, author: row.author, readingMinutes: row.readingMinutes, featuredImage: row.featuredImage, featuredAlt: row.featuredAlt,
      publishedAt: row.publishedAt ?? row.scheduledAt ?? row.createdAt, updatedAt: row.updatedAt, category: p.category ? { name: p.category.name, slug: p.category.slug } : null, tags: p.tags, doc: p.doc, ogImage: row.ogImage,
    }} />
  );
}
