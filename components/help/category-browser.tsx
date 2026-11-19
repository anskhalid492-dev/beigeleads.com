"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

type Item = { slug: string; title: string; description: string; href: string; minutes: number };
type Group = { title: string; items: Item[] };

export function CategoryBrowser({ groups, topic }: { groups: Group[]; topic: string }) {
  const [q, setQ] = useState("");
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const t = q.trim().toLowerCase();
  const shown = useMemo(() => groups.map((g) => ({ ...g, items: t ? g.items.filter((i) => `${i.title} ${i.description}`.toLowerCase().includes(t)) : g.items })).filter((g) => g.items.length), [groups, t]);
  const count = shown.reduce((n, g) => n + g.items.length, 0);
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Filter {topic} articles</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-forest-500" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${total} articles in ${topic}`} className="h-12 w-full rounded-full border border-sand-300 bg-white pl-12 pr-5 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600" />
      </label>
      <p className="sr-only" role="status" aria-live="polite">{count} articles shown</p>
      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-8 text-center">
          <p className="text-lg font-bold text-forest-900">No article in this topic matches &ldquo;{q}&rdquo;.</p>
          <p className="mt-1">Try a shorter word, or use the main search on the Help Center home page.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-semibold">
            <button type="button" onClick={() => setQ("")} className="rounded-full border border-sand-300 px-5 py-2 text-forest-900 hover:bg-sand-100">Clear filter</button>
            <Link href="/contact" className="rounded-full bg-purple-600 px-5 py-2 text-white hover:bg-purple-700">Contact support</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {shown.map((g) => (
            <section key={g.title} aria-label={g.title}>
              <h2 className="text-sm font-bold text-forest-500">{g.title}</h2>
              <ul className="mt-2 divide-y divide-sand-200 overflow-hidden rounded-2xl border border-sand-200 bg-white">
                {g.items.map((a) => (
                  <li key={a.slug}>
                    <Link href={a.href} className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-purple-600">
                      <span><span className="block text-lg font-bold text-forest-900">{a.title}</span><span className="mt-0.5 block text-base">{a.description}</span><span className="mt-1 block text-xs">{a.minutes} min read</span></span>
                      <ArrowRight className="size-4 shrink-0 text-forest-500 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
