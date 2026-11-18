"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { customListHref, searchCatalog } from "@/lib/search";
import { getCategory } from "@/lib/catalog";

/** A small version of the home-page lead search. Same structured catalog lookup, no AI, no invented counts. */
export function MiniSearch({ examples }: { examples: readonly string[] }) {
  const id = useId();
  const [q, setQ] = useState("");
  const res = q.trim().length >= 2 ? searchCatalog(q) : null;

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_20px_50px_-32px_rgba(15,42,29,0.5)]">
      <label htmlFor={id} className="text-sm font-semibold text-forest-900">Try a search</label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
        <input
          id={id} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder="e.g. dentists in the US"
          className="w-full rounded-xl border border-sand-300 bg-white py-3 pl-10 pr-4 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Example searches">
        {examples.map((e) => (
          <button key={e} type="button" onClick={() => setQ(e)} className="rounded-full border border-sand-300 bg-sand-50 px-3 py-1 text-sm font-medium text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">{e}</button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 min-h-16 text-sm">
        {!res && <p>Pick an example or type your own. Results come from the real catalog.</p>}
        {res && res.exact.length > 0 && (
          <ul className="space-y-2">
            {res.exact.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-forest-100 bg-forest-100/60 px-4 py-3 font-semibold text-forest-900 hover:bg-forest-100">
                  <span>{p.title}<span className="block text-xs font-normal">{getCategory(p.categorySlug)?.blurb}</span></span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {res && res.exact.length === 0 && res.close.length > 0 && (
          <ul className="space-y-2">
            {res.close.map(({ product, note }) => (
              <li key={product.slug} className="rounded-xl border border-sand-300 bg-sand-50 px-4 py-3">
                <Link href={`/product/${product.slug}`} className="font-semibold text-forest-900 underline underline-offset-4">{product.title}</Link>
                <span className="block">{note}</span>
              </li>
            ))}
          </ul>
        )}
        {res && res.exact.length === 0 && res.close.length === 0 && (
          <p>We couldn&rsquo;t find an exact match. <Link href={customListHref(q)} className="font-semibold text-forest-900 underline underline-offset-4">Build my custom list</Link></p>
        )}
      </div>
    </div>
  );
}
