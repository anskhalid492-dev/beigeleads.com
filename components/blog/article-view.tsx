import Link from "next/link";
import { KINDS, catHref as catHrefOf, type Kind } from "@/lib/blog/kind";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { headingsOf, type DocNode } from "@/lib/blog/doc";
import type { PublicCard } from "@/lib/blog/posts";
import { AboutAuthor, Byline, publicName, type ArticleAuthor } from "./author-parts";
import { NewsletterCta } from "./newsletter";
import { PostCard, fmtDate } from "./cards";
import { ReadingProgress } from "./client";
import { CASE_CTA, isIllustrative } from "@/lib/case-studies";
import { InlineCta, ctaFor } from "./inline-cta";
import { Share } from "./share";
import { SideCta } from "./side-cta";
import { Toc } from "./toc";
import { ArticleBody } from "./render";

export type ArticleData = {
  title: string; slug: string; excerpt: string; author: string; readingMinutes: number; featuredImage: string | null; featuredAlt: string; featuredCaption?: string; focalX?: number; focalY?: number; imageCredit?: string;
  publishedAt: Date; updatedAt: Date; category: { name: string; slug: string } | null; tags: { id: number; name: string; slug: string }[]; doc: DocNode;
  ogImage: string | null; authorProfile?: ArticleAuthor | null;
};

const SECTION: Record<Kind, string> = { blog: "Blog", guide: "Guides", case: "Case Studies" };

/** The article page, shared by the public route and the admin preview so what you preview is what is published. */
export function ArticleView({ a, related, preview = false, newsletter = false, guide = false, kind, faq = [] }: { a: ArticleData; related: PublicCard[]; preview?: boolean; newsletter?: boolean; guide?: boolean; kind?: Kind; faq?: { q: string; a: string }[] }) {
  const k: Kind = kind ?? (guide ? "guide" : "blog");
  const nonBlog = k !== "blog";
  const base = KINDS[k].pub;
  const catHref = (slug: string) => catHrefOf(k, slug);
  const toc = headingsOf(a.doc).filter((h) => h.level <= 3);
  const url = `${SITE_URL}${base}/${a.slug}`;
  const img = a.ogImage ?? a.featuredImage;
  return (
    <>
      {!preview && <ReadingProgress />}
      {preview && <p role="status" className="bg-purple-100 px-4 py-2 text-center text-sm font-semibold text-forest-900">Preview. This is how the {KINDS[k].one} looks once it is published.</p>}
      <Breadcrumbs wide items={[{ name: SECTION[k], href: base }, ...(a.category ? [{ name: a.category.name, href: catHref(a.category.slug) }] : []), { name: a.title, href: `${base}/${a.slug}` }]} />
      {!preview && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": nonBlog ? "Article" : "BlogPosting", headline: a.title, description: a.excerpt || undefined,
          datePublished: a.publishedAt.toISOString(), dateModified: a.updatedAt.toISOString(),
          author: (() => {
            const pa = a.authorProfile;
            if (pa) return { "@type": "Person", "@id": `${SITE_URL}/blog/author/${pa.slug}#person`, name: pa.name, url: `${SITE_URL}/blog/author/${pa.slug}` };
            const n = publicName(a.author);
            return n ? { "@type": "Person", name: n } : { "@type": "Organization", name: SITE_NAME };
          })(),
          publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          mainEntityOfPage: url, image: img ? [img.startsWith("http") ? img : `${SITE_URL}${img}`] : undefined,
        }} />
      )}
      {!preview && nonBlog && faq.length >= 2 && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-4xl">
          <p className="flex flex-wrap items-center gap-2">{k === "case" && isIllustrative(a.slug) && <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-forest-900">Illustrative use case</span>}{a.category && <Link href={catHref(a.category.slug)} className="rounded-full border border-forest-700/30 bg-forest-100 px-3 py-1 text-sm font-bold text-forest-900 hover:bg-forest-500 hover:text-white">{a.category.name}</Link>}</p>
          <h1 className="display mt-3 text-4xl text-forest-900 sm:text-6xl lg:text-7xl">{a.title}</h1>
          <Byline author={a.authorProfile ?? null} plainName={a.author} date={a.publishedAt} />
          {a.excerpt && <p className="mt-5 max-w-3xl text-lg sm:text-xl">{a.excerpt}</p>}
          <p className="mt-3 text-sm">{a.updatedAt.getTime() - a.publishedAt.getTime() > 86_400_000 ? `Updated ${fmtDate(a.updatedAt)} · ` : ""}{a.readingMinutes} min read</p>
        </header>
        {a.featuredImage && (
          <figure className="mx-auto mt-8 w-full max-w-5xl">
            <img src={a.featuredImage} alt={a.featuredAlt} width={1600} height={900} fetchPriority="high" decoding="async" style={{ objectPosition: `${a.focalX ?? 50}% ${a.focalY ?? 50}%` }} className="aspect-[16/9] w-full rounded-3xl object-cover" />
            {(a.featuredCaption || a.imageCredit) && <figcaption className="mt-2 text-center text-sm">{a.featuredCaption}{a.featuredCaption && a.imageCredit ? " · " : ""}{a.imageCredit}</figcaption>}
          </figure>
        )}

        <div className="mx-auto mt-10 grid max-w-6xl gap-x-10 gap-y-6 lg:grid-cols-[3rem_minmax(0,44rem)_15rem] lg:justify-center">
          <div className="hidden lg:block"><div className="sticky top-32"><Share url={url} title={a.title} vertical /></div></div>
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            {toc.length > 1 && <div className="mb-8 lg:hidden"><Toc items={toc} /></div>}
            <div id="article-body"><ArticleBody doc={a.doc} /></div>
            {a.tags.length > 0 && <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">{a.tags.map((t) => <li key={t.id} className="rounded-full bg-sand-100 px-3 py-1 text-sm">{t.name}</li>)}</ul>}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sand-200 pt-6 lg:hidden"><span className="text-sm font-semibold text-forest-900">Share</span><Share url={url} title={a.title} /></div>
            <InlineCta cta={k === "case" ? CASE_CTA : ctaFor(a)} />
            {a.authorProfile && <AboutAuthor author={a.authorProfile} />}
            <p className="mt-8"><Link href={base} className="text-sm font-semibold text-forest-900 underline underline-offset-4">← Back to all {KINDS[k].many}</Link></p>
          </div>
          <aside className="hidden lg:col-start-3 lg:row-start-1 lg:block">
            <div className="sticky top-32 space-y-6">
              {toc.length > 1 && <Toc items={toc} />}
              <SideCta cta={k === "case" ? CASE_CTA : ctaFor(a)} />
            </div>
          </aside>
        </div>

        {newsletter && <NewsletterCta />}

        {related.length > 0 && (
          <section className="mx-auto mt-16 max-w-6xl" aria-labelledby="rel">
            <h2 id="rel" className="display text-4xl text-forest-900">{k === "guide" ? "Related guides" : k === "case" ? "More case studies" : "Continue reading"}</h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-3">{related.map((p) => <li key={p.id}><PostCard p={p} kind={k} /></li>)}</ul>
          </section>
        )}
      </div>
    </>
  );
}
