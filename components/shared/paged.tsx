"use client";
import { useRef, useState, type ReactNode } from "react";

/** Numbered pagination (1, 2, 3 ...) for long product lists. Items are rendered by the server; this only shows one page at a time. */
export function Paged({ items, per = 12, className = "", as: Tag = "div" }: { items: ReactNode[]; per?: number; className?: string; as?: "div" | "ul" }) {
  const [page, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(items.length / per));
  const cur = Math.min(page, pages);
  const go = (n: number) => { setPage(n); top.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };
  // 1 ... 4 5 6 ... N, always keeping first and last
  const nums = [...new Set([1, pages, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= pages))].sort((a, b) => a - b);
  const btn = "grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
  return (
    <div ref={top} className="scroll-mt-28">
      <Tag className={className}>{items.slice((cur - 1) * per, cur * per)}</Tag>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button type="button" disabled={cur === 1} onClick={() => go(cur - 1)} className={`${btn} border-sand-300 bg-white text-forest-900 disabled:opacity-40`}>Previous</button>
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              {i > 0 && n - nums[i - 1] > 1 && <span aria-hidden>…</span>}
              <button type="button" onClick={() => go(n)} aria-label={`Page ${n}`} aria-current={n === cur ? "page" : undefined} className={`${btn} ${n === cur ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>{n}</button>
            </span>
          ))}
          <button type="button" disabled={cur === pages} onClick={() => go(cur + 1)} className={`${btn} border-sand-300 bg-white text-forest-900 disabled:opacity-40`}>Next</button>
        </nav>
      )}
    </div>
  );
}
