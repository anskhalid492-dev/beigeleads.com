import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DbBadge } from "@/components/shared/db-icon";
import { formatUsd, getCategory, getCountry, startingPriceCents, type Product } from "@/lib/catalog";
import { fmtNum } from "./meta";

export function RelatedProducts({ items }: { items: readonly Product[] }) {
  if (!items.length) return null;
  return (
    <section className="border-t border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">More business email lists you may need</h2>
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => {
            const start = startingPriceCents(r);
            const cat = getCategory(r.categorySlug);
            return (
              <li key={r.slug} className="flex flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-shadow hover:shadow-[0_20px_45px_-25px_rgba(15,42,29,0.5)]">
                <div className="flex items-center gap-3">
                  <DbBadge category={r.categorySlug} country={getCountry(r.countrySlug)?.code} />
                  <p className="text-sm text-forest-500">{cat?.name}</p>
                </div>
                <h3 className="display mt-2 text-4xl text-forest-900">{r.name}</h3>
                <p className="mt-3 flex-1">{r.description}</p>
                <dl className="mt-6 flex gap-8 border-t border-sand-300 pt-5 text-sm">
                  <div>
                    <dt className="text-forest-500">Records</dt>
                    <dd className="text-lg font-bold text-forest-900">{fmtNum(r.recordCount) ?? "Not counted yet"}</dd>
                  </div>
                  <div>
                    <dt className="text-forest-500">Starting at</dt>
                    <dd className="text-lg font-bold text-forest-900">{start === null ? "Not priced yet" : formatUsd(start)}</dd>
                  </div>
                </dl>
                <Button asChild variant="secondary" className="mt-6">
                  <Link href={`/lists/${r.slug}`}>
                    View database <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
