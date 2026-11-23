"use client";
import { useEffect, useState } from "react";

type H = { id: string; text: string; level: number };

/** Table of contents: highlights the section being read. Plain anchor links, so it works without JavaScript too. */
export function Toc({ items }: { items: H[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const els = items.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const on = () => {
      // The active section is the last heading that has passed the sticky header.
      let cur = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= 140) cur = el.id;
      setActive(cur);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [items]);

  const list = (
    <ol className="space-y-0.5 text-sm">
      {items.map((h) => (
        <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.9rem" : 0 }}>
          <a href={`#${h.id}`} aria-current={active === h.id ? "true" : undefined}
            className={`block rounded-lg px-3 py-1.5 leading-snug transition-colors hover:bg-sand-100 hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600 ${h.level === 3 ? "text-[0.8rem]" : ""} ${active === h.id ? "bg-forest-100 font-bold text-forest-900" : ""}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <nav aria-label="Table of contents" className="hidden rounded-2xl border border-sand-200 bg-white p-3 shadow-sm lg:block">
        <p className="px-3 pb-2 pt-1 text-sm font-bold text-forest-900">In this article</p>
        <div className="max-h-[52vh] overflow-y-auto pr-1">{list}</div>
      </nav>
      <details className="rounded-2xl border border-sand-200 bg-white lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">In this article <span aria-hidden className="float-right">+</span></summary>
        <nav aria-label="Table of contents (mobile)" className="px-4 pb-4">{list}</nav>
      </details>
    </>
  );
}
