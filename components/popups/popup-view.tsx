"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Block, type BlockCtx } from "./blocks";
import type { Campaign } from "@/lib/popups/types";

type Props = { c: Campaign; ctx: BlockCtx; href: (raw: string) => string; secondaryHref: string | null; onClose: () => void; onCta: () => void };

const POS: Record<string, string> = {
  card: "fixed inset-x-0 bottom-0 z-[60] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[23rem]",
  slide: "fixed inset-x-0 bottom-0 z-[60] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[25rem]",
  sheet: "fixed inset-x-0 bottom-0 z-[60] mx-auto sm:max-w-xl",
  nudge: "fixed inset-x-0 bottom-0 z-[60] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[21rem]",
  bar: "fixed inset-x-0 bottom-0 z-[60]",
};

/** One popup, in one of the supported formats. Mobile always becomes a compact bottom sheet, never a full-screen takeover. */
export function PopupView({ c, ctx, href, secondaryHref, onClose, onCta }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const modal = c.format === "modal";
  const titleId = `popup-${c.id}-title`;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    if (modal) box.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (modal && e.key === "Tab" && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0]!, last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); if (modal) prev?.focus?.(); };
  }, [modal, onClose]);

  const cta = (
    <Link href={href(c.cta.href)} onClick={onCta} className="inline-flex min-h-11 items-center justify-center rounded-full bg-purple-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{c.cta.label}</Link>
  );
  const close = (
    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-forest-700 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-forest-700">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    </button>
  );

  if (c.format === "bar") {
    return (
      <div role="region" aria-label={c.headline} className={`${POS.bar} popup-rise border-t border-sand-200 bg-forest-900 px-4 py-3 text-sand-50`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 pr-8 text-sm">
          <p><b>{c.headline}</b> <span className="text-sand-200">{c.body}</span></p>
          <Link href={href(c.cta.href)} onClick={onCta} className="inline-flex min-h-10 items-center rounded-full bg-purple-600 px-4 font-bold text-white hover:bg-purple-700">{c.cta.label}</Link>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full hover:bg-white/10"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
      </div>
    );
  }

  const panel = (
    <div ref={box} tabIndex={-1} role="dialog" aria-modal={modal} aria-labelledby={titleId}
      className={`relative max-h-[80vh] overflow-y-auto rounded-t-3xl border border-sand-200 bg-sand-50 p-5 pr-12 shadow-[0_-12px_40px_rgba(15,42,29,.18)] outline-none sm:rounded-3xl sm:p-6 sm:pr-12 ${c.format === "slide" ? "popup-slide" : "popup-rise"} ${modal ? "w-full sm:max-w-lg" : ""}`}>
      {close}
      <h2 id={titleId} className="display text-[1.55rem] leading-[1.05] text-forest-900 sm:text-[1.9rem]">{c.headline}</h2>
      {c.body && <p className="mt-2 text-sm leading-relaxed text-forest-700">{c.body}</p>}
      {c.block !== "none" && <div className="mt-4"><Block kind={c.block} ctx={ctx} /></div>}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {cta}
        {c.secondary && secondaryHref && <Link href={secondaryHref} onClick={onCta} className="text-sm font-semibold text-forest-900 underline underline-offset-4">{c.secondary.label}</Link>}
        <button type="button" onClick={onClose} className="text-sm text-forest-700 underline underline-offset-4">No thanks</button>
      </div>
    </div>
  );

  if (modal) {
    return (
      <div className="popup-fade fixed inset-0 z-[60] flex items-end justify-center bg-forest-900/35 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {panel}
      </div>
    );
  }
  return <div className={POS[c.format] ?? POS.card}>{panel}</div>;
}
