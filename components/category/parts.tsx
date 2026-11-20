import Link from "next/link";
import { Check } from "lucide-react";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { formatUsd } from "@/lib/catalog";
import type { ShopProduct } from "@/lib/shop";

export const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
export const h2 = "display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]";

/** Typography-led editorial block: heading on the left, readable paragraphs on the right. */
export function Editorial({ title, children, tone = "plain" }: { title: string; children: React.ReactNode; tone?: "plain" | "sand" }) {
  return (
    <section className={tone === "sand" ? "border-y border-sand-200 bg-sand-100 py-14 sm:py-16" : "py-14 sm:py-16"}>
      <div className={`${wrap} grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14`}>
        <h2 className={`${h2} lg:sticky lg:top-28 lg:self-start`}>{title}</h2>
        <div className="max-w-[62ch] space-y-4 text-[1.05rem] leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

/** Pairs of (name, text) as a ruled list: no cards, the rule is the structure. */
export function RuledList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="divide-y divide-sand-300 border-y border-sand-300">
      {items.map(([a, b]) => (
        <li key={a} className="group grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
          <span className="font-bold text-forest-900 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">{a}</span>
          <span className="text-[0.98rem]">{b}</span>
        </li>
      ))}
    </ul>
  );
}

/** Premium database row. Real catalog data only: counts and prices show only when they are not placeholders. */
export function DatabaseRow({ p }: { p: ShopProduct }) {
  const buyable = p.status === "live";
  return (
    <div className="group grid gap-5 rounded-[1.6rem] border border-sand-300 bg-white p-5 transition duration-200 hover:border-forest-500 hover:shadow-[0_18px_36px_-24px_rgba(15,42,29,.55)] motion-reduce:transition-none md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
      <div className="flex items-start gap-4">
        <DbBadge category={p.categorySlug} country={p.countryCode} size="lg" />
        <div className="min-w-0">
          <h3 className="display text-[1.7rem] leading-[1.05] text-forest-900">{p.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><Flag code={p.countryCode} className="h-3 w-[18px]" />{p.countryName}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Data fields">
            {p.fields.slice(0, 6).map((f) => <li key={f} className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900"><Check className="size-3 text-forest-500" aria-hidden />{f}</li>)}
            {p.fields.length > 6 && <li className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-1 text-xs font-bold text-forest-900">+{p.fields.length - 6} more</li>}
          </ul>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-forest-900"><span className={`size-2 rounded-full ${buyable ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{buyable ? "Available" : "Preview"}</span>
            {p.recordCount ? <span>{p.recordCount.toLocaleString("en-US")} records</span> : null}
            {p.fromCents ? <span className="font-semibold text-forest-900">One-time, from {formatUsd(p.fromCents)}</span> : null}
          </p>
        </div>
      </div>
      <div className="flex gap-2 md:flex-col">
        <Link href={`/lists/${p.slug}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">View Database</Link>
        <Link href={`/lists/${p.slug}#sample`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-sand-300 px-5 text-sm font-semibold text-forest-900 hover:border-forest-900">Preview sample</Link>
      </div>
    </div>
  );
}

/** Honest status block for categories with no ready-made inventory. */
export function StatusPanel({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div role="note" className="rounded-[1.6rem] border border-dashed border-forest-500 bg-white p-6 sm:p-8">
      <p className="flex items-center gap-2 text-sm font-bold text-forest-900"><span className="size-2 rounded-full bg-purple-600" aria-hidden />Ready-made inventory unavailable</p>
      <h2 className="display mt-3 text-[1.9rem] leading-tight text-forest-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-[60ch]">{text}</p>
      {children}
    </div>
  );
}

export function CustomBand({ title, text, href, label = "Build my custom list" }: { title: string; text: string; href: string; label?: string }) {
  return (
    <section className="py-14 sm:py-16">
      <div className={wrap}>
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-forest-900 p-7 text-sand-100 sm:p-10 md:flex-row md:items-center">
          <div className="max-w-xl"><h2 className="display text-[2rem] leading-tight text-sand-50 sm:text-4xl">{title}</h2><p className="mt-3 text-sand-200">{text}</p></div>
          <div className="flex flex-wrap gap-3">
            <Link href={href} className="inline-flex h-12 items-center rounded-full bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">{label}</Link>
            <Link href="/sample" className="inline-flex h-12 items-center rounded-full border border-sand-300/50 px-6 font-semibold text-sand-50 hover:bg-forest-700">Request a free sample</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
