"use client";
import { Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => { const el = document.getElementById("article-body"); if (!el) return; const r = el.getBoundingClientRect(); const total = r.height - window.innerHeight * 0.5; setP(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1); };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  return <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1"><div className="h-full origin-left bg-purple-600" style={{ transform: `scaleX(${p})` }} /></div>;
}

export function CopyLink({ url, compact = false }: { url: string; compact?: boolean }) {
  const [done, setDone] = useState(false);
  const click = async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* clipboard unavailable */ } };
  if (compact) return <button type="button" onClick={click} aria-label={done ? "Link copied" : "Copy link"} title={done ? "Link copied" : "Copy link"} className="grid size-10 place-items-center rounded-full border border-sand-300 bg-white text-sm font-bold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">{done ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}<span role="status" className="sr-only">{done ? "Link copied" : ""}</span></button>;
  return <button type="button" onClick={click} className="rounded-full border border-sand-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{done ? "Link copied" : "Copy link"}</button>;
}
