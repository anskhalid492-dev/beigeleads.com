import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/catalog";
import type { ProductSampleRow } from "@/lib/sample-data";
import { fmtNum } from "./meta";

const columns: { field: string; label: string; key: keyof ProductSampleRow }[] = [
  { field: "Business name", label: "Business name", key: "business" },
  { field: "Address", label: "Address", key: "address" },
  { field: "City", label: "City", key: "city" },
  { field: "Phone", label: "Phone", key: "phone" },
  { field: "Email", label: "Email", key: "email" },
  { field: "Website", label: "Website", key: "website" },
];

const masked = new Set(["address", "phone", "email"]);

export function ProductSample({ product, rows }: { product: Product; rows: readonly ProductSampleRow[] }) {
  const cols = columns.filter((c) => product.fields.includes(c.field)); // only fields this list really has
  return (
    <section id="sample" className="scroll-mt-20 bg-sand-100 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">See what&rsquo;s inside the {product.name}</h2>
            <p className="mt-4 max-w-2xl text-lg">
              Explore a sample of the business information included in this database before making your purchase.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/sample?product=${product.slug}`}>Request your free sample</Link>
          </Button>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-[0_24px_60px_-30px_rgba(15,42,29,0.45)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left">
              <thead className="bg-forest-900 text-sand-100">
                <tr>
                  {cols.map((c, i) => (
                    <th key={c.key} scope="col" className={`px-5 py-4 text-sm font-semibold ${i === 0 ? "sticky left-0 bg-forest-900" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={r.business} className={`group border-t border-sand-200 transition-colors hover:bg-forest-100/60 ${ri % 2 ? "bg-sand-50" : "bg-white"}`}>
                    {cols.map((c, i) => (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap px-5 py-4 ${i === 0 ? "sticky left-0 bg-inherit font-semibold text-forest-900" : ""} ${masked.has(c.key) ? "font-mono text-sm" : ""}`}
                      >
                        {masked.has(c.key) && <Lock className="mr-1.5 inline size-3 text-forest-500" aria-hidden />}
                        {r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 bg-forest-900 px-5 py-4 text-sm text-sand-100">
            <span className="flex items-center gap-2">
              <Lock className="size-4" aria-hidden /> Contact details stay masked until you buy. The full file has every row, unmasked.
            </span>
            <span>
              {rows.length} of {fmtNum(product.recordCount) ?? "all"} records shown
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm">Layout preview with placeholder rows. These are not real businesses.</p>
      </div>
    </section>
  );
}
