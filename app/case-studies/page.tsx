import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Search } from "lucide-react";
import { FeaturedStory, StoryRow } from "@/components/case-studies/rows";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { listPublished, publishedCategories } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "B2B Lead Generation Case Studies and Data Use Cases",
  description: "Practical examples of how targeted business data supports B2B prospecting, geographic segmentation and sales workflows, with links to the databases behind them.",
  alternates: { canonical: "/case-studies" },
};

export default async function CaseStudiesIndex(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const catSlug = typeof sp.category === "string" ? sp.category.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const env = getCloudflareContext().env;
  let data: { cards: Awaited<ReturnType<typeof listPublished>>["cards"]; total: number; per: number; cats: Awaited<ReturnType<typeof publishedCategories>> } | null = null;
  try {
    const cats = await publishedCategories(env, "case");
    const cat = cats.find((c) => c.slug === catSlug);
    const first = !q && !cat && page === 1;
    const l = await listPublished(env, { kind: "case", q, categoryId: cat?.id, page, per: first ? 7 : 6 });
    data = { cards: l.cards, total: l.total, per: l.per, cats };
  } catch { data = null; }

  const cards = data?.cards ?? [];
  const active = data?.cats.find((c) => c.slug === catSlug);
  // There is no "pinned" flag in the CMS: the featured story is the newest published one.
  const featured = !q && !active && page === 1 ? cards[0] : undefined;
  const rest = featured ? cards.slice(1) : cards;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;
  const href = (n: number) => { const u = new URLSearchParams(); if (q) u.set("q", q); if (catSlug) u.set("category", catSlug); if (n > 1) u.set("page", String(n)); const s = u.toString(); return s ? `/case-studies?${s}` : "/case-studies"; };
  const chip = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${on ? "border-sand-50 bg-sand-50 text-forest-900" : "border-forest-500 text-sand-100 hover:border-sand-200 hover:text-sand-50"}`;

  return (
    <>
      <Breadcrumbs wide items={[{ name: "Case Studies", href: "/case-studies" }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "BeigeLeads Case Studies", url: `${SITE_URL}/case-studies`, description: "Practical examples of how targeted business data supports B2B prospecting, geographic segmentation and sales workflows." }} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[2rem] bg-forest-900 px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-purple-600/25 blur-3xl" />
          <div className="relative max-w-3xl">
            <h1 className="display text-5xl text-sand-50 sm:text-7xl">Real Challenges. Smarter Data Solutions.</h1>
            <p className="mt-5 max-w-2xl text-lg text-sand-200 sm:text-xl">Explore practical examples of how targeted business data can support prospecting, market research, and customer acquisition.</p>
            <form action="/case-studies" method="get" role="search" className="mt-8 flex max-w-xl gap-2">
              {catSlug && <input type="hidden" name="category" value={catSlug} />}
              <label htmlFor="cs-q" className="sr-only">Search case studies</label>
              <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden /><input id="cs-q" name="q" defaultValue={q} maxLength={80} placeholder="Search case studies" className="h-12 w-full rounded-full border border-sand-200 bg-sand-50 pl-11 pr-4 text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600" /></div>
              <Button type="submit" size="lg">Search</Button>
            </form>
            {data && data.cats.length > 0 && (
              <nav aria-label="Case study topics" className="mt-6 flex flex-wrap gap-2">
                <Link href="/case-studies" aria-current={!active && !q ? "page" : undefined} className={chip(!active)}>All</Link>
                {data.cats.map((c) => <Link key={c.id} href={`/case-studies?category=${c.slug}`} aria-current={active?.id === c.id ? "page" : undefined} className={chip(active?.id === c.id)}>{c.name}</Link>)}
              </nav>
            )}
          </div>
        </header>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm">Studies marked <strong className="text-forest-900">Illustrative use case</strong> are composite scenarios that show how data can be used. They are not reports about named customers and contain no invented results.</p>

        {!data ? (
          <p className="mt-16 text-center">Case studies are not available right now. Please check back soon.</p>
        ) : cards.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-sand-200 bg-white p-10 text-center">
            <p className="font-bold text-forest-900">{q ? `No case studies match “${q}”.` : active ? `No case studies in ${active.name} yet.` : "No case studies yet."}</p>
            <p className="mt-1 text-sm">{q ? "Try a different word, or " : "Meanwhile, "}<Link className="underline" href="/lists">browse our lists</Link>.</p>
          </div>
        ) : (
          <>
            {(q || active) && <p className="mt-8 text-sm" role="status">{data.total} case stud{data.total === 1 ? "y" : "ies"}{q ? ` for “${q}”` : ""}{active ? ` in ${active.name}` : ""}.</p>}
            {featured && <div className="mt-10"><FeaturedStory p={featured} /></div>}
            {rest.length > 0 && (
              <section aria-labelledby="latest" className="mt-16">
                <h2 id="latest" className="display text-4xl text-forest-900">{q ? "Search results" : active ? active.name : featured ? "More case studies" : "Case studies"}</h2>
                <div className="mt-8 space-y-14">{rest.map((p, i) => <StoryRow key={p.id} p={p} flip={i % 2 === 1} />)}</div>
              </section>
            )}
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>}
                <span>Page {page} of {pages}</span>
                {page < pages && <Button asChild variant="secondary" size="sm"><Link href={href(page + 1)}>Next</Link></Button>}
              </nav>
            )}
          </>
        )}
        <section aria-labelledby="where" className="mt-20 grid gap-6 rounded-[2rem] border border-sand-200 bg-white p-8 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 id="where" className="display text-3xl text-forest-900 sm:text-4xl">See the data behind the stories.</h2>
            <p className="mt-2 max-w-2xl">Browse ready-made business email lists by industry and location, and look at a masked sample before you buy.</p>
          </div>
          <div className="flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/lists">Explore Databases</Link></Button><Button asChild size="lg" variant="secondary"><Link href="/sample">Free sample</Link></Button></div>
        </section>
      </div>
    </>
  );
}
