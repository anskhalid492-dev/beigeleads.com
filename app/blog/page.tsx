import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CardMeta, PostCard } from "@/components/blog/cards";
import { Button } from "@/components/ui/button";
import { NewsletterCta } from "@/components/blog/newsletter";
import { newsletterOn } from "@/lib/newsletter";
import { listPublished, publishedCategories } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The BeigeLeads Journal: B2B data and prospecting guides",
  description: "Practical guides on B2B data, sales prospecting, lead generation, cold outreach, and finding the right business prospects.",
  alternates: { canonical: "/blog" },
};

type Loaded = { cards: Awaited<ReturnType<typeof listPublished>>["cards"]; total: number; per: number; cats: Awaited<ReturnType<typeof publishedCategories>> };

export default async function BlogIndex(props: PageProps<"/blog">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const env = getCloudflareContext().env;
  let data: Loaded | null = null;
  try {
    const first = !q && page === 1;
    const [l, cats] = await Promise.all([listPublished(env, { q, page, per: first ? 10 : 9 }), publishedCategories(env)]);
    data = { cards: l.cards, total: l.total, per: l.per, cats };
  } catch { data = null; }

  const cards = data?.cards ?? [];
  // There is no "pinned" flag in the CMS, so the featured slot is the newest published article.
  const featured = !q && page === 1 ? cards[0] : undefined;
  const rest = featured ? cards.slice(1) : cards;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;
  const href = (n: number) => { const u = new URLSearchParams(); if (q) u.set("q", q); if (n > 1) u.set("page", String(n)); const s = u.toString(); return s ? `/blog?${s}` : "/blog"; };

  return (
    <>
      <Breadcrumbs wide items={[{ name: "Blog", href: "/blog" }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-forest-500">THE BEIGELEADS JOURNAL</p>
            <h1 className="display mt-3 text-5xl text-forest-900 sm:text-7xl lg:text-8xl">Insights for Smarter B2B Growth.</h1>
            <p className="mt-5 max-w-2xl text-lg sm:text-xl">Practical guides on B2B data, sales prospecting, lead generation, cold outreach, and finding the right business prospects.</p>
          </div>
          <form action="/blog" method="get" role="search" className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search articles" aria-label="Search articles" className="h-11 min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-4 text-sm" />
            <Button type="submit">Search</Button>
          </form>
        </header>

        <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2 border-y border-sand-200 py-4">
          <Link href="/blog" aria-current={!q ? "page" : undefined} className="rounded-full border border-forest-700 bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-900">All articles</Link>
          {data?.cats.map((c) => <Link key={c.id} href={`/blog/category/${c.slug}`} className="rounded-full border border-sand-300 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{c.name} <span className="text-forest-500">{c.posts}</span></Link>)}
        </nav>

        {!data ? (
          <p className="mt-16 text-center">The blog is not available right now. Please check back soon.</p>
        ) : cards.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-sand-200 bg-white p-10 text-center">
            <p className="font-bold text-forest-900">{q ? `No articles match “${q}”.` : "No articles yet."}</p>
            <p className="mt-1 text-sm">{q ? "Try a different word, or " : "Meanwhile, "}<Link className="underline" href="/lists">browse our lists</Link>.</p>
          </div>
        ) : (
          <>
            {q && <p className="mt-6 text-sm" role="status">{data.total} result{data.total === 1 ? "" : "s"} for “{q}”.</p>}
            {featured && (
              <article className="mt-10 grid overflow-hidden rounded-3xl border border-sand-200 bg-white lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <Link href={`/blog/${featured.slug}`} tabIndex={-1} aria-hidden className="block">
                  {featured.featuredImage ? (
                    <img src={featured.featuredImage} alt="" style={{ objectPosition: `${featured.focalX}% ${featured.focalY}%` }} className="aspect-[16/10] h-full w-full object-cover lg:aspect-auto" />
                  ) : <div className="aspect-[16/10] h-full bg-gradient-to-br from-forest-100 to-sand-200 lg:aspect-auto" />}
                </Link>
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
                  <p className="text-sm font-bold text-forest-500">Featured{featured.categoryName ? ` · ${featured.categoryName}` : ""}</p>
                  <h2 className="display text-4xl text-forest-900 sm:text-5xl"><Link href={`/blog/${featured.slug}`} className="hover:underline">{featured.title}</Link></h2>
                  {featured.excerpt && <p className="text-lg">{featured.excerpt}</p>}
                  <CardMeta p={featured} size={40} />
                  <div><Button asChild><Link href={`/blog/${featured.slug}`}>Read the article</Link></Button></div>
                </div>
              </article>
            )}
            {rest.length > 0 && (
              <section aria-labelledby="latest" className="mt-14">
                <h2 id="latest" className="display text-4xl text-forest-900">{q ? "Search results" : "Latest articles"}</h2>
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <li key={p.id}><PostCard p={p} /></li>)}</ul>
              </section>
            )}
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>}
                <span>Page {page} of {pages}</span>
                {page < pages && <Button asChild variant="secondary" size="sm"><Link href={href(page + 1)}>Next</Link></Button>}
              </nav>
            )}
          </>
        )}
        {newsletterOn(env) && <NewsletterCta />}
      </div>
    </>
  );
}
