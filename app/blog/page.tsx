import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PostCard } from "@/components/blog/cards";
import { Button } from "@/components/ui/button";
import { listPublished, publishedCategories } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on business contact lists, email data quality and prospecting, from the BeigeLeads team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex(props: PageProps<"/blog">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const env = getCloudflareContext().env;
  let data: { cards: Awaited<ReturnType<typeof listPublished>>["cards"]; total: number; per: number; cats: Awaited<ReturnType<typeof publishedCategories>> } | null = null;
  try {
    const [l, cats] = await Promise.all([listPublished(env, { q, page, per: q || page > 1 ? 9 : 10 }), publishedCategories(env)]);
    data = { cards: l.cards, total: l.total, per: l.per, cats };
  } catch { data = null; }

  const cards = data?.cards ?? [];
  const featured = !q && page === 1 ? cards[0] : undefined;
  const rest = featured ? cards.slice(1) : cards;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;
  const href = (n: number) => `/blog?${new URLSearchParams({ ...(q ? { q } : {}), ...(n > 1 ? { page: String(n) } : {}) }).toString()}`;

  return (
    <>
      <Breadcrumbs wide items={[{ name: "Blog", href: "/blog" }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <h1 className="display text-6xl text-forest-900 sm:text-8xl">The BeigeLeads blog</h1>
          <p className="mt-4 text-lg">Practical guides on business contact lists, email data quality and prospecting.</p>
        </header>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            <Link href="/blog" aria-current={!q ? "page" : undefined} className="rounded-full border border-forest-700 bg-forest-100 px-4 py-1.5 text-sm font-semibold text-forest-900">All</Link>
            {data?.cats.map((c) => <Link key={c.id} href={`/blog/category/${c.slug}`} className="rounded-full border border-sand-300 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{c.name}</Link>)}
          </nav>
          <form action="/blog" method="get" role="search" className="ml-auto flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search articles" aria-label="Search articles" className="h-10 w-56 rounded-xl border border-sand-300 bg-white px-3 text-sm" />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>

        {!data ? (
          <p className="mt-16 text-center">The blog is not available right now. Please check back soon.</p>
        ) : cards.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-sand-200 bg-white p-10 text-center">
            <p className="font-bold text-forest-900">{q ? `No articles match “${q}”.` : "No articles yet."}</p>
            <p className="mt-1 text-sm">{q ? "Try a different word, or " : "Meanwhile, "}<Link className="underline" href="/lists">browse our lists</Link>.</p>
          </div>
        ) : (
          <>
            {featured && (
              <article className="mt-10 grid overflow-hidden rounded-3xl border border-sand-200 bg-white md:grid-cols-2">
                {featured.featuredImage ? (
                   
                  <img src={featured.featuredImage} alt={featured.featuredAlt} className="h-full min-h-56 w-full object-cover" />
                ) : <div className="min-h-56 bg-gradient-to-br from-forest-100 to-sand-200" aria-hidden />}
                <div className="flex flex-col justify-center p-8 sm:p-10">
                  <p className="text-sm font-semibold text-forest-500">Latest · {featured.categoryName ?? "Article"} · {featured.readingMinutes} min read</p>
                  <h2 className="display mt-3 text-4xl text-forest-900 sm:text-5xl"><Link href={`/blog/${featured.slug}`} className="hover:underline">{featured.title}</Link></h2>
                  {featured.excerpt && <p className="mt-3">{featured.excerpt}</p>}
                  <div className="mt-6"><Button asChild><Link href={`/blog/${featured.slug}`}>Read the article</Link></Button></div>
                </div>
              </article>
            )}
            {rest.length > 0 && <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <li key={p.id}><PostCard p={p} /></li>)}</ul>}
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={href(page - 1)}>Previous</Link></Button>}
                <span>Page {page} of {pages}</span>
                {page < pages && <Button asChild variant="secondary" size="sm"><Link href={href(page + 1)}>Next</Link></Button>}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
