import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { Faq } from "@/components/shared/faq";
import { GeoExplorer } from "@/components/shop/geo-explorer";
import { ProductCard } from "@/components/shop/product-card";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { ShopHero } from "@/components/shop/shop-hero";
import { Button } from "@/components/ui/button";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCategories } from "@/lib/catalog";
import { parseSlugList, getPublicSettings } from "@/lib/settings/service";
import { isFiltered, parseFilters, shopHref } from "@/lib/shop";
import { loadShopData } from "@/lib/shop-data";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  // Filtered, searched, sorted and B2C views are thin or duplicate: noindex, canonical to the clean page. Plain pagination keeps its own canonical.
  const filtered = isFiltered(f);
  return {
    title: "Shop business contact databases by industry, country and city",
    description: "Explore targeted business contact databases by industry, country, state and city. Preview a masked sample, pay once, own the list. No account.",
    alternates: { canonical: filtered ? "/shop" : shopHref({ page: f.page }) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

const TRUST = ["Pay once, own the list", "Masked sample on every list", "CSV, Excel or TXT", "No account needed"];

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams);
  const { env } = getCloudflareContext();
  const featured = parseSlugList((await getPublicSettings(env)).featured?.industries.join(",") ?? "");
  const data = await loadShopData();
  const cats = getCategories();
  const productCats: Record<string, string[]> = {};
  for (const p of data.products) { const l = (productCats[p.countrySlug] ??= []); if (!l.includes(p.categorySlug)) l.push(p.categorySlug); }
  const initial = f;

  // Collections that would only repeat the catalog stay hidden until there is enough real inventory.
  const showPopular = data.products.length > 6;
  const popular = showPopular ? [...data.products].sort((a, b) => (featured.indexOf(a.categorySlug) + 1 || 999) - (featured.indexOf(b.categorySlug) + 1 || 999)).slice(0, 8) : [];
  const international = data.products.filter((p) => p.countrySlug !== "united-states");
  const cityTiles = data.tree.flatMap((c) => c.cities.flatMap((ct) => ct.cats.map((cat) => ({ key: `${c.slug}/${ct.regionSlug ?? ""}/${ct.slug}/${cat}`, cat, name: ct.name, code: c.code, href: `/lists/${cat}/${c.slug}/${ct.regionSlug ? `${ct.regionSlug}/` : ""}${ct.slug}` })))).slice(0, 12);
  const catName = new Map(cats.map((c) => [c.slug, c.name]));

  return (
    <>
      <div className="mx-auto max-w-7xl px-4"><Breadcrumbs items={[{ name: "Shop", href: "/shop" }]} /></div>
      <ShopHero audience={f.type} industries={data.industries} countries={data.countries} tree={data.tree} niches={data.niches.map((n) => ({ name: n.name, categoryName: n.categoryName }))} />

      {f.type === "b2c" ? (
        <section className="py-14"><div className="mx-auto max-w-3xl px-4">
          <h2 className="display text-4xl text-forest-900">Consumer databases are not available yet.</h2>
          <p className="mt-4">BeigeLeads currently provides business contact data only. We do not sell consumer contact lists. If you need an audience segment, tell us what you are looking for and we will tell you honestly what is possible.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button><Button asChild variant="secondary" size="lg"><Link href="/shop">Explore B2B Databases</Link></Button></div>
        </div></section>
      ) : (
        <>
          <ul className="border-b border-sand-200 bg-sand-100"><li className="sr-only">Why buy here</li>
            <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm font-semibold text-forest-900">{TRUST.map((t) => <span key={t} className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest-500" aria-hidden />{t}</span>)}</div>
          </ul>

          <ShopCatalog data={data} initial={initial} featured={featured} />

          {popular.length > 0 && !isFiltered(f) && (
            <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-7xl px-4">
              <h2 className="display text-4xl text-forest-900">Popular business databases</h2>
              <ul className="mt-6 flex snap-x gap-5 overflow-x-auto pb-4 [&>li]:w-[19rem] [&>li]:shrink-0 [&>li]:snap-start">{popular.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
            </div></section>
          )}

          <section id="industries" className="scroll-mt-24 border-t border-sand-200 py-14"><div className="mx-auto max-w-7xl px-4">
            <h2 className="display text-4xl text-forest-900">Browse by industry</h2>
            <p className="mt-2 max-w-2xl">Each industry page lists its countries, states and cities.</p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((c) => {
                const niches = data.niches.filter((n) => n.category === c.slug);
                return (
                  <li key={c.slug} className="rounded-[1.4rem] border border-sand-300 bg-white p-6 transition hover:border-forest-500">
                    <div className="flex items-center gap-4"><DbBadge category={c.slug} size="lg" /><div><h3 className="display text-2xl leading-tight text-forest-900"><Link href={`/lists/${c.slug}`} className="after:absolute after:inset-0 relative">{c.name}</Link></h3><p className="text-sm">{c.blurb}</p></div></div>
                    {niches.length > 0 && <p className="mt-4 flex flex-wrap gap-1.5">{niches.slice(0, 6).map((n) => <Link key={n.name} href={`/custom-list?category=${c.slug}&categoryText=${encodeURIComponent(n.name)}`} className="relative z-10 rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900 hover:bg-purple-100">{n.name}</Link>)}</p>}
                  </li>
                );
              })}
            </ul>
          </div></section>

          <section id="explore" className="scroll-mt-24 border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-7xl px-4">
            <h2 className="display text-4xl text-forest-900">Explore by country, state and city</h2>
            <p className="mt-2 max-w-2xl">Start with a country and narrow down. Only places where we have recorded real inventory are listed.</p>
            <div className="mt-7"><GeoExplorer tree={data.tree} industries={data.industries} productCats={productCats} /></div>
          </div></section>

          {international.length > 0 && (
            <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-7xl px-4"><h2 className="display text-4xl text-forest-900">International databases</h2><ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{international.map((p) => <ProductCard key={p.slug} p={p} />)}</ul></div></section>
          )}

          {cityTiles.length > 0 && (
            <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-7xl px-4">
              <h2 className="display text-4xl text-forest-900">City-specific contact lists</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cityTiles.map((t) => <li key={t.key}><Link href={t.href} className="flex items-center gap-3 rounded-2xl border border-sand-300 bg-white px-4 py-3 text-sm font-semibold text-forest-900 hover:border-forest-900"><Flag code={t.code} className="h-4 w-6" />{catName.get(t.cat)} in {t.name}</Link></li>)}</ul>
              <p className="mt-4 text-sm">City pages are views of the national list for that industry.</p>
            </div></section>
          )}
        </>
      )}

      <section className="border-t border-sand-200 bg-forest-900 py-14 text-sand-50"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <div><h2 className="display text-3xl">Can&apos;t find your list?</h2><p className="mt-1 text-sand-200">Describe the industry, place and size you need.</p></div>
        <Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button>
      </div></section>
      <Faq heading="Shop questions" items={[
        ["Do I need an account?", "No. You pay once in crypto and receive a download link by email."],
        ["Can I check the data first?", "Yes. Every list page shows a masked sample, and you can request a free sample file by email."],
        ["Are consumer databases available?", "Not yet. BeigeLeads currently provides business contact data only."],
        ["Is a city page a separate list?", "No. City and state pages are views of the national list for that industry. They are shown only where we have recorded real inventory."],
        ["What if my industry or country is missing?", "Request it on the custom list page. New industries and countries are added over time."],
      ]} />
    </>
  );
}
