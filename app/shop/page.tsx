import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCategories, getCountries, getProducts } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { allCoverage } from "@/lib/geo/store";
import { customListHref } from "@/lib/search";
import { parseSlugList, getPublicSettings } from "@/lib/settings/service";
import { PAGE_SIZE, parseShopQuery, shopHref, shopProducts, SORTS } from "@/lib/shop";

export const dynamic = "force-dynamic";
type SP = Promise<Record<string, string | string[] | undefined>>;
const field = "h-11 rounded-xl border border-sand-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-purple-600";

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const q = parseShopQuery(sp);
  const type = sp.type === "b2c" ? "b2c" : "b2b";
  // Filtered, searched, sorted and B2C views are thin or duplicate: noindex, canonical to the clean page. Plain pagination keeps its own canonical.
  const filtered = !!(q.q || q.category || q.country || q.sort !== "relevance") || type === "b2c";
  return {
    title: "Shop business contact databases",
    description: "Browse ready-made business contact databases by industry, country, state and city. Masked samples, one-time payment, no account.",
    alternates: { canonical: filtered ? "/shop" : shopHref({ page: q.page }) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = parseShopQuery(sp);
  const type = sp.type === "b2c" ? "b2c" : "b2b";
  const { env } = getCloudflareContext();
  const featured = parseSlugList((await getPublicSettings(env)).featured?.industries.join(",") ?? "");
  const all = getProducts();
  const cats = getCategories();
  const countries = getCountries();
  const r = shopProducts(all, q, featured);
  const filtering = !!(q.q || q.category || q.country);
  const popular = shopProducts(all, { ...q, q: "", category: "", country: "", sort: "relevance", page: 1 }, featured).items.slice(0, 4);
  const international = all.filter((p) => p.countrySlug !== "united-states");
  const hasRealPrices = all.some((p) => !p.placeholderData);
  const geo = await allCoverage(getDb());
  const byId = new Map(geo.areas.map((a) => [a.id, a]));
  const places = new Map<string, { name: string; href: string }>();
  for (const cv of geo.coverage) {
    const a = byId.get(cv.areaId);
    const par = a?.parentId ? byId.get(a.parentId) : null;
    if (!a || cv.recordCount <= 0 || !a.indexable || (a.parentId && !par)) continue;
    const key = `${a.countrySlug}/${par?.slug ?? ""}/${a.slug}`;
    if (!places.has(key)) places.set(key, { name: par ? `${a.name}, ${par.name}` : a.name, href: `/lists/${cv.categorySlug}/${a.countrySlug}/${par ? `${par.slug}/` : ""}${a.slug}` });
  }
  const regionLinks = [...places.values()].slice(0, 60);
  const sortLabel: Record<(typeof SORTS)[number], string> = { relevance: "Relevance", availability: "Availability", "price-low": "Price: low to high", "price-high": "Price: high to low" };
  const noMatchHref = q.q ? customListHref(q.q) : "/custom-list";

  const tab = (t: "b2b" | "b2c", label: string) => <Link href={t === "b2b" ? "/shop" : "/shop?type=b2c"} aria-current={type === t ? "page" : undefined} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${type === t ? "bg-forest-900 text-sand-50" : "border border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>{label}</Link>;

  return (
    <>
      <Breadcrumbs items={[{ name: "Shop", href: "/shop" }]} />
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-2">
        <h1 className="display text-5xl text-forest-900 sm:text-7xl">Find the database you need.</h1>
        <p className="mt-4 max-w-2xl text-lg">Browse ready-made business contact databases by industry, country, state and city. Check a masked sample first, pay once, own the list.</p>
        <form action="/shop" role="search" className="mt-7 flex max-w-2xl gap-3">
          <label htmlFor="shop-q" className="sr-only">Search databases</label>
          <input id="shop-q" name="q" defaultValue={q.q} placeholder="Search by industry or country, e.g. dentists" className={`${field} flex-1`} />
          <Button type="submit" size="lg">Search</Button>
        </form>
        <div className="mt-6 flex flex-wrap gap-2" role="navigation" aria-label="Audience">{tab("b2b", "B2B databases")}{tab("b2c", "B2C databases")}</div>
      </section>

      {type === "b2c" ? (
        <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-3xl px-4">
          <h2 className="display text-4xl text-forest-900">Consumer databases are not available yet.</h2>
          <p className="mt-4">BeigeLeads currently provides business contact data only. We do not sell consumer contact lists. If you need one, tell us what you are looking for and we will tell you honestly what is possible.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/custom-list">Request a custom list</Link></Button><Button asChild variant="secondary" size="lg"><Link href="/shop">See B2B databases</Link></Button></div>
        </div></section>
      ) : (
        <>
          <section className="border-t border-sand-200 py-10"><div className="mx-auto max-w-6xl px-4">
            <form action="/shop" className="flex flex-wrap items-end gap-3">
              {q.q && <input type="hidden" name="q" value={q.q} />}
              <div><label htmlFor="f-c" className="mb-1 block text-xs font-bold text-forest-900">Industry</label><select id="f-c" name="category" defaultValue={q.category} className={field}><option value="">All industries</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
              <div><label htmlFor="f-k" className="mb-1 block text-xs font-bold text-forest-900">Country</label><select id="f-k" name="country" defaultValue={q.country} className={field}><option value="">All countries</option>{countries.map((k) => <option key={k.slug} value={k.slug}>{k.name}</option>)}</select></div>
              <div><label htmlFor="f-s" className="mb-1 block text-xs font-bold text-forest-900">Sort by</label><select id="f-s" name="sort" defaultValue={q.sort} className={field}>{SORTS.filter((s) => hasRealPrices || !s.startsWith("price")).map((s) => <option key={s} value={s}>{sortLabel[s]}</option>)}</select></div>
              <Button type="submit" variant="secondary" size="lg">Apply</Button>
              {filtering && <Link href="/shop" className="pb-3 text-sm font-semibold underline">Clear filters</Link>}
            </form>
            <h2 className="display mt-8 text-3xl text-forest-900">{filtering ? "Matching databases" : "All databases"}</h2>
            {r.items.length ? (
              <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{r.items.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
            ) : (
              <div className="mt-5 rounded-2xl border border-sand-300 bg-sand-100 p-6"><p className="font-semibold text-forest-900">We do not have a ready-made database for that yet.</p><p className="mt-1 text-sm">Describe what you need and we will tell you what is possible.</p><Button asChild className="mt-4"><Link href={noMatchHref}>Build my custom list</Link></Button></div>
            )}
            {r.pages > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
                <span>Page {r.page} of {r.pages} · {PAGE_SIZE} per page</span>
                <span className="flex gap-2">
                  {r.page > 1 && <Link rel="prev" href={shopHref({ ...q, page: r.page - 1 })} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Previous</Link>}
                  {r.page < r.pages && <Link rel="next" href={shopHref({ ...q, page: r.page + 1 })} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Next</Link>}
                </span>
              </nav>
            )}
          </div></section>

          {!filtering && popular.length > 0 && (
            <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-6xl px-4"><h2 className="display text-4xl text-forest-900">Popular databases</h2><ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{popular.map((p) => <ProductCard key={p.slug} p={p} />)}</ul></div></section>
          )}
          {!filtering && international.length > 0 && (
            <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4"><h2 className="display text-4xl text-forest-900">International databases</h2><ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{international.map((p) => <ProductCard key={p.slug} p={p} />)}</ul></div></section>
          )}

          <section id="industries" className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900">Browse by industry</h2>
            <ul className="mt-6 flex flex-wrap gap-2">{cats.map((c) => <li key={c.slug}><Link href={`/lists/${c.slug}`} className="inline-flex rounded-full border border-forest-900 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{c.name}</Link></li>)}</ul>
          </div></section>
          <section id="countries" className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900">Browse by country</h2>
            <ul className="mt-6 flex flex-wrap gap-2">{countries.map((k) => <li key={k.slug}><Link href={shopHref({ country: k.slug })} className="inline-flex rounded-full border border-forest-900 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{k.name}</Link></li>)}</ul>
            <p className="mt-4 text-sm">More countries are added list by list. Need another one? <Link href="/custom-list" className="font-semibold underline">Request it</Link>.</p>
          </div></section>
          {regionLinks.length > 0 && (
            <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4">
              <h2 className="display text-4xl text-forest-900">Browse by state and city</h2>
              <ul className="mt-6 flex flex-wrap gap-2">{regionLinks.map((p) => <li key={p.href}><Link href={p.href} className="inline-flex rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 hover:border-forest-900">{p.name}</Link></li>)}</ul>
              <p className="mt-4 text-sm">Only places where we have recorded real inventory are listed.</p>
            </div></section>
          )}
        </>
      )}

      <section className="border-t border-sand-200 bg-forest-900 py-14 text-sand-50"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <div><h2 className="display text-3xl">Can&apos;t find your list?</h2><p className="mt-1 text-sand-200">Describe the industry, place and size you need.</p></div>
        <Button asChild size="lg"><Link href="/custom-list">Build my custom list</Link></Button>
      </div></section>
      <Faq heading="Shop questions" items={[
        ["Do I need an account?", "No. You pay once in crypto and receive a download link by email."],
        ["Can I check the data first?", "Yes. Every list page shows a masked sample, and you can request a free sample file by email."],
        ["Are consumer databases available?", "Not yet. BeigeLeads currently provides business contact data only."],
        ["What if my industry or country is missing?", "Request it on the custom list page. New industries and countries are added over time."],
      ]} />
    </>
  );
}
