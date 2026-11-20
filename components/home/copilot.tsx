"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/catalog";
import type { Discovery, Lite } from "@/lib/discover";
import { customListHref } from "@/lib/search";

// Lead discovery co-pilot. A STRUCTURED search over every product on the site (/api/discover, lib/discover.ts), not an AI model.
// It never invents availability, counts or prices; placeholder product data is not shown as fact.

const EXAMPLES = ["dentists in California", "restaurants in New York", "5k ski shops in Denver", "10,000 real estate agents in Texas"];
const CHIPS = ["Dentists in the United States", "Restaurants in Chicago", "Ski shops in Denver"];

function ProductCard({ p, note }: { p: Lite; note?: string }) {
  return (
    <li className="rounded-2xl border border-sand-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-lg font-bold text-forest-900"><Link href={`/lists/${p.slug}`} className="hover:underline">{p.name}</Link></h3>
      <p className="text-sm">{p.categoryName} · {p.countryName}{p.region ? `, ${p.region}` : ""}</p>
      {note && <p className="mt-2 text-sm font-medium text-forest-900">{note}</p>}
      <p className="mt-2 text-sm">
        {p.fields.length ? `Fields: ${p.fields.join(", ")}. ` : ""}
        {p.records ? `${p.records.toLocaleString("en-US")} records${p.fromCents ? `, from ${formatUsd(p.fromCents)}` : ""}.` : "Record count and prices are on the list page."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm"><Link href={`/lists/${p.slug}`}>{p.forSale ? "View list" : "View details"}</Link></Button>
        <Button asChild size="sm" variant="secondary"><Link href={`/sample?product=${p.slug}`}>Free sample</Link></Button>
      </div>
    </li>
  );
}

export function Copilot() {
  const uid = useId();
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [ph, setPh] = useState(EXAMPLES[0]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotating example placeholder (skipped under reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % EXAMPLES.length;
      setPh(EXAMPLES[i]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [result, setResult] = useState<(Discovery & { q: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const typeCtl = useRef<AbortController | null>(null);
  const searchCtl = useRef<AbortController | null>(null);
  // Type-ahead over every product (debounced in the change handler, cancelled when the text changes).
  function typeAhead(t: string) {
    typeCtl.current?.abort();
    if (t.trim().length < 2) { setSuggestions([]); return; }
    const ctl = new AbortController(); typeCtl.current = ctl;
    setTimeout(() => {
      if (ctl.signal.aborted) return;
      fetch(`/api/discover?suggest=1&q=${encodeURIComponent(t.trim())}`, { signal: ctl.signal }).then((r) => r.json() as Promise<{ suggestions?: string[] }>).then((d) => setSuggestions((d.suggestions ?? []).filter((x) => x.toLowerCase() !== t.trim().toLowerCase()))).catch(() => undefined);
    }, 180);
  }
  // Search every product when a search is submitted.
  function search(q: string) {
    searchCtl.current?.abort();
    const ctl = new AbortController(); searchCtl.current = ctl;
    setBusy(true); setFailed(false);
    fetch(`/api/discover?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => r.json() as Promise<Discovery>).then((d) => { setResult({ ...d, q }); setBusy(false); })
      .catch((e: unknown) => { if ((e as Error).name !== "AbortError") { setFailed(true); setBusy(false); } });
  }
  // Real event for the popup system: a search that found nothing (it carries the custom-list link).
  useEffect(() => {
    if (result && result.exact.length + result.close.length === 0) window.dispatchEvent(new CustomEvent("bl:search-noresults", { detail: { query: result.q, href: customListHref(result.q) } }));
  }, [result]);

  function run(q: string) {
    const t = q.trim();
    if (!t) {
      inputRef.current?.focus();
      return;
    }
    setValue(t);
    setSubmitted(t);
    search(t);
    setOpen(false);
    setActive(-1);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(open && active >= 0 ? suggestions[active] : value);
    }
  }

  const listId = `${uid}-list`;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
        }}
        className="relative"
      >
        <label htmlFor={`${uid}-q`} className="sr-only">Describe your ideal leads</label>
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-purple-600">
          <textarea
            ref={inputRef}
            id={`${uid}-q`}
            rows={3}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${uid}-s${active}` : undefined}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\n/g, " "));
              typeAhead(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onKeyDown={onKey}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={`Describe your ideal leads, e.g. ${ph}`}
            autoComplete="off"
            className="block w-full resize-none bg-transparent pb-10 pr-14 text-left text-base text-forest-900 placeholder:text-forest-500/70 focus:outline-none sm:text-lg"
          />
          <button
            type="submit"
            className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            <ArrowUp className="size-5" aria-hidden />
            <span className="sr-only">Find my leads</span>
          </button>
        </div>
        {open && suggestions.length > 0 && (
          <ul id={listId} role="listbox" aria-label="Suggestions" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-sand-200 bg-white text-left shadow-xl">
            {suggestions.map((s, i) => (
              <li
                key={s}
                id={`${uid}-s${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  run(s);
                }}
                className={`cursor-pointer px-4 py-3 ${i === active ? "bg-purple-100" : "hover:bg-sand-100"}`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Popular searches">
        {CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => run(c)} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-forest-900 shadow-sm transition-colors hover:bg-purple-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            {c}
          </button>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-sand-200">
        <span aria-hidden className="size-2 rounded-full bg-forest-100" />
        Searches our real catalog. No sign-up.
      </p>

      <div aria-live="polite" className="mt-8 text-center">
        {busy && <p className="text-sand-100">Searching every list...</p>}
        {failed && <p className="rounded-xl bg-sand-50 p-4 text-forest-900">The search is not available right now. <Link href="/lists" className="font-semibold underline underline-offset-4">Browse all lists</Link>.</p>}
        {result && !busy && (
          <div className="space-y-6 rounded-2xl bg-sand-50 p-5 text-forest-900 shadow-xl sm:p-6">
            {(result.categories.length > 0 || result.countries.length > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                {result.categories.map((c) => <Link key={c.slug} href={`/lists/${c.slug}`} className="rounded-full bg-white px-3 py-1 font-semibold shadow-sm hover:bg-purple-100">{c.name}</Link>)}
                {result.countries.map((c) => <Link key={c.slug} href={`/lists?country=${c.slug}`} className="rounded-full border border-sand-300 px-3 py-1 hover:bg-purple-100">{c.name}</Link>)}
              </div>
            )}
            {result.exact.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-forest-900">{result.exact.length === 1 ? "We have this list" : result.total > result.exact.length ? `Top ${result.exact.length} matching lists` : `We have ${result.exact.length} matching lists`}</h2>
                <ul className="mt-4 grid gap-4 text-left">{result.exact.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
                {result.total > result.exact.length && <p className="mt-4 text-sm"><Link href={`/lists?q=${encodeURIComponent(result.q)}`} className="font-semibold underline underline-offset-4">See all matching lists</Link></p>}
              </div>
            )}
            {result.close.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-forest-900">Closest lists we have</h2>
                <ul className="mt-4 grid gap-4 text-left">{result.close.map((p) => <ProductCard key={p.slug} p={p} note="Matches part of your search." />)}</ul>
              </div>
            )}
            {result.exact.length + result.close.length === 0 && (
              <div className="rounded-2xl border-2 border-forest-900 bg-forest-100 p-6">
                <h2 className="display text-3xl text-forest-900">Not seeing your ideal prospects? We can help you build it.</h2>
                <p className="mx-auto mt-2 max-w-lg">We couldn&apos;t find a match for &ldquo;{result.q}&rdquo;. Send us your requirements and we will check whether we can source it. Your search is carried over.</p>
                <Button asChild size="lg" className="mt-4"><Link href={customListHref(result.q)}>Build my custom list</Link></Button>
              </div>
            )}
            {result.exact.length > 0 && <p className="text-sm">Not what you need? <Link href={customListHref(result.q)} className="font-semibold underline underline-offset-4">Build a custom list</Link>.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
