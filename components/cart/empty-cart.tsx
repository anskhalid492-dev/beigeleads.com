"use client";
import Link from "next/link";
import { ArrowRight, Eye, Repeat2, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyArt } from "@/components/cart/empty-art";
import { Flag, IndustryIcon } from "@/components/shared/db-icon";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/lib/cart/model";
import { formatUsd } from "@/lib/catalog";

const BENEFITS = [
  { Icon: Tag, title: "Pay Once. Own the List.", text: "One purchase, no recurring fees." },
  { Icon: Eye, title: "Preview Before You Buy.", text: "Masked samples on every list page." },
  { Icon: Repeat2, title: "No Subscriptions.", text: "No account and no credits to track." },
];

/** Empty cart: a discovery page. Recommendations are real, on-sale lists from the catalog (never placeholders). */
export function EmptyCart({ notice }: { notice: string }) {
  const [recs, setRecs] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: [] }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ suggestions?: Suggestion[] }>) : Promise.reject(new Error("x"))))
      .then((j) => setRecs(j.suggestions ?? []))
      .catch((e: Error) => { if (e.name !== "AbortError") setRecs([]); });
    return () => ac.abort();
  }, []);

  return (
    <div className="cart-in">
      {notice && <p role="status" className="mb-6 rounded-2xl bg-forest-100 px-5 py-3 text-sm font-medium text-forest-900">{notice}</p>}
      <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14" aria-labelledby="empty-h">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <h2 id="empty-h" className="display text-5xl text-forest-900 sm:text-7xl">Your Next Customers Are One List Away.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg lg:mx-0">Discover ready-to-use business databases, find your ideal prospects, and own your list with a single purchase.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild size="lg"><Link href="/lists">Explore Databases <ArrowRight className="size-4" aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href={recs && recs.length > 0 ? "#recommendations" : "/lists"}>Browse Popular Lists</Link></Button>
          </div>
        </div>
        <div className="order-1 lg:order-2"><EmptyArt /></div>
      </section>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {BENEFITS.map(({ Icon, title, text }, i) => (
          <li key={title} className="cart-in flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3.5" style={{ "--i": i + 2 } as React.CSSProperties}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700"><Icon className="size-4" aria-hidden /></span>
            <span><span className="block font-bold leading-snug text-forest-900">{title}</span><span className="block text-sm">{text}</span></span>
          </li>
        ))}
      </ul>

      {recs === null && (
        <div className="mt-14" aria-busy="true" role="status"><span className="sr-only">Loading databases</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2].map((i) => <div key={i} className="cart-skel h-56 rounded-3xl" />)}</div>
        </div>
      )}
      {recs && recs.length > 0 && (
        <section id="recommendations" aria-labelledby="recs-h" className="mt-14 scroll-mt-28">
          <h2 id="recs-h" className="display text-4xl text-forest-900 sm:text-5xl">Find Your Next Prospects</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recs.map((s, i) => <li key={s.slug} className="cart-in" style={{ "--i": i } as React.CSSProperties}><RecCard s={s} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function RecCard({ s }: { s: Suggestion }) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-sand-200 bg-white p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,42,29,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><IndustryIcon slug={s.categorySlug} className="size-6" /></span>
        <h3 className="min-w-0 text-lg font-bold leading-snug text-forest-900"><Link href={`/lists/${s.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{s.name}</Link></h3>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm">{s.countryCode && <Flag code={s.countryCode} />}{s.coverage}</p>
      {s.recordCount !== null && <p className="mt-1 text-sm"><strong className="text-forest-900">{s.recordCount.toLocaleString("en-US")}</strong> contacts</p>}
      <p className="mt-3 text-sm">From <span className="display text-3xl leading-none text-forest-900">{formatUsd(s.startPriceCents)}</span> <span className="text-forest-500">one time</span></p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button asChild size="sm" variant="secondary"><Link href={`/lists/${s.slug}#sample`}>Preview Sample</Link></Button>
        <Button asChild size="sm"><Link href={`/lists/${s.slug}`}>View Database</Link></Button>
      </div>
    </article>
  );
}
