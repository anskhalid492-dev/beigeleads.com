"use client";
// The small chat bubble Pilo shows above the launcher. Presentational: the schedule lives in use-proactive.ts.
import { useState } from "react";
import { X } from "lucide-react";
import { Pilo, type Intensity } from "./pilo";

export function ProBubble({ name, text, cta, onCta, onClose, intensity, className = "", inline = false }: { name: string; text: string; cta: string; onCta: () => void; onClose: () => void; intensity?: Intensity; className?: string; inline?: boolean }) {
  const [more, setMore] = useState(false);
  return (
    <div role="region" aria-label={`A message from ${name}`} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
      className={`bp-bubble-in ${inline ? "relative" : "fixed z-40"} w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl rounded-br-md border border-sand-300 bg-sand-50 p-3.5 shadow-[0_14px_34px_-18px_rgba(15,42,29,.55)] ${className}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0"><Pilo crop="avatar" mood="wave" size={36} intensity={intensity} /></span>
        <div className="min-w-0 flex-1 leading-tight"><p className="display text-[1.05rem] text-forest-900">{name}</p><p className="text-[0.7rem] text-forest-700">Your AI Assistant</p></div>
        <button type="button" onClick={onClose} aria-label="Dismiss message" className="grid size-8 shrink-0 place-items-center rounded-full text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><X className="size-4" aria-hidden /></button>
      </div>
      <p className={`mt-2.5 text-[0.88rem] leading-snug text-forest-900 ${more ? "" : "line-clamp-4 sm:line-clamp-none"}`}>{text}</p>
      {!more && text.length > 150 && <button type="button" onClick={() => setMore(true)} className="mt-1 text-xs font-semibold text-purple-700 underline sm:hidden">Read more</button>}
      <button type="button" onClick={onCta} className="mt-3 w-full rounded-full bg-purple-600 px-4 py-2 text-[0.85rem] font-bold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{cta}</button>
    </div>
  );
}
