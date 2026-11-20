import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Lightbulb } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { DbBadge } from "@/components/shared/db-icon";
import { ctaFor, type TermView } from "@/lib/glossary/public";
import { SITE_URL } from "@/lib/site";
import { headingsOf, RichText } from "./rich";

const wrap = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export function TermPage({ v, preview = false }: { v: TermView; preview?: boolean }) {
  const e = v.entry;
  const cta = ctaFor(e.category);
  const url = `${SITE_URL}/glossary/${e.slug}`;
  const toc = [
    ...(e.content ? [{ id: "meaning", text: "What it means" }, ...headingsOf(e.content)] : []),
    ...(e.whyItMatters ? [{ id: "why", text: "Why it matters" }] : []),
    ...(e.example ? [{ id: "example", text: "Example" }] : []),
    ...(v.guides.length ? [{ id: "guides", text: "Related guides" }] : []),
    ...(v.products.length ? [{ id: "lists", text: "Related lists" }] : []),
  ];
  return (
    <>
      {preview && <div role="status" className="sticky top-0 z-30 bg-purple-100 px-4 py-2 text-center text-sm font-semibold text-forest-900">Preview: this is how the page looks. {e.status === "draft" ? "It is a draft and is not public." : "It is published."}</div>}
      <Breadcrumbs wide items={[{ name: "Glossary", href: "/glossary" }, { name: e.term, href: `/glossary/${e.slug}` }]} />
      <header className={`${wrap} pb-10 pt-2 sm:pb-12`}>
        {v.category && <Link href={`/glossary?category=${v.category.slug}`} className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><BookOpen className="size-3.5" aria-hidden />{v.category.name}</Link>}
        <h1 className="display mt-4 max-w-4xl text-[3rem] leading-[0.95] text-forest-900 sm:text-[4.6rem]">{e.term}</h1>
        <p className="mt-5 max-w-[46rem] border-l-4 border-forest-500 pl-5 text-[1.3rem] leading-snug text-forest-900 sm:text-[1.5rem]">{e.shortDefinition}</p>
      </header>

      <div className={`${wrap} grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16`}>
        <article className="min-w-0 max-w-[46rem]">
          {e.content && <section aria-labelledby="meaning"><h2 id="meaning" className="display scroll-mt-28 text-[2.1rem] leading-none text-forest-900">What it means</h2><RichText text={e.content} className="mt-5" /></section>}
          {e.whyItMatters && <section aria-labelledby="why" className="mt-12 rounded-2xl bg-forest-100 p-6 sm:p-8"><h2 id="why" className="display scroll-mt-28 text-[1.9rem] leading-none text-forest-900">Why it matters</h2><RichText text={e.whyItMatters} className="mt-4" /></section>}
          {e.example && <section aria-labelledby="example" className="mt-8 rounded-2xl border border-sand-300 bg-sand-100 p-6 sm:p-8"><h2 id="example" className="display flex scroll-mt-28 items-center gap-3 text-[1.9rem] leading-none text-forest-900"><Lightbulb className="size-6 text-forest-500" aria-hidden />Example</h2><RichText text={e.example} className="mt-4" /></section>}

          {v.guides.length > 0 && (
            <section aria-labelledby="guides" className="mt-14">
              <h2 id="guides" className="display scroll-mt-28 text-[1.9rem] leading-none text-forest-900">Related guides</h2>
              <ul className="mt-5 divide-y divide-sand-300 border-y border-sand-300">
                {v.guides.map((g) => <li key={g.href}><Link href={g.href} className="group flex items-start justify-between gap-4 py-4"><span><span className="block font-bold text-forest-900 group-hover:underline">{g.title}</span>{g.excerpt && <span className="mt-1 block text-sm">{g.excerpt.length > 150 ? g.excerpt.slice(0, 147).replace(/\s+\S*$/, "") + "…" : g.excerpt}</span>}</span><ArrowUpRight className="mt-1 size-5 shrink-0 text-forest-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></Link></li>)}
              </ul>
            </section>
          )}

          {v.products.length > 0 && (
            <section aria-labelledby="lists" className="mt-14">
              <h2 id="lists" className="display scroll-mt-28 text-[1.9rem] leading-none text-forest-900">Related lists</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {v.products.map((p) => <li key={p.slug} className="group relative flex gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-md motion-reduce:transition-none"><DbBadge category={p.categorySlug} country={p.scope === "city" || p.countrySlug ? (p.countrySlug === "germany" ? "DE" : "US") : undefined} size="sm" /><div className="min-w-0"><p className="font-bold text-forest-900"><Link href={`/lists/${p.slug}`} className="after:absolute after:inset-0 after:rounded-2xl">{p.name}</Link></p><p className="mt-1 line-clamp-2 text-sm">{p.description}</p></div></li>)}
              </ul>
            </section>
          )}
        </article>

        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          {toc.length > 1 && (
            <nav aria-label="On this page" className="hidden lg:block">
              <p className="text-sm font-bold text-forest-900">On this page</p>
              <ul className="mt-3 space-y-2 border-l border-sand-300 pl-4 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="hover:text-forest-900 hover:underline">{t.text}</a></li>)}</ul>
            </nav>
          )}
          {v.related.length > 0 && (
            <div>
              <p className="text-sm font-bold text-forest-900">Related terms</p>
              <ul className="mt-3 flex flex-wrap gap-2">{v.related.map((r) => <li key={r.slug}><Link href={`/glossary/${r.slug}`} className="inline-block rounded-full border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900 transition-colors hover:border-forest-900 hover:bg-forest-900 hover:text-sand-50">{r.term}</Link></li>)}</ul>
            </div>
          )}
          <div className="rounded-2xl bg-forest-900 p-6 text-sand-100">
            <p className="display text-[1.6rem] leading-tight !text-sand-50">{cta.title}</p>
            <p className="mt-2 text-sm text-sand-200">{cta.text}</p>
            <Link href={cta.href} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">{cta.label}<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </aside>
      </div>

      {v.sameCategory.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-12">
          <div className={wrap}>
            <h2 className="display text-[1.9rem] leading-none text-forest-900">More in {v.category?.name ?? "the glossary"}</h2>
            <ul className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">{v.sameCategory.map((c) => <li key={c.slug} className="border-b border-sand-300 py-4"><Link href={`/glossary/${c.slug}`} className="group block"><span className="display text-[1.4rem] leading-tight text-forest-900 group-hover:underline">{c.term}</span><span className="mt-1 line-clamp-2 block text-sm">{c.short}</span></Link></li>)}</ul>
            <p className="mt-6"><Link href="/glossary" className="inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">All glossary terms<ArrowRight className="size-4" aria-hidden /></Link></p>
          </div>
        </section>
      )}

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "DefinedTerm", "@id": `${url}#term`, name: e.term, description: e.shortDefinition, url,
        inDefinedTermSet: { "@type": "DefinedTermSet", "@id": `${SITE_URL}/glossary#set`, name: "BeigeLeads B2B Data & Lead Generation Glossary", url: `${SITE_URL}/glossary` },
      }} />
    </>
  );
}
