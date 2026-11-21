"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Card } from "@/lib/glossary/store";

type Cat = { slug: string; name: string };
const letterOf = (t: string) => { const c = t.trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "");
const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

/** Instant search, category filter and A–Z index. Every published entry is rendered in the HTML, so the links are crawlable. */
export function GlossaryBrowser({ cards, categories, initialCategory = "" }: { cards: Card[]; categories: Cat[]; initialCategory?: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(categories.some((c) => c.slug === initialCategory) ? initialCategory : "");
  const catName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const counts = useMemo(() => { const m = new Map<string, number>(); for (const c of cards) m.set(c.category, (m.get(c.category) ?? 0) + 1); return m; }, [cards]);
  const filtered = useMemo(() => { const s = q.trim().toLowerCase(); return cards.filter((c) => (!cat || c.category === cat) && (!s || norm(c.term).includes(norm(s)) || c.term.toLowerCase().includes(s) || (c.keywords ?? "").toLowerCase().includes(s) || c.short.toLowerCase().includes(s))); }, [cards, q, cat]);
  const groups = useMemo(() => { const g = new Map<string, Card[]>(); for (const c of [...filtered].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base", ignorePunctuation: true }))) { const l = letterOf(c.term); (g.get(l) ?? g.set(l, []).get(l)!).push(c); } return g; }, [filtered]);
  const has = new Set(groups.keys());
  const featured = cards.filter((c) => c.featured).slice(0, 6);
  const filtering = !!q.trim() || !!cat;
  const sample = featured[0] ?? cards[0];

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-[2rem] border border-sand-200 bg-sand-100 p-6 sm:p-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:p-14">
          <div>
            <h1 className="display hero-in text-[2.7rem] leading-[0.95] text-forest-900 sm:text-[4.2rem]">The B2B Data &amp; Lead Generation Glossary</h1>
            <p className="mt-4 max-w-[34rem] text-lg">Plain-English definitions of the terms you meet when you build, verify and use business contact lists.</p>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-7 max-w-xl">
              <label htmlFor="glo-q" className="sr-only">Search the glossary</label>
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-forest-500" aria-hidden />
              <input id="glo-q" type="text" inputMode="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term or acronym, e.g. SPF or bounce rate" autoComplete="off" className="h-14 w-full rounded-full border border-sand-300 bg-white pl-13 pr-12 text-base text-forest-900 shadow-sm placeholder:text-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600" style={{ paddingLeft: "3.25rem" }} />
              {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-forest-900 hover:bg-sand-100"><X className="size-4" aria-hidden /></button>}
            </form>
          </div>
          {sample && (
            <Link href={`/glossary/${sample.slug}`} className="glo-card group relative hidden rotate-[1.5deg] rounded-2xl border border-sand-300 bg-white p-7 shadow-md transition duration-300 hover:rotate-0 hover:shadow-lg motion-reduce:transform-none lg:block">
              <p className="text-sm font-semibold text-forest-500">{catName.get(sample.category) ?? "Glossary"}</p>
              <p className="display mt-2 text-[2.3rem] leading-none text-forest-900">{sample.term}</p>
              <p className="mt-3 line-clamp-4 text-[0.98rem]">{sample.short}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900 group-hover:underline">Read the full entry <ArrowUpRight className="size-4" aria-hidden /></span>
            </Link>
          )}
        </div>
      </section>

      <div className="sticky top-[76px] z-20 mt-6 border-y border-sand-200 bg-sand-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <nav aria-label="Alphabet" className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {LETTERS.map((l) => has.has(l)
              ? <a key={l} href={`#letter-${l === "#" ? "other" : l}`} className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{l}</a>
              : <span key={l} aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full text-sm text-sand-300">{l}</span>)}
          </nav>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by category">
            <button type="button" aria-pressed={!cat} onClick={() => setCat("")} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${!cat ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>All</button>
            {categories.filter((c) => counts.get(c.slug)).map((c) => (
              <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => setCat(cat === c.slug ? "" : c.slug)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${cat === c.slug ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>{c.name} <span className="opacity-60">{counts.get(c.slug)}</span></button>
            ))}
          </div>
        </div>
      </div>

      {!filtering && featured.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="glo-start">
          <h2 id="glo-start" className="display text-[2rem] leading-none text-forest-900">Start here</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <li key={c.slug} className="group relative rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-md motion-reduce:transition-none">
                <p className="text-xs font-semibold text-forest-500">{catName.get(c.category) ?? ""}</p>
                <h3 className="display mt-1 text-[1.5rem] leading-tight text-forest-900"><Link href={`/glossary/${c.slug}`} className="after:absolute after:inset-0 after:rounded-2xl">{c.term}</Link></h3>
                <p className="mt-2 line-clamp-2 text-sm">{c.short}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8" aria-label="All terms" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 p-10 text-center">
            <p className="display text-[1.8rem] text-forest-900">No terms match.</p>
            <p className="mt-2">Try a shorter word, or clear the filters.</p>
            <button type="button" onClick={() => { setQ(""); setCat(""); }} className="mt-4 rounded-full border border-forest-900 px-5 py-2 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Clear filters</button>
          </div>
        ) : (
          [...groups.entries()].map(([l, list]) => (
            <div key={l} id={`letter-${l === "#" ? "other" : l}`} className="grid scroll-mt-48 gap-x-10 border-t border-sand-300 py-6 md:grid-cols-[88px_minmax(0,1fr)]">
              <h2 className="display text-[3.4rem] leading-none text-forest-500 md:sticky md:top-52 md:self-start">{l}</h2>
              <ul className="grid gap-x-10 lg:grid-cols-2">
                {list.map((c) => (
                  <li key={c.slug} className="group relative border-b border-sand-200 py-4 last:border-b-0 lg:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="display text-[1.5rem] leading-tight text-forest-900"><Link href={`/glossary/${c.slug}`} className="after:absolute after:inset-0 group-hover:underline">{c.term}</Link></h3>
                        <p className="mt-1 line-clamp-2 text-sm">{c.short}</p>
                        {catName.get(c.category) && <p className="mt-2 text-xs font-semibold text-forest-500">{catName.get(c.category)}</p>}
                      </div>
                      <ArrowUpRight className="mt-2 size-5 shrink-0 text-sand-300 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple-600 motion-reduce:transition-none" aria-hidden />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
