"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DbBadge } from "@/components/shared/db-icon";
import type { Category } from "@/lib/catalog";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function CategoryIndex({ categories }: { categories: readonly Category[] }) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = categories.filter((c) => c.name.toLowerCase().includes(term));
    const map = new Map<string, Category[]>();
    for (const c of [...list].sort((a, b) => a.name.localeCompare(b.name))) {
      const l = c.name[0].toUpperCase();
      map.set(l, [...(map.get(l) ?? []), c]);
    }
    return map;
  }, [categories, q]);

  const present = new Set(categories.map((c) => c.name[0].toUpperCase()));

  return (
    <div>
      <label className="relative block max-w-md">
        <span className="sr-only">Search categories</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories"
          className="h-12 w-full rounded-full border border-sand-300 bg-white pl-11 pr-4 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        />
      </label>

      <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1">
        {LETTERS.map((l) =>
          present.has(l) && groups.has(l) ? (
            <a
              key={l}
              href={`#letter-${l}`}
              className="flex size-9 items-center justify-center rounded-md border border-forest-900 bg-white text-sm font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50"
            >
              {l}
            </a>
          ) : (
            <span
              key={l}
              aria-hidden
              className="flex size-9 items-center justify-center rounded-md text-sm text-sand-300"
            >
              {l}
            </span>
          ),
        )}
      </nav>

      <div className="mt-10 space-y-10">
        {[...groups.entries()].map(([letter, items]) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
            <h2 className="display border-b-2 border-forest-900 pb-2 text-4xl text-forest-900">{letter}</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/lists/${c.slug}`}
                    className="group flex h-full flex-col justify-between rounded-2xl border border-sand-300 bg-sand-100 p-5 transition-colors hover:border-forest-900 hover:bg-forest-900"
                  >
                    <span className="flex items-center gap-4">
                      <DbBadge category={c.slug} country="US" tone="light" />
                      <span className="display text-3xl text-forest-900 group-hover:text-sand-50">{c.name}</span>
                    </span>
                    <span className="mt-6 text-sm text-forest-700 group-hover:text-sand-200">{c.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.size === 0 && (
          <p className="rounded-2xl border border-sand-300 bg-sand-100 p-6">
            No category matches “{q}”.{" "}
            <Link href="/request-category" className="font-semibold underline underline-offset-4">
              Ask for it
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
