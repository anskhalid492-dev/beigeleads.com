"use client";
import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { useId, useState } from "react";

export type PlaceItem = { name: string; href: string; records: number | null };
const FIRST = 12;

/** A grid of real places (states or cities) with their recorded record counts. Every place is in the HTML; search and "show all" only hide. */
export function PlaceSection({ title, lead, places, noun }: { title: string; lead: string; places: PlaceItem[]; noun: string }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const t = q.trim().toLowerCase();
  const sorted = [...places].sort((a, b) => a.name.localeCompare(b.name));
  const match = sorted.filter((p) => !t || p.name.toLowerCase().includes(t));
  const visible = new Set((t || all ? match : match.slice(0, FIRST)).map((p) => p.href));
  const hidden = match.length - visible.size;
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">{title}</h2><p className="mt-3 max-w-[60ch]">{lead}</p></div>
        {places.length > FIRST && (
          <div className="relative w-full md:w-72">
            <label htmlFor={id} className="sr-only">Search {noun}</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-forest-700" aria-hidden />
            <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${noun}`} className="h-11 w-full rounded-full border border-sand-300 bg-white pl-10 pr-4 text-sm text-forest-900 outline-none focus-visible:border-forest-900 focus-visible:ring-2 focus-visible:ring-purple-600" />
          </div>
        )}
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <li key={p.href} hidden={!visible.has(p.href)}>
            <Link href={p.href} className="group flex items-center gap-4 rounded-2xl border border-sand-300 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-forest-900 hover:shadow-[0_14px_28px_-20px_rgba(15,42,29,.6)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-forest-300 transition-colors group-hover:bg-purple-600 group-hover:text-white"><MapPin className="size-5" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-forest-900">{p.name}</span>
                <span className="block text-sm">{p.records ? `${p.records.toLocaleString("en-US")} records` : "No inventory yet"}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-forest-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-600" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {t && match.length === 0 && <p className="mt-4 text-sm">No {noun} match your search.</p>}
      {!t && places.length > FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-6 inline-flex h-11 items-center rounded-full border border-forest-900 px-6 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{all ? `Show fewer ${noun}` : `Show all ${noun}${hidden > 0 ? ` (${hidden} more)` : ""}`}</button>
      )}
    </div>
  );
}
