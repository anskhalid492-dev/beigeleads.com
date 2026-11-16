import Link from "next/link";
import { AlertTriangle, BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { fmtDate } from "./meta";

export function ProductQuality({ product }: { product: Product }) {
  const contactFields = product.fields.filter((f) => ["Email", "Phone", "Website"].includes(f));
  const rows: [string, React.ReactNode][] = [
    ["Verification", "Email addresses are checked by our own team with SMTP checks."],
    ["Contact information", contactFields.length ? contactFields.join(", ") : "None"],
    ["Completeness", "Not every business publishes every detail, so some cells can be empty. A per-list completeness figure is published once it is measured."],
    ["Last updated", fmtDate(product.lastVerified) ?? "Not verified yet"],
    ["Data sourcing", <>Public listings, websites, registries, directories, licensed data, surveys and our own research. <Link href="/data-sources" className="font-semibold text-forest-900 underline underline-offset-4">See every source type</Link>.</>],
    ["File format", "CSV file"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">Data quality and transparency</h2>
      <p className="mt-4 max-w-2xl text-lg">What we check, what you get, and where the limits are, stated plainly.</p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <dl className="divide-y divide-sand-300 rounded-3xl border border-sand-300 bg-sand-50">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-7 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="flex items-center gap-2 font-semibold text-forest-900">
                <BadgeCheck className="size-4 shrink-0 text-forest-500" aria-hidden /> {k}
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="rounded-3xl bg-sand-200/70 p-7">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="size-5 text-forest-500" aria-hidden /> Limits you should know about
          </h3>
          <ul className="mt-4 list-disc space-y-3 pl-5">
            <li>No verification is perfect. Some mail servers accept every address, so a small share of contacts can still bounce.</li>
            <li>Businesses change. Data can go stale between our 60-day re-checks.</li>
            <li>You are responsible for how you use the data. Follow the <Link href="/legal/lawful-use" className="font-semibold text-forest-900 underline underline-offset-4">lawful use policy</Link> and the laws that apply to you.</li>
            <li>If contacts bounce, the <Link href="/legal/refund-replacement" className="font-semibold text-forest-900 underline underline-offset-4">Refund &amp; Returns policy</Link> explains it: above a 5% bounce rate, we replace bounced emails until the list is back to 95%.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
