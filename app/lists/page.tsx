import type { Metadata } from "next";
import { PromoBanner } from "@/components/promos/banner";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SolutionFaq } from "@/components/solutions/sections";
import { ListsCatalog } from "@/components/lists/lists-catalog";
import { ListsDirectory } from "@/components/lists/lists-directory";
import { basketLabels } from "@/lib/hero-basket";
import { ListsHero } from "@/components/lists/lists-hero";
import { Button } from "@/components/ui/button";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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

  const tax = await getTax();

  return (
    <>
      <div className="mx-auto max-w-7xl px-4"><Breadcrumbs items={[{ name: "Lists", href: "/lists" }]} /></div>
      <PromoBanner place="lists" className="mb-3 mx-4" />
      <ListsHero audience={f.type} industries={data.industries} countries={data.countries} tree={data.tree} niches={data.niches.map((n) => ({ name: n.name }))} basket={basketLabels(data.industries, tax)} />
      <ul className="mx-auto mt-5 flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 text-sm font-semibold text-forest-900">{TRUST.map((t) => <li key={t} className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-forest-500" aria-hidden />{t}</li>)}</ul>

      {f.type === "b2c" ? (
        <section id="databases" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14">
          <h2 className="display text-4xl text-forest-900">Consumer databases are not available yet.</h2>
          <p className="mt-4">BeigeLeads currently provides business contact data only. We do not sell consumer contact lists. If you need a prospect segment, tell us what you are looking for and we will tell you honestly what is possible.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button><Button asChild variant="secondary" size="lg"><Link href="/lists">Browse B2B Lists</Link></Button></div>
        </section>
      ) : (
        <ListsCatalog key={listsHref(f)} data={data} initial={f} featured={featured} />
      )}

      <ListsDirectory industries={data.industries.map((i) => ({ slug: i.slug, name: i.name, blurb: i.blurb ?? "" }))} tree={data.tree} products={data.products} niches={data.niches.map((n) => ({ category: n.category, name: n.name }))} productCats={productCats} />

      <section className="border-t border-sand-200 bg-forest-900 py-14 text-sand-50"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <div><h2 className="display text-3xl !text-sand-50">Can&apos;t find your list?</h2><p className="mt-1 text-sand-200">Describe the industry, place and size you need.</p></div>
        <Button asChild size="lg"><Link href="/custom-list">Build My Custom List</Link></Button>
      </div></section>
      <SolutionFaq name="Our Lists" items={[
        ["Do I need an account?", "No. You pay once in crypto and receive a download link by email."],
        ["Can I check the data first?", "Yes. Masked sample on every list page, and you can request a free sample file by email."],
        ["Are consumer databases available?", "Not yet. BeigeLeads currently provides business contact data only."],
        ["Is a city page a separate list?", "No. City and state pages are views of the national list for that industry. They are shown only where we have recorded real inventory."],
        ["What if my industry or country is missing?", "Request it on the custom list page. New industries and countries are added over time."],
      ]} />
    </>
  );
}
