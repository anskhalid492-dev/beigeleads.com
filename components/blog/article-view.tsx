import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { headingsOf, type DocNode } from "@/lib/blog/doc";
import type { PublicCard } from "@/lib/blog/posts";
import { PostCard, fmtDate } from "./cards";
import { CopyLink, ReadingProgress } from "./client";
import { ArticleBody } from "./render";

export type ArticleData = {
  title: string; slug: string; excerpt: string; author: string; readingMinutes: number; featuredImage: string | null; featuredAlt: string;
  publishedAt: Date; updatedAt: Date; category: { name: string; slug: string } | null; tags: { id: number; name: string; slug: string }[]; doc: DocNode;
  ogImage: string | null;
};

/** The article page, shared by the public route and the admin preview so what you preview is what is published. */
export function ArticleView({ a, related, preview = false }: { a: ArticleData; related: PublicCard[]; preview?: boolean }) {
  const toc = headingsOf(a.doc).filter((h) => h.level <= 3);
  const url = `${SITE_URL}/blog/${a.slug}`;
  const enc = encodeURIComponent;
  const img = a.ogImage ?? a.featuredImage;
  return (
    <>
      {!preview && <ReadingProgress />}
      {preview && <p role="status" className="bg-purple-100 px-4 py-2 text-center text-sm font-semibold text-forest-900">Preview. This is how the article looks once it is published.</p>}
      <Breadcrumbs wide items={[{ name: "Blog", href: "/blog" }, ...(a.category ? [{ name: a.category.name, href: `/blog/category/${a.category.slug}` }] : []), { name: a.title, href: `/blog/${a.slug}` }]} />
      {!preview && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.excerpt || undefined,
          datePublished: a.publishedAt.toISOString(), dateModified: a.updatedAt.toISOString(),
          author: a.author ? { "@type": "Person", name: a.author } : { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          mainEntityOfPage: url, image: img ? [img.startsWith("http") ? img : `${SITE_URL}${img}`] : undefined,
        }} />
      )}
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl">
          {a.category && <Link href={`/blog/category/${a.category.slug}`} className="text-sm font-bold text-forest-500 hover:underline">{a.category.name}</Link>}
          <h1 className="display mt-2 text-5xl text-forest-900 sm:text-7xl">{a.title}</h1>
          {a.excerpt && <p className="mt-4 text-xl">{a.excerpt}</p>}
          <p className="mt-5 text-sm">{a.author ? `By ${a.author} · ` : ""}{fmtDate(a.publishedAt)}{a.updatedAt.getTime() - a.publishedAt.getTime() > 86_400_000 ? ` · Updated ${fmtDate(a.updatedAt)}` : ""} · {a.readingMinutes} min read</p>
        </header>
        {a.featuredImage && (
           
          <img src={a.featuredImage} alt={a.featuredAlt} className="mx-auto mt-8 aspect-[16/9] w-full max-w-5xl rounded-3xl object-cover" />
        )}

        <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,44rem)_14rem] lg:justify-between">
          <div>
            <div id="article-body"><ArticleBody doc={a.doc} /></div>
            {a.tags.length > 0 && <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">{a.tags.map((t) => <li key={t.id} className="rounded-full bg-sand-100 px-3 py-1 text-sm">{t.name}</li>)}</ul>}
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-6" aria-label="Share this article">
              <span className="text-sm font-semibold text-forest-900">Share</span>
              <a className="rounded-full border border-sand-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="rounded-full border border-sand-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100" href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(a.title)}`} target="_blank" rel="noopener noreferrer">X</a>
              <a className="rounded-full border border-sand-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
              <CopyLink url={url} />
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {toc.length > 1 && (
                <nav aria-label="On this page">
                  <p className="mb-2 text-sm font-bold text-forest-900">On this page</p>
                  <ul className="space-y-1.5 border-l border-sand-300 text-sm">
                    {toc.map((h) => <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.5rem" : "0.75rem" }}><a href={`#${h.id}`} className="hover:text-forest-900 hover:underline">{h.text}</a></li>)}
                  </ul>
                </nav>
              )}
              <div className="rounded-2xl bg-sand-100 p-4 text-sm">
                <p className="font-bold text-forest-900">See a sample first</p>
                <p className="mt-1">Request a free masked sample of a business contact list.</p>
                <Button asChild size="sm" className="mt-3"><Link href="/sample">Request a sample</Link></Button>
              </div>
            </div>
          </aside>
        </div>

        <section className="mx-auto mt-14 max-w-5xl rounded-[2rem] bg-forest-900 p-8 text-center sm:p-12" aria-labelledby="cta">
          <h2 id="cta" className="display text-4xl !text-sand-50 sm:text-5xl">Pay once. Own the list.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sand-200">Browse ready-made business contact lists, or tell us what you need and we will review a custom list request.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link href="/lists">Browse lists</Link></Button><Button asChild variant="secondary"><Link href="/custom-list">Build a custom list</Link></Button></div>
        </section>

        {related.length > 0 && (
          <section className="mx-auto mt-16 max-w-6xl" aria-labelledby="rel">
            <h2 id="rel" className="display text-4xl text-forest-900">Keep reading</h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-3">{related.map((p) => <li key={p.id}><PostCard p={p} /></li>)}</ul>
          </section>
        )}
      </div>
    </>
  );
}
