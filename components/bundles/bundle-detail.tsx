import Link from "next/link";
import { Package, Check, Mail, FileText, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { AddBundleButton } from "./add-bundle-button";
import { BundleCard } from "./bundle-card";
import { formatUsd, getProduct } from "@/lib/catalog";
import { BUNDLE_DETAIL_FAQS } from "@/lib/bundles/content";
import type { PricedBundle } from "@/lib/bundles/pricing";
import { SITE_URL } from "@/lib/site";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

/** The bundle page. Used by the public route and by the admin preview (`preview` shows a banner and never emits structured data). */
export function BundleDetail({ bundle: b, related, preview = false, status }: { bundle: PricedBundle; related: PricedBundle[]; preview?: boolean; status?: "draft" | "published" }) {
  const allReal = b.components.every((c) => { const p = getProduct(c.slug); return !!p && p.status === "live" && !p.placeholderData; });
  const unavailable = b.components.find((c) => !c.available);
  const offer = !preview && !unavailable && allReal && b.priceCents < b.listCents;
  const paras = b.description.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const url = `${SITE_URL}/bundles/${b.slug}`;
  return (
    <>
      {preview && <p role="status" className="bg-purple-100 px-4 py-3 text-center text-sm font-semibold text-purple-700">Preview. This is how the bundle page looks{status === "published" ? "" : ". It is not visible to visitors until you publish it"}.</p>}
      <Breadcrumbs wide items={[{ name: "Bundles", href: "/bundles" }, { name: b.name, href: `/bundles/${b.slug}` }]} />
      <section className="bg-gradient-to-b from-sand-100 to-sand-50">
        <div className={`${wrap} grid gap-10 pb-14 pt-4 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-14`}>
          <div>
            {b.label && <p className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{b.label}</p>}
            <h1 className="display mt-3 text-5xl text-forest-900 sm:text-6xl">{b.name}</h1>
            {b.shortDescription && <p className="mt-4 max-w-2xl text-xl leading-relaxed">{b.shortDescription}</p>}
            {b.image && <img src={b.image} alt="" fetchPriority="high" decoding="async" className="mt-8 aspect-[16/9] w-full rounded-3xl border border-sand-200 object-cover" />}
          </div>
          <aside aria-label="Bundle price" className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,42,29,0.35)] lg:sticky lg:top-28">
            <p className="text-sm font-semibold text-forest-900">{b.components.length} databases{b.totalRecords ? ` · ${b.totalRecords.toLocaleString("en-US")} contacts` : ""}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Bought separately</dt><dd className="text-forest-500 line-through">{formatUsd(b.listCents)}</dd></div>
              <div className="flex items-end justify-between border-t border-sand-200 pt-3"><dt className="font-bold text-forest-900">Bundle price</dt><dd className="display text-5xl leading-none text-forest-900">{formatUsd(b.priceCents)}</dd></div>
              <div className="flex justify-between text-forest-700"><dt>You save</dt><dd className="font-semibold">{formatUsd(b.savingsCents)} ({b.savingsPercent}%)</dd></div>
            </dl>
            {unavailable
              ? <p role="status" className="mt-5 rounded-xl bg-sand-100 px-4 py-3 text-sm">This bundle is not available right now. {unavailable.reason}</p>
              : <AddBundleButton slug={b.slug} size="lg" className="mt-5" />}
            <p className="mt-3 text-center text-xs">One-time payment in crypto. No subscription, no account.</p>
          </aside>
        </div>
      </section>

      <section aria-labelledby="inside" className={`${wrap} py-14`}>
        <h2 id="inside" className="display text-4xl text-forest-900 sm:text-5xl">What&rsquo;s inside</h2>
        <ul className="mt-8 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
          {b.components.map((c) => (
            <li key={c.slug} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 p-5">
              <div className="min-w-0 flex-1 basis-64">
                <h3 className="text-lg font-bold text-forest-900"><Link href={`/lists/${c.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{c.name}</Link></h3>
                <p className="mt-0.5 text-sm">{[c.categoryName, c.coverage].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="text-sm"><strong className="text-forest-900">{c.packageName}</strong> package{c.records > 0 ? ` · ${c.records.toLocaleString("en-US")} contacts` : ""}</p>
              <p className="text-sm font-semibold text-forest-900">{formatUsd(c.listCents)}</p>
              <Link href={`/lists/${c.slug}`} className="text-sm font-semibold text-forest-900 underline underline-offset-4">View database</Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">Prices on the right are what each database costs on its own. The bundle is one purchase at the bundle price.</p>
      </section>

      {paras.length > 0 && (
        <section aria-labelledby="about" className={`${wrap} pb-14`}>
          <h2 id="about" className="display text-4xl text-forest-900 sm:text-5xl">About this bundle</h2>
          <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed">{paras.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}</div>
        </section>
      )}

      <section aria-labelledby="delivery" className={`${wrap} pb-14`}>
        <h2 id="delivery" className="display text-4xl text-forest-900 sm:text-5xl">How you receive it</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {[[Mail, "One link per database", "After your payment is confirmed we email a download link for every database in the bundle."], [Clock, "Usually instant", "Delivery is mostly instant and can take up to 12 hours."], [FileText, "CSV, Excel or TXT", "Unlimited downloads. You own the files."]].map(([I, t, d]) => {
            const Icon = I as typeof Package;
            return <li key={t as string} className="rounded-2xl border border-sand-200 bg-white p-5"><Icon className="size-5 text-forest-500" aria-hidden /><h3 className="mt-3 font-bold text-forest-900">{t as string}</h3><p className="mt-1 text-sm">{d as string}</p></li>;
          })}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-sm"><Check className="size-4 text-forest-500" aria-hidden /> Same replacement policy as every list: <Link href="/legal/refund-replacement" className="font-semibold underline">Refund &amp; Returns</Link>.</p>
      </section>

      <SolutionFaq name={b.name} items={BUNDLE_DETAIL_FAQS} />

      {related.length > 0 && (
        <section aria-labelledby="more" className={`${wrap} py-14`}>
          <h2 id="more" className="display text-4xl text-forest-900 sm:text-5xl">More bundles</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{related.map((r) => <BundleCard key={r.slug} b={r} />)}</div>
        </section>
      )}

      {!preview && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "Product", name: b.name, description: b.shortDescription || b.name, url, brand: { "@type": "Brand", name: "BeigeLeads" },
          ...(b.image ? { image: b.image.startsWith("/") ? `${SITE_URL}${b.image}` : b.image } : {}),
          ...(offer ? { offers: { "@type": "Offer", priceCurrency: "USD", price: (b.priceCents / 100).toFixed(2), availability: "https://schema.org/InStock", url } } : {}),
          isRelatedTo: b.components.map((c) => ({ "@type": "Product", name: c.name, url: `${SITE_URL}/lists/${c.slug}` })),
        }} />
      )}
    </>
  );
}
