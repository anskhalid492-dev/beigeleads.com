"use client";
import { useEffect, useState } from "react";

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const els = items.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-100px 0px -65% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="On this page">
      <p className="text-sm font-bold text-forest-900">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-sand-300 text-sm">
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined}
              className={`-ml-px block border-l py-1 pl-4 transition-colors ${active === t.id ? "border-forest-900 font-semibold text-forest-900" : "border-transparent hover:border-forest-500 hover:text-forest-900"}`}>{t.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
