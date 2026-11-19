"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { highlight, searchDocs, type SearchDoc } from "@/lib/help/search";

const POPULAR = ["subscription", "free sample", "payment pending", "email verification", "custom list", "refund"];

function Mark({ text, q }: { text: string; q: string }) {
  return <>{highlight(text, q).map((p, i) => (p.hit ? <mark key={i} className="rounded bg-purple-100 px-0.5 text-forest-900">{p.t}</mark> : <span key={i}>{p.t}</span>))}</>;
}

export function HelpSearch({ docs, categories }: { docs: SearchDoc[]; categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const f = (e: KeyboardEvent) => { const t = e.target as HTMLElement | null; if (e.key === "/" && !(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))) { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, []);
  const results = useMemo(() => searchDocs(docs, q, cat || undefined, 7), [docs, q, cat]);
  const has = q.trim().length > 0;
  const show = open;

  const go = (href: string) => { setOpen(false); router.push(href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") { const r = results[active] ?? (results.length === 1 ? results[0] : undefined); if (r) { e.preventDefault(); go(r.href); } }
    else if (e.key === "Escape") { if (q) setQ(""); setOpen(false); setActive(-1); }
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl text-left">
      <div className="flex items-center gap-3 rounded-full border border-sand-300 bg-white px-5 shadow-lg focus-within:outline-2 focus-within:outline-purple-600">
        <Search className="size-5 shrink-0 text-forest-500" aria-hidden />
        <input
          ref={inputRef}
          role="combobox" aria-expanded={show && has} aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setActive(-1); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
          placeholder="Search for answers, guides, or topics (press / to focus)" aria-label="Search the help center"
          className="h-14 min-w-0 flex-1 bg-transparent text-lg text-forest-900 outline-none placeholder:text-forest-700/60"
        />
        {q && <button type="button" onClick={() => { setQ(""); setActive(-1); }} aria-label="Clear search" className="rounded-full p-1 hover:bg-sand-100"><X className="size-5" /></button>}
      </div>

      {show && (
        <div id={`${id}-list`} role="listbox" aria-label="Search results" className="absolute inset-x-0 top-full z-30 mt-3 max-h-[28rem] overflow-y-auto rounded-3xl border border-sand-200 bg-white p-3 shadow-2xl">
          {!has ? (
            <div className="p-3">
              <p className="text-sm font-bold text-forest-900">Popular searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map((p) => <button key={p} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(p); setActive(-1); }} className="rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{p}</button>)}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 px-2 pb-2" role="group" aria-label="Filter by category">
                {[{ slug: "", name: "All" }, ...categories].map((c) => (
                  <button key={c.slug || "all"} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCat(c.slug); setActive(-1); }} aria-pressed={cat === c.slug}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${cat === c.slug ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-900 hover:bg-sand-200"}`}>{c.name}</button>
                ))}
              </div>
              {results.length > 0 ? (
                <ul>
                  {results.map((r, i) => (
                    <li key={r.id} id={`${id}-${i}`} role="option" aria-selected={i === active}>
                      <Link href={r.href} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(false)} className={`block rounded-2xl px-4 py-3 ${i === active ? "bg-forest-100" : "hover:bg-sand-50"}`}>
                        <span className="block text-xs font-bold text-forest-500">{r.categoryName}</span>
                        <span className="block text-base font-semibold text-forest-900"><Mark text={r.title} q={q} /></span>
                        <span className="block text-sm"><Mark text={r.description} q={q} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-lg font-bold text-forest-900">Couldn&apos;t find what you&apos;re looking for?</p>
                  <p className="mt-1 text-sm">No article matches &ldquo;{q}&rdquo;{cat ? " in this category" : ""}.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-semibold">
                    <Link href="/contact" className="rounded-full bg-purple-600 px-5 py-2 text-white hover:bg-purple-700">Contact support</Link>
                    <a href="#topics" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(false)} className="rounded-full border border-sand-300 px-5 py-2 text-forest-900 hover:bg-sand-100">Browse all topics</a>
                    <Link href="/custom-list" className="rounded-full border border-sand-300 px-5 py-2 text-forest-900 hover:bg-sand-100">Request a custom list</Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
