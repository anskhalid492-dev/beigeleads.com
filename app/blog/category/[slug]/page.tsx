import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PostCard } from "@/components/blog/cards";
import { Button } from "@/components/ui/button";
import { listPublished, publishedCategories } from "@/lib/blog/posts";
import { listCategories } from "@/lib/blog/taxonomy";

export const dynamic = "force-dynamic";

async function load(slug: string, page: number) {
  try {
    const env = getCloudflareContext().env;
    const cat = (await listCategories(env)).find((c) => c.slug === slug);
    if (!cat) return null;
    const [l, cats] = await Promise.all([listPublished(env, { categoryId: cat.id, page, per: 9 }), publishedCategories(env)]);
    return { cat, l, cats };
  } catch { return null; }
}

export async function generateMetadata(props: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const d = await load((await props.params).slug, 1);
  if (!d) return { title: "Category not found", robots: { index: false } };
  return {
    title: d.cat.seoTitle || `${d.cat.name} articles`,
    description: d.cat.metaDescription || d.cat.description || undefined,
    alternates: { canonical: `/blog/category/${d.cat.slug}` },
    ...(d.l.total === 0 ? { robots: { index: false, follow: true } } : {}), // no thin empty category pages in search
  };
}

export default async function BlogCategory(props: PageProps<"/blog/category/[slug]">) {
  const { slug } = await props.params;
  const page = Math.max(1, Number((await props.searchParams).page) || 1);
  const d = await load(slug, page);
  if (!d) notFound();
  const pages = Math.max(1, Math.ceil(d.l.total / d.l.per));
  return (
    <>
      <Breadcrumbs wide items={[{ name: "Blog", href: "/blog" }, { name: d.cat.name, href: `/blog/category/${d.cat.slug}` }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">{d.cat.name}</h1>
        {d.cat.description && <p className="mt-3 max-w-2xl text-lg">{d.cat.description}</p>}
        <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
          <Link href="/blog" className="rounded-full border border-sand-300 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">All</Link>
          {d.cats.map((c) => <Link key={c.id} href={`/blog/category/${c.slug}`} aria-current={c.id === d.cat.id ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold text-forest-900 ${c.id === d.cat.id ? "border-forest-700 bg-forest-100" : "border-sand-300 hover:bg-sand-100"}`}>{c.name}</Link>)}
        </nav>
        {d.l.cards.length === 0 ? <p className="mt-12 rounded-2xl border border-sand-200 bg-white p-10 text-center">No articles in this category yet. <Link className="underline" href="/blog">See all articles</Link>.</p> : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{d.l.cards.map((p) => <li key={p.id}><PostCard p={p} /></li>)}</ul>
        )}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={`?page=${page - 1}`}>Previous</Link></Button>}
            <span>Page {page} of {pages}</span>
            {page < pages && <Button asChild variant="secondary" size="sm"><Link href={`?page=${page + 1}`}>Next</Link></Button>}
          </nav>
        )}
      </div>
    </>
  );
}
