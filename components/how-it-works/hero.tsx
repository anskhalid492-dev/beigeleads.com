import Link from "next/link";
import { Download, Package, Search, Table2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodes = [
  [Search, "Find leads", "Search by industry and place"],
  [Table2, "Preview data", "Inspect a masked sample"],
  [Package, "Choose package", "Pick the size you need"],
  [Wallet, "Pay securely", "One payment in crypto"],
  [Download, "Receive your list", "A download link by email"],
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-6 lg:pb-24" aria-labelledby="hiw-h1">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-500">Simple. Transparent. Yours.</p>
        <h1 id="hiw-h1" className="display mx-auto mt-3 max-w-4xl text-6xl text-forest-900 sm:text-7xl lg:text-8xl">
          From finding leads to owning the list. It&rsquo;s that simple.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg">
          Discover business contact lists, preview the data, choose your package, and receive your file. One purchase, no subscription.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/#find-leads">Find My Leads</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/sample">See a Free Sample</Link></Button>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <ol className="relative grid gap-7 md:grid-cols-5 md:gap-4" aria-label="The BeigeLeads buying process">
          {/* Progress line: horizontal on desktop, vertical on mobile. */}
          <span aria-hidden className="absolute left-[10%] right-[10%] top-8 hidden h-0.5 bg-sand-300 md:block">
            <span className="hiw-fill-x block h-full bg-forest-500" />
          </span>
          <span aria-hidden className="absolute bottom-8 left-8 top-8 w-0.5 bg-sand-300 md:hidden">
            <span className="hiw-fill-y block h-full bg-forest-500" />
          </span>
          {nodes.map(([Icon, title, text], i) => (
            <li key={title} className="group relative flex items-center gap-4 md:flex-col md:gap-3 md:text-center">
              <span
                style={{ animationDelay: `${i * 1.2}s` }}
                className="hiw-glow relative z-10 grid size-16 shrink-0 place-items-center rounded-2xl border border-sand-300 bg-white text-forest-700 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-forest-900 group-hover:bg-forest-900 group-hover:text-sand-50"
              >
                <Icon className="size-7" aria-hidden />
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-forest-900 text-xs font-bold text-sand-50">{i + 1}</span>
              </span>
              <span className="text-left md:text-center">
                <span className="block font-semibold text-forest-900">{title}</span>
                <span className="block text-sm">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
