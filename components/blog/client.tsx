"use client";
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

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* clipboard unavailable */ } }} className="rounded-full border border-sand-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{done ? "Link copied" : "Copy link"}</button>;
}
