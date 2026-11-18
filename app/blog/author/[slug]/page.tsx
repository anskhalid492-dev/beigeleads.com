import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AuthorAvatar } from "@/components/blog/avatar";
import { AuthorLinksList } from "@/components/blog/author-parts";
import { PostCard } from "@/components/blog/cards";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { authorCategories, getPublicAuthorBySlug, publishedCount } from "@/lib/blog/authors";
import { listPublished } from "@/lib/blog/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);

async function load(slug: string, page: number, categorySlug?: string) {
  try {
    const env = getCloudflareContext().env;
    const author = await getPublicAuthorBySlug(env, slug);
    if (!author) return null;
    const cats = await authorCategories(env, author.id);
    const cat = cats.find((c) => c.slug === categorySlug);
    const [list, total] = await Promise.all([listPublished(env, { authorId: author.id, categoryId: cat?.id, page, per: 9 }), publishedCount(env, author.id)]);
    return { author, cats, cat, list, total };
  } catch { return null; }
}

export async function generateMetadata(props: PageProps<"/blog/author/[slug]">): Promise<Metadata> {
  const d = await load((await props.params).slug, 1);
  if (!d) return { title: "Author not found", robots: { index: false } };
  const a = d.author;
  const title = a.seoTitle || `${a.name}${a.title ? `, ${a.title}` : ""}: articles and profile`;
  const description = a.metaDescription || a.shortBio || `Articles written by ${a.name} for the ${SITE_NAME} blog.`;
  const img = a.ogImage || a.photo;
  const canonical = a.canonicalUrl || `/blog/author/${a.slug}`;
  return {
    title, description,
    alternates: { canonical },
    // A profile with no published article is a thin page: keep it out of search until there is something to read.
    ...(a.noindex || d.total === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "profile", siteName: SITE_NAME, title, description, url: `${SITE_URL}/blog/author/${a.slug}`, images: img ? [abs(img)] : undefined },
    twitter: { card: img ? "summary_large_image" : "summary", title, description, images: img ? [abs(img)] : undefined },
  };
}

export default async function AuthorPage(props: PageProps<"/blog/author/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const d = await load(slug, page, typeof sp.category === "string" ? sp.category : undefined);
  if (!d) notFound();
  const { author: a, cats, cat, list, total } = d;
  const pages = Math.max(1, Math.ceil(list.total / list.per));
  const qs = (n: number) => { const u = new URLSearchParams(); if (cat) u.set("category", cat.slug); if (n > 1) u.set("page", String(n)); const s = u.toString(); return s ? `?${s}` : `/blog/author/${a.slug}`; };
  const paragraphs = a.fullBio.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const sameAs = Object.values(a.links);
  const meta = [a.title, a.company, a.location].filter(Boolean);
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ProfilePage", url: `${SITE_URL}/blog/author/${a.slug}`, dateModified: a.updatedAt.toISOString(),
        mainEntity: {
          "@type": "Person", "@id": `${SITE_URL}/blog/author/${a.slug}#person`, name: a.fullName, url: `${SITE_URL}/blog/author/${a.slug}`,
          jobTitle: a.title || undefined, description: a.shortBio || undefined, image: a.photo ? abs(a.photo) : undefined,
          worksFor: a.company ? { "@type": "Organization", name: a.company } : undefined, knowsAbout: a.expertise.length ? a.expertise : undefined, sameAs: sameAs.length ? sameAs : undefined,
        },
      }} />
      <Breadcrumbs wide items={[{ name: "Blog", href: "/blog" }, { name: a.name, href: `/blog/author/${a.slug}` }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="grid gap-8 rounded-[2rem] bg-sand-100 p-6 sm:p-10 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center">
          <div className="mx-auto md:mx-0"><AuthorAvatar photo={a.photo} name={a.name} size={224} className="!rounded-3xl border border-sand-200 shadow-sm max-md:!size-44" /></div>
          <div className="min-w-0">
            <h1 className="display text-5xl text-forest-900 sm:text-7xl">{a.name}</h1>
            {meta.length > 0 && <p className="mt-2 text-lg font-semibold text-forest-700">{meta.join(" · ")}</p>}
            {a.shortBio && <p className="mt-4 max-w-2xl text-lg">{a.shortBio}</p>}
            <AuthorLinksList links={a.links} className="mt-5" />
            <p className="mt-5 text-sm font-semibold text-forest-900">{total} published article{total === 1 ? "" : "s"}</p>
          </div>
        </header>

        {(paragraphs.length > 0 || a.expertise.length > 0) && (
          <section aria-labelledby="about" className="mx-auto mt-10 max-w-3xl">
            <h2 id="about" className="display text-4xl text-forest-900">About {a.name}</h2>
            {paragraphs.map((t, i) => <p key={i} className="mt-4 text-lg leading-relaxed">{t}</p>)}
            {a.expertise.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-forest-900">Areas of expertise</h3>
                <ul className="mt-2 flex flex-wrap gap-2">{a.expertise.map((x) => <li key={x} className="rounded-full bg-forest-100 px-3 py-1 text-sm font-semibold text-forest-900">{x}</li>)}</ul>
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="articles" className="mt-14">
          <h2 id="articles" className="display text-4xl text-forest-900">Articles by {a.name}</h2>
          {cats.length > 1 && (
            <nav aria-label="Filter by category" className="mt-5 flex flex-wrap gap-2">
              <Link href={`/blog/author/${a.slug}`} aria-current={!cat ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold text-forest-900 ${!cat ? "border-forest-700 bg-forest-100" : "border-sand-300 hover:bg-sand-100"}`}>All</Link>
              {cats.map((c) => <Link key={c.id} href={`?category=${c.slug}`} aria-current={c.id === cat?.id ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold text-forest-900 ${c.id === cat?.id ? "border-forest-700 bg-forest-100" : "border-sand-300 hover:bg-sand-100"}`}>{c.name} ({c.n})</Link>)}
            </nav>
          )}
          {list.cards.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-sand-200 bg-white p-10 text-center">No published articles yet. <Link className="underline" href="/blog">See the blog</Link>.</p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.cards.map((p) => <li key={p.id}><PostCard p={p} /></li>)}</ul>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
              {page > 1 && <Button asChild variant="secondary" size="sm"><Link href={qs(page - 1)}>Previous</Link></Button>}
              <span>Page {page} of {pages}</span>
              {page < pages && <Button asChild variant="secondary" size="sm"><Link href={qs(page + 1)}>Next</Link></Button>}
            </nav>
          )}
        </section>

        <section className="mt-16 rounded-[2rem] bg-forest-900 p-8 text-center sm:p-12" aria-labelledby="acta">
          <h2 id="acta" className="display text-4xl !text-sand-50 sm:text-5xl">Pay once. Own the list.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sand-200">Browse ready-made business contact lists, or ask for a free masked sample first.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link href="/lists">Browse lists</Link></Button><Button asChild variant="secondary"><Link href="/sample">Request a sample</Link></Button></div>
        </section>
      </div>
    </>
  );
}
