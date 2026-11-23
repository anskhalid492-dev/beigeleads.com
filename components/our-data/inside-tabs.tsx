"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { FIELD_CATALOG, FIELD_GROUPS, type FieldGroup } from "@/lib/product-fields";

const BLURB: Record<FieldGroup, string> = {
  Business: "Who the business is: name, type, size and how it describes itself.",
  Location: "Where it operates: address, city, region and country.",
  Contact: "How to reach it: email, phone and a named contact where one was found.",
  "Online presence": "Where it shows up online: website, social handles and listings.",
  Operations: "How it runs: details that help you qualify and segment.",
};

/** Premium field explorer: one group at a time, every field named, no counts. */
export function InsideTabs() {
  const [g, setG] = useState<FieldGroup>(FIELD_GROUPS[0]);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const rows = FIELD_CATALOG.filter((x) => x.group === g);
  const move = (e: React.KeyboardEvent, i: number) => {
    const n = FIELD_GROUPS.length;
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); setG(FIELD_GROUPS[to]); refs.current[to]?.focus();
  };
  return (
    <div className="overflow-hidden rounded-[2rem] border border-sand-200 bg-white shadow-[0_24px_60px_-30px_rgba(15,42,29,0.35)]">
      <div className="grid lg:grid-cols-[18rem_1fr]">
        <div role="tablist" aria-label="Field groups" aria-orientation="vertical" className="flex gap-1 overflow-x-auto bg-forest-900 p-3 lg:flex-col lg:overflow-visible lg:p-5">
          {FIELD_GROUPS.map((x, i) => {
            const on = x === g;
            return (
              <button key={x} ref={(el) => { refs.current[i] = el; }} role="tab" id={`${id}-t${i}`} aria-selected={on} aria-controls={`${id}-p`} tabIndex={on ? 0 : -1} onClick={() => setG(x)} onKeyDown={(e) => move(e, i)}
                className={`shrink-0 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${on ? "bg-sand-50 text-forest-900" : "text-sand-200 hover:bg-forest-700/60"}`}>
                <span className="display block text-xl">{x}</span>
                <span className={`mt-0.5 hidden text-sm leading-snug lg:block ${on ? "text-forest-700" : "text-forest-300"}`}>{BLURB[x]}</span>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${FIELD_GROUPS.indexOf(g)}`} className="p-6 sm:p-8 lg:p-10">
          <div key={g} className="od-in">
            <h3 className="display text-3xl text-forest-900 sm:text-4xl">{g} data</h3>
            <p className="mt-2 max-w-xl text-forest-700">{BLURB[g]}</p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((r) => (
                <li key={r.name} className="flex items-center gap-2.5 rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-forest-900">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700"><Check className="size-3" aria-hidden /></span>{r.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-sand-200 pt-5 text-sm text-forest-700">
            <span>Which fields are filled varies by product and by record. Every list page shows a masked sample.</span>
            <Link href="/sample" className="inline-flex items-center gap-1.5 font-semibold text-forest-900 underline decoration-purple-600/40 underline-offset-4 hover:text-purple-700">Request a free sample <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
