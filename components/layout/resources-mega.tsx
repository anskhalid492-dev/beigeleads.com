"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, CircleDollarSign, HelpCircle, Sparkles, type LucideIcon } from "lucide-react";
import { RESOURCE_GROUPS } from "@/lib/resources-nav";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** What a visitor can start with. Words and icons move in step (same CSS as the Lists menu intro). */
const STARTS: { word: string; icon: LucideIcon }[] = [
  { word: "pricing", icon: CircleDollarSign },
  { word: "a guide", icon: BookOpen },
  { word: "a sample", icon: Sparkles },
  { word: "an answer", icon: HelpCircle },
];

export function ResourcesMegaPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div id="menu-resources" className="mega-in grid overflow-hidden rounded-[1.6rem] border border-sand-200 bg-sand-50 shadow-[0_14px_36px_-22px_rgba(15,42,29,0.3)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="relative flex flex-col overflow-hidden border-r border-sand-200 bg-sand-100 px-7 py-7">
        <span aria-hidden className="intro-glow pointer-events-none absolute -bottom-12 -right-12 size-44 rounded-full bg-purple-100 opacity-80 blur-2xl" />
        <h3 className="display intro-rise relative text-[1.7rem] leading-[1.05] text-forest-900" style={{ "--d": 0 } as React.CSSProperties}>
          Everything to buy and learn <span className="relative inline-block">well.<span aria-hidden className="intro-draw absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-purple-600" /></span>
        </h3>
        <p className="intro-rise relative mt-3 flex items-baseline gap-1.5 text-[0.95rem] text-forest-700" style={{ "--d": 1 } as React.CSSProperties}>
          Start with
          <span className="relative block h-6 overflow-hidden font-bold text-forest-900" aria-hidden>
            <span className="intro-roll block">
              {[...STARTS, STARTS[0]].map((w, i) => <span key={i} className="block h-6 leading-6">{w.word}</span>)}
            </span>
          </span>
          <span className="sr-only">pricing, a guide, a sample or an answer</span>
        </p>
        <div className="intro-rise relative mt-3 flex gap-2" aria-hidden style={{ "--d": 2 } as React.CSSProperties}>
          {STARTS.map((w, i) => (
            <span key={w.word} className="intro-lit grid size-8 place-items-center rounded-full border" style={{ "--i": i } as React.CSSProperties}>
              <w.icon strokeWidth={1.7} className="size-4" />
            </span>
          ))}
        </div>
        <p className="intro-rise relative mt-3 text-[0.8rem] leading-5 text-forest-700/80" style={{ "--d": 3 } as React.CSSProperties}>Masked sample on every list page.</p>
        <div className="intro-rise relative mt-auto flex flex-col items-start gap-2 pt-5" style={{ "--d": 4 } as React.CSSProperties}>
          <Link href="/help-center" onClick={onNavigate} className={`group/all inline-flex items-center gap-2 rounded-full bg-purple-600 px-[1.1rem] py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(124,58,237,0.7)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-purple-700 ${ring}`}>
            Visit the Help Center <ArrowRight className="size-4 transition-transform duration-200 group-hover/all:translate-x-0.5" aria-hidden />
          </Link>
          <Link href="/sample" onClick={onNavigate} className={`group/cs inline-flex items-center gap-2 rounded-full border border-forest-900/25 bg-white px-[1.1rem] py-2.5 text-sm font-semibold text-forest-900 transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-purple-600 hover:text-purple-700 ${ring}`}>
            Or request a sample <ArrowRight className="size-4 transition-transform duration-200 group-hover/cs:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-3">
        {RESOURCE_GROUPS.map((g) => (
          <div key={g.heading} className="flex flex-col justify-center py-7 pl-6 pr-3">
            <p className="mb-4 text-[0.8rem] font-semibold text-forest-700/80">{g.heading}</p>
            <ul className="flex flex-col gap-5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNavigate} className={`group flex gap-3.5 rounded-xl ${ring}`}>
                    <span className="grid size-[2.4rem] shrink-0 place-items-center rounded-full border border-sand-300 text-forest-700 transition-[transform,color,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-purple-600 group-hover:text-purple-600">
                      <l.icon strokeWidth={1.6} className="size-[1.15rem]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center text-[0.97rem] font-bold leading-6 text-forest-900 transition-colors duration-200 group-hover:text-purple-700">
                        <span className="whitespace-nowrap">{l.name}</span>
                        <ArrowRight className="ml-1.5 size-4 w-0 -translate-x-1 overflow-visible opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" aria-hidden />
                      </span>
                      <span className="mt-0.5 block truncate text-[0.84rem] leading-5 text-forest-700/80">{l.text}</span>
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
