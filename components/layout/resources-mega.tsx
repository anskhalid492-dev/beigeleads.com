"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { RESOURCE_GROUPS } from "@/lib/resources-nav";

export function ResourcesMegaPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div id="menu-resources" className="mega-in grid overflow-hidden rounded-[1.6rem] border border-sand-200 bg-sand-50 shadow-[0_14px_36px_-22px_rgba(15,42,29,0.3)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="relative flex flex-col overflow-hidden border-r border-sand-200 bg-sand-100 px-7 py-7">
        <span aria-hidden className="intro-glow pointer-events-none absolute -bottom-12 -right-12 size-44 rounded-full bg-purple-100 opacity-80 blur-2xl" />
        <h3 className="display intro-rise relative text-[1.7rem] leading-[1.05] text-forest-900" style={{ "--d": 0 } as React.CSSProperties}>
          Everything to buy and learn <span className="relative inline-block">well.<span aria-hidden className="intro-draw absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-purple-600" /></span>
        </h3>
        <p className="intro-rise relative mt-3 text-[0.95rem] text-forest-700" style={{ "--d": 1 } as React.CSSProperties}>Guides, answers and the details behind every list.</p>
        <p className="intro-rise relative mt-3 text-[0.8rem] leading-5 text-forest-700/80" style={{ "--d": 2 } as React.CSSProperties}>Masked sample on every list page.</p>
        <div className="intro-rise relative mt-auto flex flex-col items-start gap-2 pt-5" style={{ "--d": 3 } as React.CSSProperties}>
          <Link href="/help-center" onClick={onNavigate} className="group/all inline-flex items-center gap-2 rounded-full bg-purple-600 px-[1.1rem] py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(124,58,237,0.7)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            Visit the Help Center <ArrowRight className="size-4 transition-transform duration-200 group-hover/all:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-3">
        {RESOURCE_GROUPS.map((g) => (
          <div key={g.heading} className="flex flex-col justify-center py-7 pl-6 pr-3">
            <p className="mb-4 text-[0.8rem] font-semibold text-forest-700/80">{g.heading}</p>
            <ul className="flex flex-col gap-4">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNavigate} className="group flex gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                    <span className="grid size-[2.2rem] shrink-0 place-items-center rounded-full border border-sand-300 text-forest-700 transition-[transform,color,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-purple-600 group-hover:text-purple-600">
                      <l.icon className="size-[1.05rem]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.95rem] font-bold leading-5 text-forest-900 transition-colors duration-200 group-hover:text-purple-700">{l.name}</span>
                      <span className="mt-0.5 block truncate text-[0.82rem] leading-5 text-forest-700/80">{l.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcesMobile({ onNavigate }: { onNavigate: () => void }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 hover:bg-sand-100">
        Resources <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 pb-2 pl-3">
        {RESOURCE_GROUPS.map((g) => (
          <div key={g.heading}>
            <p className="px-3 pt-2 text-xs font-bold text-forest-500">{g.heading}</p>
            {g.links.map((l) => (
              <Link key={l.href} href={l.href} onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm hover:bg-sand-100">{l.name}</Link>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
