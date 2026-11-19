import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CategoryBrowser } from "@/components/help/category-browser";
import { CategoryIcon } from "@/components/help/icons";
import { JsonLd } from "@/components/shared/json-ld";
import { TopicNav } from "@/components/help/topic-nav";
import { readingMinutes } from "@/lib/help";
import { articleHref, articlesIn, getCategory, groupedArticles } from "@/lib/help/data";
import { getHelp } from "@/lib/help/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/help/[category]">): Promise<Metadata> {
  const c = getCategory(await getHelp(), (await props.params).category);
  if (!c) return {};
  return { title: `${c.name} | Help Center`, description: c.description, alternates: { canonical: `/help/${c.slug}` } };
}

export default async function HelpCategoryPage(props: PageProps<"/help/[category]">) {
  const d = await getHelp();
  const c = getCategory(d, (await props.params).category);
  if (!c) notFound();
  const list = articlesIn(d, c.slug);
  const groups = groupedArticles(list).map((g) => ({ title: g.title, items: g.items.map((a) => ({ slug: a.slug, title: a.title, description: a.description, href: articleHref(a), minutes: readingMinutes(a) })) }));
  return (
    <>
      <Breadcrumbs wide items={[{ name: "Help Center", href: "/help-center" }, { name: c.name, href: `/help/${c.slug}` }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside aria-label="Help topics" className="hidden lg:block"><div className="sticky top-28"><TopicNav data={d} category={c.slug} /></div></aside>
          <div className="max-w-3xl">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700"><CategoryIcon name={c.icon} className="size-6" /></span>
              <div>
                <h1 className="display text-5xl text-forest-900 sm:text-6xl">{c.name}</h1>
                <p className="mt-2 text-lg">{c.description} <span className="whitespace-nowrap font-semibold text-forest-900">{list.length} articles</span></p>
              </div>
            </div>
            <div className="mt-8"><CategoryBrowser groups={groups} topic={c.name} /></div>
            <p className="mt-10 rounded-2xl border border-sand-200 bg-sand-100 p-5 text-base">Not here? <Link href="/help-center" className="font-semibold text-forest-900 underline underline-offset-4">Search the whole Help Center</Link> or <Link href="/contact" className="font-semibold text-forest-900 underline underline-offset-4">contact support</Link>.</p>
          </div>
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${c.name} | BeigeLeads Help Center`, url: `${SITE_URL}/help/${c.slug}`, description: c.description, hasPart: list.map((a) => ({ "@type": "TechArticle", headline: a.title, url: `${SITE_URL}${articleHref(a)}` })) }} />
    </>
  );
}
