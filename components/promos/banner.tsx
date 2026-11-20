"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TicketPercent } from "lucide-react";

type B = { id: number; text: string; code: string | null; endsAt: number | null };
const fmt = (s: number) => new Date(s * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** A promotion banner. Renders nothing unless the server says a promotion is genuinely live for this place. No countdown, no scarcity. */
export function PromoBanner({ place, slug, className = "" }: { place: "home" | "lists" | "product" | "cart"; slug?: string; className?: string }) {
  const [b, setB] = useState<B | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    fetch(`/api/promo-banners?place=${place}${slug ? `&slug=${encodeURIComponent(slug)}` : ""}`, { signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ banner: B | null }>) : null))
      .then((j) => setB(j?.banner ?? null))
      .catch(() => undefined);
    return () => ac.abort();
  }, [place, slug]);
  if (!b) return null;
  return (
    <div role="note" className={`mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-purple-100 bg-purple-100/60 px-4 py-2.5 text-center text-sm text-forest-900 ${className}`}>
      <TicketPercent className="size-4 shrink-0 text-purple-700" aria-hidden />
      <span className="font-semibold">{b.text}</span>
      {b.endsAt && <span className="text-forest-700">Offer ends {fmt(b.endsAt)}.</span>}
      <Link href="/lists" className="font-semibold text-purple-700 underline underline-offset-4">Browse lists</Link>
    </div>
  );
}
