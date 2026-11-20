import Link from "next/link";
import { CalendarClock, FileSpreadsheet, Globe2, Layers, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import type { Category, Country, Product } from "@/lib/catalog";
import type { ProductSampleRow } from "@/lib/sample-data";
import { fmtDate, fmtNum } from "./meta";
import { withThe } from "@/lib/product-seo";

function DbWindow({ product, rows }: { product: Product; rows: readonly ProductSampleRow[] }) {
  const file = `${product.slug.replace(/-us$/, "")}-email-list`;
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
  const facts = [
    { icon: Globe2, label: "Country", value: country.name },
    { icon: Layers, label: "Industry", value: category.name },
    { icon: Users, label: "Records", value: fmtNum(product.recordCount) ?? "Not counted yet" },
    { icon: Mail, label: "Email", value: hasEmail ? "Included" : "Not included" },
    { icon: FileSpreadsheet, label: "Format", value: "CSV, Excel or TXT" },
    { icon: CalendarClock, label: "Last updated", value: fmtDate(product.lastVerified) ?? "Not verified yet" },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand-100 to-sand-50">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(216,234,223,0.9), transparent)" }}
      />
      <Breadcrumbs
        wide
        items={[
          { name: "Lists", href: "/lists" },
          { name: category.name, href: `/lists/${category.slug}` },
          { name: product.name, href: `/product/${product.slug}` },
        ]}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-28 lg:pt-14">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <DbBadge category={category.slug} country={country.code} size="lg" />
            <span className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900">
              <Flag code={country.code} /> {country.name}
            </span>
          </div>
          <h1 className="display text-6xl text-forest-900 sm:text-7xl xl:text-[5.75rem]">{product.name}
            <span className="mt-3 block text-3xl text-forest-500 sm:text-4xl">for {withThe(country)}</span>
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed">{product.description}</p>

          <dl className="mt-9 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-sand-300 bg-sand-50/80 p-6 backdrop-blur sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3">
                <f.icon className="mt-0.5 size-5 shrink-0 text-forest-500" aria-hidden />
                <div>
                  <dt className="text-xs text-forest-500">{f.label}</dt>
                  <dd className="font-semibold text-forest-900">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/sample?product=${product.slug}`}>Get a free sample</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#pricing">Get This List</a>
            </Button>
          </div>
          <p className="mt-4 text-sm">One-time payment. No subscription. No account.</p>
          {!forSale && (
            <p className="mt-5 max-w-xl rounded-xl bg-forest-100 px-4 py-3 text-sm font-medium text-forest-900">
              Preview build: the record count, dates, accuracy and prices on this page are placeholders. This list is not for sale yet.
            </p>
          )}
        </div>
        <DbWindow product={product} rows={rows} />
      </div>
    </section>
  );
}
