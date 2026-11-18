"use client";

import { useEffect, useState } from "react";

const steps = [
  ["step-find", "1", "Find"],
  ["step-preview", "2", "Preview"],
  ["step-package", "3", "Package"],
  ["step-pay", "4", "Pay"],
  ["step-receive", "5", "Receive"],
] as const;

/** Sticky step indicator. Plain anchor links, so it still works without JavaScript. */
export function StepNav() {
  const [active, setActive] = useState("step-find");
  useEffect(() => {
    const els = steps.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="Steps" className="sticky top-24 z-20 mx-auto -mt-2 mb-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-sand-300 bg-sand-50/95 p-1 shadow-sm backdrop-blur">
      {steps.map(([id, n, label]) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={active === id ? "step" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${active === id ? "bg-forest-900 text-sand-50" : "text-forest-700 hover:bg-sand-100"}`}
        >
          <span className="text-xs opacity-70">{n}</span>{label}
        </a>
      ))}
    </nav>
  );
}
