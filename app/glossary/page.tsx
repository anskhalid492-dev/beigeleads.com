import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { GlossaryBrowser } from "@/components/glossary/browser";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { getDbFromEnv } from "@/lib/db";
import { getCategories, publishedCards } from "@/lib/glossary/store";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const any = (await publishedCards(getDbFromEnv(getCloudflareContext().env))).length > 0;
  return {
    title: "B2B Data & Lead Generation Glossary",
    description: "Plain-English definitions of B2B data, email verification, cold email, data enrichment, CRM and compliance terms, with examples.",
    alternates: { canonical: "/glossary" },
    ...(any ? {} : { robots: { index: false, follow: true } }), // an empty glossary is not worth indexing
  };
}

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const db = getDbFromEnv(getCloudflareContext().env);
  const [cards, categories, sp] = await Promise.all([publishedCards(db), getCategories(db), searchParams]);
  return (
    <>
      <Breadcrumbs wide items={[{ name: "Glossary", href: "/glossary" }]} />
      {cards.length === 0 ? (
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="display text-[3rem] leading-none text-forest-900">The B2B Data &amp; Lead Generation Glossary</h1>
          <p className="mt-4 text-lg">The glossary is being prepared. Terms will appear here as soon as they are published.</p>
          <p className="mt-6"><Link href="/help-center" className="font-semibold underline underline-offset-4">Visit the Help Center</Link></p>
        </section>
      ) : <GlossaryBrowser cards={cards} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} initialCategory={sp.category ?? ""} />}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "B2B Data & Lead Generation Glossary", url: `${SITE_URL}/glossary`,
        mainEntity: { "@type": "DefinedTermSet", "@id": `${SITE_URL}/glossary#set`, name: "BeigeLeads B2B Data & Lead Generation Glossary", url: `${SITE_URL}/glossary` },
      }} />
    </>
  );
}
