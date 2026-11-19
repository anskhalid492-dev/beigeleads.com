import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Flag } from "@/components/shared/db-icon";
import { Faq } from "@/components/shared/faq";
import { ListCard } from "@/components/lists/list-card";
import { ListsCatalog } from "@/components/lists/lists-catalog";
import { ListsDirectory } from "@/components/lists/lists-directory";
import { ListsHero } from "@/components/lists/lists-hero";
import { Button } from "@/components/ui/button";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { relatedGuides } from "@/lib/lists-guides";
import { getTax } from "@/lib/taxonomy-route";
import { loadListsData } from "@/lib/lists-data";
import { parseSlugList, getPublicSettings } from "@/lib/settings/service";
import { isFiltered, listsHref, parseFilters } from "@/lib/shop";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  // Filtered, searched, sorted and B2C views are thin or duplicate: noindex, canonical to the clean page. Plain pagination keeps its own canonical.
  const filtered = isFiltered(f);
  return {
    title: "Business contact lists by industry, country and city",
    description: "Explore targeted business contact databases by industry and location. Preview a masked sample, pay once, own the list. No account needed.",
    alternates: { canonical: filtered ? "/lists" : listsHref({ page: f.page }) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

const TRUST = ["Masked sample on every list page", "Pay once, own the list", "CSV, Excel or TXT", "No account needed"];

export default async function ListsPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams);
  const { env } = getCloudflareContext();
  const featured = parseSlugList((await getPublicSettings(env)).featured?.industries.join(",") ?? "");
  const data = await loadListsData();
  const productCats: Record<string, string[]> = {};
  for (const p of data.products) { const l = (productCats[p.countrySlug] ??= []); if (!l.includes(p.categorySlug)) l.push(p.categorySlug); }

  // Collections that would only repeat the catalog stay hidden until there is enough real inventory.
  const showPopular = data.products.length > 6;
  const popular = showPopular ? [...data.products].sort((a, b) => (featured.indexOf(a.categorySlug) + 1 || 999) - (featured.indexOf(b.categorySlug) + 1 || 999)).slice(0, 8) : [];
  const shown = new Set(popular.map((p) => p.slug));
  const international = data.products.filter((p) => p.countrySlug !== "united-states" && !shown.has(p.slug));
  const catName = new Map(data.industries.map((c) => [c.slug, c.name]));
  const cityTiles = data.tree.flatMap((c) => c.cities.flatMap((ct) => ct.cats.map((cat) => ({ key: `${c.slug}/${ct.regionSlug ?? ""}/${ct.slug}/${cat}`, cat, name: ct.name, code: c.code, href: `/lists/${cat}/${c.slug}/${ct.regionSlug ? `${ct.regionSlug}/` : ""}${ct.slug}` })))).slice(0, 12);
  const guides = await relatedGuides(env, ["email list", "lead", ...data.industries.map((i) => i.name)], 3);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4"><Breadcrumbs items={[{ name: "Lists", href: "/lists" }]} /></div>
      <ListsHero audience={f.type} industries={data.industries} countries={data.countries} tree={data.tree} niches={data.niches.map((n) => ({ name: n.name }))} />
      <ul className="mx-auto mt-5 flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 text-sm font-semibold text-forest-900">{TRUST.map((t) => <li key={t} className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest-500" aria-hidden />{t}</li>)}</ul>

      <ListsDirectory tax={await getTax()} industries={data.industries.map((i) => ({ slug: i.slug, name: i.name, blurb: i.blurb ?? "" }))} tree={data.tree} products={data.products} niches={data.niches.map((n) => ({ category: n.category, name: n.name }))} productCats={productCats} />

      {f.type === "b2c" ? (
        <section id="databases" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14">
          <h2 className="display text-4xl text-forest-900">Consumer databases are not available yet.</h2>
          <p className="mt-4">BeigeLeads currently provides business contact data only. We do not sell consumer contact lists. If you need an audience segment, tell us what you are looking for and we will tell you honestly what is possible.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button><Button asChild variant="secondary" size="lg"><Link href="/lists">Browse B2B Lists</Link></Button></div>
        </section>
      ) : (
        <ListsCatalog data={data} initial={f} featured={featured} />
      )}

      {f.type !== "b2c" && popular.length > 0 && !isFiltered(f) && (
        <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-4xl text-forest-900">Popular databases</h2>
          <ul className="mt-6 flex snap-x gap-5 overflow-x-auto pb-4 [&>li]:w-[20rem] [&>li]:shrink-0 [&>li]:snap-start">{popular.map((p) => <ListCard key={p.slug} p={p} />)}</ul>
        </div></section>
      )}
      {f.type !== "b2c" && international.length > 0 && !isFiltered(f) && (
        <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-7xl px-4"><h2 className="display text-4xl text-forest-900">International business lists</h2><ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{international.map((p) => <ListCard key={p.slug} p={p} />)}</ul></div></section>
      )}
      {f.type !== "b2c" && cityTiles.length > 0 && !isFiltered(f) && (
        <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-4xl text-forest-900">City-specific databases</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cityTiles.map((t) => <li key={t.key}><Link href={t.href} className="flex items-center gap-3 rounded-2xl border border-sand-300 bg-white px-4 py-3 text-sm font-semibold text-forest-900 hover:border-forest-900"><Flag code={t.code} className="h-4 w-6" />{catName.get(t.cat)} in {t.name}</Link></li>)}</ul>
          <p className="mt-4 text-sm">City pages are views of the national list for that industry.</p>
        </div></section>
      )}

      {guides.length > 0 && (
        <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-4xl text-forest-900">Guides for choosing and using a list</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">{guides.map((g) => <li key={`${g.kind}-${g.slug}`}><Link href={`/${g.kind === "guide" ? "guides" : "blog"}/${g.slug}`} className="flex h-full flex-col rounded-[1.3rem] border border-sand-300 bg-white p-5 hover:border-forest-500"><span className="text-xs font-bold text-forest-500">{g.kind === "guide" ? "Guide" : "Article"}</span><span className="display mt-1 text-2xl leading-tight text-forest-900">{g.title}</span><span className="mt-2 line-clamp-3 text-sm">{g.excerpt}</span></Link></li>)}</ul>
        </div></section>
      )}

      <section className="border-t border-sand-200 bg-forest-900 py-14 text-sand-50"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <div><h2 className="display text-3xl !text-sand-50">Can&apos;t find your list?</h2><p className="mt-1 text-sand-200">Describe the industry, place and size you need.</p></div>
        <Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button>
      </div></section>
      <Faq heading="Questions about our lists" items={[
        ["Do I need an account?", "No. You pay once in crypto and receive a download link by email."],
        ["Can I check the data first?", "Yes. Masked sample on every list page, and you can request a free sample file by email."],
        ["Are consumer databases available?", "Not yet. BeigeLeads currently provides business contact data only."],
        ["Is a city page a separate list?", "No. City and state pages are views of the national list for that industry. They are shown only where we have recorded real inventory."],
        ["What if my industry or country is missing?", "Request it on the custom list page. New industries and countries are added over time."],
      ]} />
    </>
  );
}
