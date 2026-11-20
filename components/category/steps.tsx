"use client";
import { useEffect, useRef } from "react";

/** "How it works" steps. Once scrolled into view the rules draw left to right, the numbers pop and the text rises, one step after another.
 *  Visible without JavaScript; with reduced motion everything simply shows. */
export function Steps({ items }: { items: readonly (readonly [string, string])[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.s = "armed"; // attribute only (no React state), so the server markup stays visible until the browser arms it
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.dataset.s = "on"; io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <ol ref={ref} className="steps-anim grid gap-6 md:grid-cols-4">
      {items.map(([a, b], i) => (
        <li key={a} style={{ "--i": i } as React.CSSProperties} className="group relative pt-4">
          <span className="st-rule absolute inset-x-0 top-0 h-0.5 bg-forest-900" aria-hidden><span className="st-dot absolute -top-[3px] right-0 size-2 rounded-full bg-purple-600" /></span>
          <span className="st-num display block text-4xl text-purple-600 transition-transform duration-200 group-hover:-translate-y-0.5">{i + 1}</span>
          <p className="st-text mt-1 text-lg font-bold text-forest-900">{a}</p>
          <p className="st-text mt-1 text-sm">{b}</p>
        </li>
      ))}
    </ol>
  );
}
