import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Body, slugify } from "@/components/help/rich";
import { HELP_UPDATED, articleHref, getArticle, getCategory, helpArticles, relatedOf } from "@/lib/help";

export const dynamicParams = false;
export const generateStaticParams = () => helpArticles.map((a) => ({ category: a.category, article: a.slug }));

export async function generateMetadata(props: PageProps<"/help/[category]/[article]">): Promise<Metadata> {
  const { category, article } = await props.params;
  const a = getArticle(category, article);
  if (!a) return {};
  return { title: a.title, description: a.description, alternates: { canonical: articleHref(a) } };
}

const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function HelpArticlePage(props: PageProps<"/help/[category]/[article]">) {
  const { category, article } = await props.params;
  const a = getArticle(category, article);
  const c = getCategory(category);
  if (!a || !c) notFound();
  const toc = a.body.filter((b) => b[0] === "h").map((b) => ({ id: slugify(b[1] as string), label: b[1] as string }));
  const related = relatedOf(a);
  const isPolicy = a.category === "privacy-compliance" || a.category === "troubleshooting";

  return (
    <>
      <Breadcrumbs items={[{ name: "Help Center", href: "/help-center" }, { name: c.name, href: `/help/${c.slug}` }, { name: a.title, href: articleHref(a) }]} />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_16rem]">
          <article className="min-w-0 max-w-3xl">
            <p className="text-sm font-bold text-forest-500">{c.name}</p>
            <h1 className="display mt-2 text-5xl text-forest-900 sm:text-6xl">{a.title}</h1>
            <p className="mt-4 text-xl text-forest-700">{a.description}</p>
            <p className="mt-3 text-sm">Last updated {fmt(a.updated ?? HELP_UPDATED)}</p>
            {toc.length > 1 && (
              <details className="mt-6 rounded-2xl border border-sand-200 bg-white p-4 lg:hidden">
                <summary className="cursor-pointer font-bold text-forest-900">On this page</summary>
                <ul className="mt-3 space-y-2 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="underline underline-offset-4">{t.label}</a></li>)}</ul>
              </details>
            )}
            <div className="mt-8"><Body blocks={a.body} /></div>

            {a.cta && !isPolicy && (
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest-900 p-6">
                <p className="max-w-sm text-lg font-semibold text-sand-50">Ready to take the next step?</p>
                <Link href={a.cta.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700">{a.cta.label} <ArrowRight className="size-4" aria-hidden /></Link>
              </div>
            )}

            {related.length > 0 && (
              <section className="mt-12" aria-labelledby="rel">
                <h2 id="rel" className="display text-3xl text-forest-900">Related articles</h2>
                <ul className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
                  {related.map((r) => <li key={r.slug}><Link href={articleHref(r)} className="flex items-center justify-between gap-4 px-5 py-4 font-semibold text-forest-900 hover:bg-sand-50">{r.title}<ArrowRight className="size-4 shrink-0" aria-hidden /></Link></li>)}
                </ul>
              </section>
            )}

            <section className="mt-10 rounded-2xl border border-sand-200 bg-sand-100 p-6">
              <p className="font-bold text-forest-900">Still need help?</p>
              <p className="mt-1 text-base">Send us a message and include your order ID if you have one.</p>
              <Link href="/contact" className="mt-4 inline-flex h-10 items-center rounded-full border border-sand-300 bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-sand-50">Contact support</Link>
            </section>
          </article>

          <aside aria-label="Article navigation" className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {toc.length > 1 && (
                <nav aria-label="On this page">
                  <p className="text-sm font-bold text-forest-900">On this page</p>
                  <ul className="mt-3 space-y-2 border-l border-sand-300 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-4 hover:border-forest-900 hover:text-forest-900">{t.label}</a></li>)}</ul>
                </nav>
              )}
              <nav aria-label="Back to topic">
                <Link href={`/help/${c.slug}`} className="text-sm font-bold text-forest-900 underline underline-offset-4">All {c.name} articles</Link>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
