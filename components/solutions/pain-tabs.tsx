"use client";
import { useState } from "react";
import { Check } from "lucide-react";

type Pain = { pain: string; fix: string };

/** Left: selectable list of challenges. Right: dark panel with the answer. All panels stay in the DOM (SEO). */
export function PainTabs({ pains }: { pains: readonly Pain[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div role="tablist" aria-label="Challenges" aria-orientation="vertical" className="flex flex-col gap-2">
        {pains.map((p, n) => (
          <button
            key={p.pain}
            role="tab"
            id={`pain-tab-${n}`}
            aria-selected={i === n}
            aria-controls={`pain-panel-${n}`}
            onClick={() => setI(n)}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
              i === n ? "border-forest-900 bg-forest-100 text-forest-900" : "border-sand-200 bg-white text-forest-700 hover:border-sand-300 hover:bg-sand-50"
            }`}
          >
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm ${i === n ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-700"}`}>{n + 1}</span>
            {p.pain}
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-sand-100 sm:p-10">
        <div aria-hidden className="glow-breathe pointer-events-none absolute -right-20 -top-24 size-72 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.25), transparent)" }} />
        {pains.map((p, n) => (
          <div key={p.pain} role="tabpanel" id={`pain-panel-${n}`} aria-labelledby={`pain-tab-${n}`} hidden={i !== n} className="relative">
            <span className="grid size-11 place-items-center rounded-xl bg-forest-100 text-forest-900"><Check className="size-5" aria-hidden /></span>
            <h3 className="display mt-6 text-3xl text-sand-50 sm:text-4xl">{p.pain}</h3>
            <p className="mt-4 text-lg leading-relaxed">{p.fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
