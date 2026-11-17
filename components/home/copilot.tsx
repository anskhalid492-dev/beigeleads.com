"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatUsd, getCategories, getCities, getCountries, startingPriceCents, type Product } from "@/lib/catalog";
import { customListHref, searchCatalog } from "@/lib/search";

// Lead discovery co-pilot. This is a STRUCTURED search over the real catalog (lib/search.ts), not an AI model.
// It never invents availability, counts or prices; placeholder product data is not shown as fact.

const EXAMPLES = ["dentists in California", "restaurants in New York", "5k ski shops in Denver", "10,000 real estate agents in Texas"];
const CHIPS = ["Dentists in the United States", "Restaurants in Chicago", "Ski shops in Denver"];

function suggestionsFor(q: string): string[] {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  const out: string[] = [];
  for (const c of getCategories()) {
    out.push(c.name);
    for (const k of getCountries()) {
      out.push(`${c.name} in ${k.name}`);
      for (const city of getCities(k.slug)) out.push(`${c.name} in ${city.name}`);
    }
  }
  return out.filter((s) => s.toLowerCase().includes(t) && s.toLowerCase() !== t).slice(0, 5);
}

function ProductCard({ p, note }: { p: Product; note?: string }) {
  const price = startingPriceCents(p);
  return (
    <li className="rounded-2xl border border-sand-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-lg font-bold text-forest-900">{p.name}</h3>
      <p className="text-sm">{p.title}</p>
      {note && <p className="mt-2 text-sm font-medium text-forest-900">{note}</p>}
      <p className="mt-2 text-sm">
        Fields: {p.fields.join(", ")}.{" "}
        {p.placeholderData ? "Record count and prices are shown on the list page." : `${p.recordCount?.toLocaleString("en-US") ?? ""} records${price ? `, from ${formatUsd(price)}` : ""}.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm"><Link href={`/product/${p.slug}`}>View list</Link></Button>
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

  const suggestions = useMemo(() => suggestionsFor(value), [value]);
  const result = useMemo(() => (submitted ? searchCatalog(submitted) : null), [submitted]);

  function run(q: string) {
    const t = q.trim();
    if (!t) {
      inputRef.current?.focus();
      return;
    }
    setValue(t);
    setSubmitted(t);
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
        {result && (
          <div className="space-y-6 rounded-2xl bg-sand-50 p-5 text-forest-900 shadow-xl sm:p-6">
            {result.exact.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-forest-900">
                  {result.exact.length === 1 ? "We have this list" : `We have ${result.exact.length} matching lists`}
                </h2>
                <ul className="mt-4 grid gap-4 text-left">{result.exact.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
              </div>
            )}
            {result.close.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-forest-900">{result.exact.length ? "Close alternatives" : "Closest list we have"}</h2>
                <ul className="mt-4 grid gap-4 text-left">{result.close.map((c) => <ProductCard key={c.product.slug} p={c.product} note={c.note} />)}</ul>
              </div>
            )}
            {result.exact.length === 0 && (
              <div className="rounded-2xl border-2 border-forest-900 bg-forest-100 p-6">
                <h2 className="display text-3xl text-forest-900">Not seeing your ideal audience? We can help you build it.</h2>
                <p className="mx-auto mt-2 max-w-lg">
                  We couldn&apos;t find an exact match for &ldquo;{result.parsed.raw}&rdquo;. Send us your requirements and we will check whether we can source it. Your search is carried over.
                </p>
                <Button asChild size="lg" className="mt-4"><Link href={customListHref(result.parsed.raw)}>Build my custom list</Link></Button>
              </div>
            )}
            {result.exact.length > 0 && (
              <p className="text-sm">Not what you need? <Link href={customListHref(result.parsed.raw)} className="font-semibold underline underline-offset-4">Build a custom list</Link>.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
