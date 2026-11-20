import Link from "next/link";
import { Database, Layers3, MapPinned, ShieldCheck, CalendarCheck2 } from "lucide-react";
import type { Country, Product } from "@/lib/catalog";
import { fmtDate, fmtNum } from "./meta";

function Ring({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="size-28" role="img" aria-label={`${pct} percent`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--color-forest-300)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)"
      />
      <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--color-sand-50)" style={{ fontStretch: "75%" }}>
        {pct}%
      </text>
    </svg>
  );
}

/** Only stats that exist in the product data are drawn (no phone/website counts yet). */
export function ProductStats({ product, country, cityCount }: { product: Product; country: Country; cityCount: number }) {
  const records = fmtNum(product.recordCount);
  const verified = fmtDate(product.lastVerified);
  return (
    <section className="bg-forest-900 text-sand-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="display max-w-3xl text-5xl text-sand-50 sm:text-6xl">{product.name} at a glance</h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          {records && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 lg:col-span-3">
              <Database className="size-6 text-forest-300" aria-hidden />
              <p className="display mt-6 text-7xl text-sand-50 sm:text-8xl">{records}</p>
              <p className="mt-2 text-lg">Total records</p>
            </div>
          )}
          {product.accuracyPct !== null && (
            <div className="flex items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 lg:col-span-3">
              <Ring pct={product.accuracyPct} />
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold text-sand-50">
                  <ShieldCheck className="size-5 text-forest-300" aria-hidden /> Accuracy
                </p>
                <p className="mt-2 text-sm">95% accurate. If more than 5% of emails bounce, we replace them or refund proportionally. See the <Link href="/legal/refund-replacement" className="font-semibold text-sand-50 underline underline-offset-2">refund policy</Link>.</p>
              </div>
            </div>
          )}
          {verified && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 lg:col-span-2">
              <CalendarCheck2 className="size-6 text-forest-300" aria-hidden />
              <p className="display mt-5 text-4xl text-sand-50">{verified}</p>
              <p className="mt-1">Last verified. Re-checked every 60 days.</p>
            </div>
          )}
          {product.fields.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 lg:col-span-2">
              <Layers3 className="size-6 text-forest-300" aria-hidden />
              <p className="display mt-5 text-4xl text-sand-50">{product.fields.length} fields</p>
              <p className="mt-1">{product.fields.slice(0, 6).join(", ")} and more.</p>
            </div>
          )}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 lg:col-span-2">
            <MapPinned className="size-6 text-forest-300" aria-hidden />
            <p className="display mt-5 text-4xl text-sand-50">{country.name}</p>
            <p className="mt-1">{cityCount > 0 ? `${cityCount} city pages.` : "Coverage area."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
