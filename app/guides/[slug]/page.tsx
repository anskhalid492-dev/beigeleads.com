import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ArticleView } from "@/components/blog/article-view";
import { getPublicAuthorById } from "@/lib/blog/authors";
import { faqOf } from "@/lib/blog/faq";
import { mediaByUrl } from "@/lib/blog/media";
import { getPublishedBySlug, relatedPublished } from "@/lib/blog/posts";
import { getSeoSettings } from "@/lib/seo/settings";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try { return await getPublishedBySlug(getCloudflareContext().env, slug, "guide"); } catch { return null; }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await props.params).slug);
  if (!p) return { title: "Guide not found", robots: { index: false } };
  const r = p.row;
  const title = r.seoTitle || r.title;
  const g = await getSeoSettings(getCloudflareContext().env);
  const description = r.metaDescription || r.excerpt || g.defaultDescription || undefined;
  const img = r.ogImage || r.featuredImage || g.defaultOgImage || null;
  const abs = img ? (img.startsWith("http") ? img : `${SITE_URL}${img}`) : undefined;
  return {
    title, description,
    alternates: { canonical: r.canonicalUrl || `/guides/${r.slug}` },
    ...(r.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "article", siteName: g.siteName || SITE_NAME, title: r.ogTitle || title, description: r.ogDescription || description, url: `${SITE_URL}/guides/${r.slug}`, images: abs ? [abs] : undefined, publishedTime: (r.publishedAt ?? r.scheduledAt)?.toISOString() },
    twitter: { ...(g.twitterSite ? { site: g.twitterSite } : {}), card: abs ? "summary_large_image" : "summary", title: r.ogTitle || title, description: r.ogDescription || description, images: abs ? [abs] : undefined },
  };
}

export default async function GuidePage(props: { params: Promise<{ slug: string }> }) {
  const p = await load((await props.params).slug);
  if (!p) notFound();
  const { row } = p;
  const env = getCloudflareContext().env;
  const [related, profile, media] = await Promise.all([relatedPublished(env, row).catch(() => []), getPublicAuthorById(env, row.authorId).catch(() => null), mediaByUrl(env, row.featuredImage).catch(() => null)]);
  return (
    <ArticleView guide faq={faqOf(p.doc)} related={related} a={{
      title: row.title, slug: row.slug, excerpt: row.excerpt, author: row.author, authorProfile: profile ? { slug: profile.slug, name: profile.name, title: profile.title, photo: profile.photo, shortBio: profile.shortBio, links: profile.links } : null, readingMinutes: row.readingMinutes, featuredImage: row.featuredImage, featuredAlt: row.featuredAlt, featuredCaption: row.featuredCaption, focalX: row.featuredFocalX, focalY: row.featuredFocalY, imageCredit: media?.attribution || undefined,
      publishedAt: row.publishedAt ?? row.scheduledAt ?? row.createdAt, updatedAt: row.updatedAt, category: p.category ? { name: p.category.name, slug: p.category.slug } : null, tags: p.tags, doc: p.doc, ogImage: row.ogImage,
    }} />
  );
}
