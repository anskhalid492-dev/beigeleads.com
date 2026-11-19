import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CardMeta, PostCard } from "@/components/blog/cards";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { listPublished, publishedCategories } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "B2B Guides: lead generation, cold email and data quality",
  description: "Practical, step-by-step guides on B2B lead generation, cold email outreach, sales prospecting, business data and email verification.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesIndex(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const catSlug = typeof sp.category === "string" ? sp.category.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const env = getCloudflareContext().env;
  let data: { cards: Awaited<ReturnType<typeof listPublished>>["cards"]; total: number; per: number; cats: Awaited<ReturnType<typeof publishedCategories>> } | null = null;
  try {
    const cats = await publishedCategories(env, "guide");
    const cat = cats.find((c) => c.slug === catSlug);
    const first = !q && !cat && page === 1;
    const l = await listPublished(env, { kind: "guide", q, categoryId: cat?.id, page, per: first ? 10 : 9 });
    data = { cards: l.cards, total: l.total, per: l.per, cats };
  } catch { data = null; }

  const cards = data?.cards ?? [];
  const active = data?.cats.find((c) => c.slug === catSlug);
  // There is no "pinned" flag in the CMS: the featured guide is the newest published one.
  const featured = !q && !active && page === 1 ? cards[0] : undefined;
  const rest = featured ? cards.slice(1) : cards;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;
  const topics = data ? [...data.cats].sort((a, b) => b.posts - a.posts || a.name.localeCompare(b.name)) : [];
  const href = (n: number) => { const u = new URLSearchParams(); if (q) u.set("q", q); if (catSlug) u.set("category", catSlug); if (n > 1) u.set("page", String(n)); const s = u.toString(); return s ? `/guides?${s}` : "/guides"; };

  return (
    <>
      <Breadcrumbs wide items={[{ name: "Guides", href: "/guides" }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "BeigeLeads Guides", url: `${SITE_URL}/guides`, description: "Practical guides on B2B lead generation, cold email outreach, sales prospecting and business data." }} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-forest-500">GUIDES</p>
            <h1 className="display mt-3 text-5xl text-forest-900 sm:text-7xl lg:text-8xl">Practical Guides for Smarter B2B Growth.</h1>
            <p className="mt-5 max-w-2xl text-lg sm:text-xl">Step-by-step help with lead generation, cold email, prospecting and data quality, written for people who do the outreach themselves.</p>
          </div>
          <form action="/guides" method="get" role="search" className="flex gap-2">
            {catSlug && <input type="hidden" name="category" value={catSlug} />}
            <input name="q" defaultValue={q} placeholder="Search guides" aria-label="Search guides" className="h-11 min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-4 text-sm" />
            <Button type="submit">Search</Button>
          </form>
        </header>

        <nav aria-label="Guide categories" className="mt-8 flex flex-wrap gap-2 border-y border-sand-200 py-4">
          <Link href="/guides" aria-current={!active && !q ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold text-forest-900 ${!active ? "border-forest-700 bg-forest-100" : "border-sand-300 hover:bg-sand-100"}`}>All guides</Link>
          {data?.cats.map((c) => <Link key={c.id} href={`/guides?category=${c.slug}`} aria-current={active?.id === c.id ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold text-forest-900 ${active?.id === c.id ? "border-forest-700 bg-forest-100" : "border-sand-300 hover:bg-sand-100"}`}>{c.name} <span className="text-forest-500">{c.posts}</span></Link>)}
        </nav>

        {!data ? (
          <p className="mt-16 text-center">Guides are not available right now. Please check back soon.</p>
        ) : cards.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-sand-200 bg-white p-10 text-center">
            <p className="font-bold text-forest-900">{q ? `No guides match “${q}”.` : active ? `No guides in ${active.name} yet.` : "No guides yet."}</p>
            <p className="mt-1 text-sm">{q ? "Try a different word, or " : "Meanwhile, "}<Link className="underline" href="/lists">browse our lists</Link>.</p>
          </div>
        ) : (
          <>
            {(q || active) && <p className="mt-6 text-sm" role="status">{data.total} guide{data.total === 1 ? "" : "s"}{q ? ` for “${q}”` : ""}{active ? ` in ${active.name}` : ""}.</p>}
            {featured && (
              <article className="mt-10 grid overflow-hidden rounded-3xl border border-sand-200 bg-white lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <Link href={`/guides/${featured.slug}`} tabIndex={-1} aria-hidden className="block">
                  {featured.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- plain static images on Workers (no optimizer)
                    <img src={featured.featuredImage} alt="" fetchPriority="high" style={{ objectPosition: `${featured.focalX}% ${featured.focalY}%` }} className="aspect-[16/10] h-full w-full object-cover lg:aspect-auto" />
                  ) : <div className="aspect-[16/10] h-full bg-gradient-to-br from-forest-100 to-sand-200 lg:aspect-auto" />}
                </Link>
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
                  <p className="text-sm font-bold text-forest-500">Featured guide{featured.categoryName ? ` · ${featured.categoryName}` : ""}</p>
                  <h2 className="display text-4xl text-forest-900 sm:text-5xl"><Link href={`/guides/${featured.slug}`} className="hover:underline">{featured.title}</Link></h2>
                  {featured.excerpt && <p className="text-lg">{featured.excerpt}</p>}
                  <CardMeta p={featured} size={40} />
                  <div><Button asChild><Link href={`/guides/${featured.slug}`}>Read the guide</Link></Button></div>
                </div>
              </article>
            )}
            {rest.length > 0 && (
              <section aria-labelledby="latest" className="mt-14">
                <h2 id="latest" className="display text-4xl text-forest-900">{q ? "Search results" : active ? active.name : "Latest guides"}</h2>
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <li key={p.id}><PostCard p={p} guide /></li>)}</ul>
              </section>
            )}
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>}
                <span>Page {page} of {pages}</span>
                {page < pages && <Button asChild variant="secondary" size="sm"><Link href={href(page + 1)}>Next</Link></Button>}
              </nav>
            )}
            {!q && !active && topics.length > 1 && (
              <section aria-labelledby="topics" className="mt-14">
                <h2 id="topics" className="display text-4xl text-forest-900">Topics</h2>
                <ul className="mt-5 flex flex-wrap gap-3">{topics.map((c) => <li key={c.id}><Link href={`/guides?category=${c.slug}`} className="inline-flex rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm font-semibold text-forest-900 hover:shadow-md">{c.name}<span className="ml-2 text-forest-500">{c.posts} guide{c.posts === 1 ? "" : "s"}</span></Link></li>)}</ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
