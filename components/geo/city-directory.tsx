"use client";
import Link from "next/link";
import { useState } from "react";

export type Place = { name: string; href: string; records: number | null };

/** Searchable list of places. All names are in the HTML (crawlable); the box only hides the ones that do not match. */
export function PlaceDirectory({ places, label, empty }: { places: Place[]; label: string; empty: string }) {
  const [q, setQ] = useState("");
  const shown = places.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      {places.length > 8 && (
        <div className="mb-4"><label className="sr-only" htmlFor="place-q">{label}</label>
          <input id="place-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={label} className="w-full max-w-sm rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-purple-600" /></div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((p) => (
          <li key={p.href} hidden={!shown.includes(p)}>
            <Link href={p.href} className="flex items-center justify-between gap-3 rounded-xl border border-sand-300 bg-sand-50 px-5 py-4 font-semibold text-forest-900 hover:border-forest-900">
              <span>{p.name}</span>
              <span className="text-xs font-medium text-forest-700">{p.records ? `${p.records.toLocaleString("en-US")} records` : "No inventory yet"}</span>
            </Link>
          </li>
        ))}
      </ul>
      {q && shown.length === 0 && <p className="mt-3 text-sm">{empty}</p>}
    </div>
  );
}
