import Link from "next/link";
import { CalendarClock, Globe2, Layers, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getCity, type Category, type Country, type Product } from "@/lib/catalog";
import type { ProductSampleRow } from "@/lib/sample-data";
import { fmtDate, fmtNum } from "./meta";
import { withThe } from "@/lib/product-seo";

function DbWindow({ product, rows }: { product: Product; rows: readonly ProductSampleRow[] }) {
  const file = `${product.slug.replace(/-us$/, "").replace(/-email-(list|database)$/, "")}-email-list`;
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_70px_-25px_rgba(15,42,29,0.7)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/25" />
        <span className="size-2.5 rounded-full bg-white/25" />
        <span className="size-2.5 rounded-full bg-white/25" />
        <span className="ml-3 truncate font-mono text-xs text-sand-300">{file}</span>
        <span className="ml-auto rounded-full bg-forest-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-forest-900">Masked sample on every list page</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-left text-[0.8rem]">
          <thead>
            <tr className="text-forest-300">
              {["Business", "Email", "Phone"].map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((r, i) => (
              <tr key={r.business} className="row-in border-t border-white/10 text-sand-100" style={{ animationDelay: `${i * 140}ms` }}>
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-sand-50">{r.business}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">{r.email}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">{r.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-3 text-xs text-sand-300">
        <span>
          Showing {Math.min(rows.length, 6)} of {fmtNum(product.recordCount) ?? "an uncounted number of"} records
        </span>
        <span>CSV · Excel · TXT</span>
      </div>
    </div>
  );
}

export function ProductHero({
  product, category, country, rows, forSale,
}: { product: Product; category: Category; country: Country; rows: readonly ProductSampleRow[]; forSale: boolean }) {
  const hasEmail = product.fields.includes("Email");
  const cityName = product.citySlug ? getCity(country.slug, product.citySlug)?.name : undefined;
  const coverage = cityName ? `${cityName}, ${country.name}` : product.scope === "country" ? `All of ${country.name}` : country.name;
  const sub = cityName ? `in ${cityName}, ${country.name}` : product.scope === "country" ? "Full country coverage" : `for ${withThe(country)}`;
  const general = category.kind === "general";
  const stats = [
    { label: "Records", value: fmtNum(product.recordCount) ?? "Count to be confirmed" },
    { label: "Data fields", value: String(product.fields.length) },
    { label: "File formats", value: "CSV, Excel, TXT", one: true },
  ];
  const facts = [
    { icon: Globe2, label: "Coverage", value: coverage },
    { icon: Layers, label: "Industry", value: general ? "All industries" : category.name },
    { icon: Mail, label: "Email", value: hasEmail ? "Included" : "Not included" },
    { icon: CalendarClock, label: "Last updated", value: fmtDate(product.lastVerified) ?? "Not verified yet" },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand-100 to-sand-50">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(216,234,223,0.9), transparent)" }} />
      <Breadcrumbs wide items={[
        { name: "Lists", href: "/lists" },
        ...(general ? [{ name: `${country.name} Business Email Lists`, href: `/lists/${country.slug}-business-email-lists` }] : [{ name: category.name, href: `/lists/${category.slug}` }]),
        { name: product.name, href: `/lists/${product.slug}` },
      ]} />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-8 lg:pb-20 lg:pt-8">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <DbBadge category={category.slug} country={country.code} size="lg" />
            <span className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900"><Flag code={country.code} /> {coverage}</span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 text-sm font-semibold text-forest-900">One-time purchase</span>
          </div>
          <h1 className="display text-5xl text-forest-900 sm:text-6xl xl:text-[4.4rem]">{product.name}
            <span className="mt-2 block text-xl text-forest-500 sm:text-3xl">{sub}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">{product.description}</p>

          <dl className="mt-7 grid max-w-2xl grid-cols-3 divide-x divide-sand-300 rounded-2xl border border-sand-300 bg-sand-50/80">
            {stats.map((x) => (
              <div key={x.label} className="px-4 py-4 sm:px-6">
                <dd className={`display leading-tight text-forest-900 ${"one" in x && x.one ? "whitespace-nowrap text-[0.85rem] sm:text-2xl" : "text-2xl sm:text-3xl"}`}>{x.value}</dd>
                <dt className="mt-1 text-xs text-forest-500">{x.label}</dt>
              </div>
            ))}
          </dl>
          <dl className="mt-4 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-2.5">
                <f.icon className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />
                <div><dt className="text-xs text-forest-500">{f.label}</dt><dd className="text-sm font-semibold text-forest-900">{f.value}</dd></div>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#pricing">Get This List</a></Button>
            <Button asChild size="lg" variant="secondary"><Link href={`/sample?product=${product.slug}`}>Request a Sample</Link></Button>
          </div>
          <p className="mt-4 text-sm">One-time payment. No subscription. No account.</p>
          {!forSale && (
            <p className="mt-5 max-w-xl rounded-xl bg-forest-100 px-4 py-3 text-sm font-medium text-forest-900">
              Preview build: the record count, dates and prices on this page are placeholders or not entered yet. This list is not for sale yet.
            </p>
          )}
        </div>
        <DbWindow product={product} rows={rows} />
      </div>
    </section>
  );
}
