import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BundleBuilder } from "@/components/bundles/builder";
import { BundleCard } from "@/components/bundles/bundle-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { hydrateCatalog } from "@/lib/catalog-db";
import { facets } from "@/lib/bundles/builder";
import { BUNDLES_FAQS } from "@/lib/bundles/content";
import { loadBundlesView } from "@/lib/bundles/public";
import { loadBuilderSettings } from "@/lib/bundles/settings";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const TITLE = "Database Bundles: Save on Multiple B2B Email Lists";
const DESC = "Explore carefully selected database bundles designed to help you reach more prospects across industries and markets, all in one convenient purchase. Or build your own bundle.";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<Metadata> {
  const filtered = !!(await searchParams).category;
  return {
    title: { absolute: TITLE }, description: DESC, alternates: { canonical: "/bundles" },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: TITLE, description: DESC, url: "/bundles", type: "website" },
  };
}

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-6xl";
const primary = "inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const secondary = "inline-flex h-12 items-center rounded-full border border-forest-900/25 bg-white px-7 font-semibold text-forest-900 transition-colors hover:border-purple-600 hover:text-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export default async function BundlesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const env = getCloudflareContext().env;
  const sp = await searchParams;
  await hydrateCatalog(env);
  const [{ bundles, categories }, builder] = await Promise.all([loadBundlesView(env), loadBuilderSettings(env)]);
  const active = categories.find((c) => c.slug === sp.category)?.slug ?? "";
  const shown = active ? bundles.filter((b) => b.categorySlug === active) : bundles;
  const f = builder.enabled ? facets(builder, env.CHECKOUT_ALLOW_PLACEHOLDER === "true") : { countries: [], categories: [] };
  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${on ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`;
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sand-100 to-sand-50">
        <Breadcrumbs wide items={[{ name: "Bundles", href: "/bundles" }]} />
        <div className={`${wrap} pb-16 pt-6 lg:pb-24`}>
          <div className="hero-in max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-500">Database Bundles</p>
            <h1 className="display mt-4 text-6xl text-forest-900 sm:text-7xl xl:text-[6.25rem]">More Data. Better Value.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed">Explore carefully selected database bundles designed to help you reach more prospects across industries and markets&mdash;all in one convenient purchase.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#bundles" className={primary}>Explore Bundles</a>
              {builder.enabled && <a href="#builder" className={secondary}>Build Your Own Bundle</a>}
            </div>
          </div>
        </div>
      </section>

      <section id="bundles" aria-labelledby="bundles-h" className={`${wrap} scroll-mt-24 py-16 lg:py-20`}>
        <h2 id="bundles-h" className={h2}>Ready-made bundles</h2>
        <p className="mt-4 max-w-2xl text-lg">Each bundle lists every database inside it and what they cost one by one, so you can check the saving yourself.</p>
        {categories.length > 0 && (
          <nav aria-label="Bundle categories" className="mt-8 flex flex-wrap gap-2">
            <Link href="/bundles#bundles" scroll={false} aria-current={active === "" ? "page" : undefined} className={chip(active === "")}>All Bundles</Link>
            {categories.map((c) => <Link key={c.slug} href={`/bundles?category=${c.slug}#bundles`} scroll={false} aria-current={active === c.slug ? "page" : undefined} className={chip(active === c.slug)}>{c.name}</Link>)}
          </nav>
        )}
        {shown.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{shown.map((b, i) => <BundleCard key={b.slug} b={b} priority={i < 3} />)}</div>
        ) : (
          <div className="mt-8 rounded-3xl border border-sand-200 bg-white p-8">
            <p className="text-xl font-bold text-forest-900">Ready-made bundles are being prepared.</p>
            <p className="mt-2 max-w-xl">We only publish a bundle when every database in it is on sale at a real price. {builder.enabled ? "You can already build your own bundle below." : "In the meantime you can browse single databases or ask for a custom list."}</p>
            <div className="mt-5 flex flex-wrap gap-3"><Link href="/lists" className={primary}>Browse Lists</Link><Link href="/custom-list" className={secondary}>Custom List</Link></div>
          </div>
        )}
      </section>

      {builder.enabled && (
        <section id="builder" aria-labelledby="builder-h" className="scroll-mt-24 border-y border-sand-200 bg-sand-100 py-16 lg:py-20">
          <div className={wrap}>
            <h2 id="builder-h" className={h2}>Build Your Own Database Bundle</h2>
            <p className="mt-4 max-w-2xl text-lg">Choose the databases you need and unlock available multi-database savings.</p>
            <div className="mt-10"><BundleBuilder countries={f.countries} categories={f.categories} /></div>
          </div>
        </section>
      )}

      <SolutionFaq name="Database Bundles" items={BUNDLES_FAQS} />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: TITLE, description: DESC, url: `${SITE_URL}/bundles`,
        ...(bundles.length ? { mainEntity: { "@type": "ItemList", itemListElement: bundles.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/bundles/${b.slug}`, name: b.name })) } } : {}),
      }} />
    </>
  );
}
