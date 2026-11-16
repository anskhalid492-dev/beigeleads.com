import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatUsd, getProduct, startingPriceCents } from "@/lib/catalog";
import { getSolution, type Solution } from "@/lib/solutions";
import { fmtNum } from "@/components/product/meta";
import { SolutionIcon } from "./icons";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export function SolutionHero({ s }: { s: Solution }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 60% at 90% 10%, rgba(143,208,169,0.2), transparent 70%)" }} />
      <div className="relative">
        <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
          <Breadcrumbs wide items={[{ name: "Solutions", href: "/solutions" }, { name: s.name, href: `/solutions/${s.slug}` }]} />
        </div>
        <div className={`${wrap} grid gap-12 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-14`}>
          <div>
            <h1 className="display text-5xl text-sand-50 sm:text-6xl xl:text-7xl">{s.h1}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed">{s.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sample">{s.ctaLabel}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/lists">Browse databases</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-sand-300">One-time payment. No subscription. No account.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-forest-100">
                <SolutionIcon name={s.icon} className="size-5 text-forest-900" />
              </span>
              <p className="font-semibold text-sand-50">From list to result</p>
            </div>
            <ol className="relative mt-7 space-y-6">
              <span aria-hidden className="absolute bottom-3 left-[0.85rem] top-3 w-px bg-forest-300/40" />
              {s.flow.map((step, i) => (
                <li key={step} className="row-in relative flex items-center gap-4" style={{ animationDelay: `${i * 160}ms` }}>
                  <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-forest-300 text-xs font-bold text-forest-900">{i + 1}</span>
                  <span className="text-lg text-sand-50">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Challenge({ s }: { s: Solution }) {
  return (
    <section className={`${wrap} py-20 lg:py-24`}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="display text-4xl text-forest-900 sm:text-5xl">{s.challenge.heading}</h2>
          <p className="mt-3 text-sm text-forest-500">The business challenge</p>
        </div>
        <div className="space-y-5 text-lg leading-relaxed">
          {s.challenge.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? "text-xl font-medium text-forest-900" : ""}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowHelps({ s }: { s: Solution }) {
  return (
    <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className="display max-w-3xl text-4xl text-forest-900 sm:text-5xl">How BeigeLeads helps</h2>
        <div className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {s.helps.map((h) => (
            <div key={h.t} className="border-l-4 border-forest-500 pl-6">
              <h3 className="text-xl font-bold">{h.t}</h3>
              <p className="mt-2">{h.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecommendedDatabases({ s }: { s: Solution }) {
  const items = s.productSlugs.map((x) => getProduct(x)).filter((p) => !!p);
  return (
    <section className={`${wrap} py-20 lg:py-24`}>
      <h2 className="display max-w-3xl text-4xl text-forest-900 sm:text-5xl">Recommended databases</h2>
      <p className="mt-4 max-w-2xl text-lg">{s.productNote}</p>
      <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const start = startingPriceCents(p!);
          return (
            <li key={p!.slug} className="flex flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-shadow hover:shadow-[0_20px_45px_-25px_rgba(15,42,29,0.5)]">
              <h3 className="display text-3xl text-forest-900">{p!.name}</h3>
              <p className="mt-3 flex-1">{p!.description}</p>
              <dl className="mt-5 flex gap-8 border-t border-sand-300 pt-4 text-sm">
                <div>
                  <dt className="text-forest-500">Records</dt>
                  <dd className="font-bold text-forest-900">{fmtNum(p!.recordCount) ?? "Not counted yet"}</dd>
                </div>
                <div>
                  <dt className="text-forest-500">Starting at</dt>
                  <dd className="font-bold text-forest-900">{start === null ? "Not priced yet" : formatUsd(start)}</dd>
                </div>
              </dl>
              <Button asChild variant="secondary" className="mt-5">
                <Link href={`/product/${p!.slug}`}>
                  View database <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6">
        Need a different industry or country?{" "}
        <Link href="/request-category" className="font-semibold text-forest-900 underline underline-offset-4">Request a category</Link> or{" "}
        <Link href="/custom-list" className="font-semibold text-forest-900 underline underline-offset-4">ask for a custom list</Link>.
      </p>
    </section>
  );
}

export function Applications({ s }: { s: Solution }) {
  return (
    <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16`}>
        <h2 className="display text-4xl text-forest-900 sm:text-5xl lg:sticky lg:top-24 lg:self-start lg:text-6xl">Practical applications</h2>
        <ul className="divide-y divide-sand-300 border-y border-sand-300">
          {s.applications.map((a) => (
            <li key={a.t} className="group grid gap-2 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-8">
              <h3 className="display text-2xl text-forest-900 transition-transform group-hover:translate-x-1 sm:text-3xl">{a.t}</h3>
              <p className="self-center">{a.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Beneficiaries({ s }: { s: Solution }) {
  return (
    <section className={`${wrap} py-20 lg:py-24`}>
      <h2 className="display max-w-3xl text-4xl text-forest-900 sm:text-5xl">Who benefits?</h2>
      <ul className="mt-8 flex flex-wrap gap-3">
        {s.beneficiaries.map((b) => (
          <li key={b} className="rounded-full border border-forest-900 px-5 py-2.5 text-lg font-semibold text-forest-900">{b}</li>
        ))}
      </ul>
    </section>
  );
}

export function AvailableData({ s }: { s: Solution }) {
  const rows = Object.entries(s.fieldUse);
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16`}>
        <div>
          <h2 className="display text-4xl text-sand-50 sm:text-5xl">Available data and information</h2>
          <p className="mt-4">
            Each list is a CSV file. These are the fields that matter most for this solution. The product page of each list shows the full set, and the{" "}
            <Link href="/data-sources" className="font-semibold text-sand-50 underline underline-offset-4">data sources page</Link> explains where records come from.
          </p>
        </div>
        <dl className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/5">
          {rows.map(([field, use]) => (
            <div key={field} className="grid gap-1 px-6 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="font-semibold text-forest-300">{field}</dt>
              <dd>{use}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function SolutionSteps({ s }: { s: Solution }) {
  return (
    <section className={`${wrap} py-20 lg:py-24`}>
      <h2 className="display max-w-3xl text-4xl text-forest-900 sm:text-5xl">How it works</h2>
      <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
        {s.steps.map((st, i) => (
          <li key={st.t} className="border-t-2 border-forest-900 pt-5">
            <span className="display text-5xl text-forest-500">{i + 1}</span>
            <h3 className="mt-2 text-xl font-bold">{st.t}</h3>
            <p className="mt-2">{st.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RelatedSolutions({ s }: { s: Solution }) {
  const items = s.related.map((r) => getSolution(r)).filter((x): x is Solution => !!x);
  return (
    <section className="border-t border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className="display max-w-3xl text-4xl text-forest-900 sm:text-5xl">Related solutions</h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((r) => (
            <li key={r.slug}>
              <Link href={`/solutions/${r.slug}`} className="group flex h-full flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-colors hover:border-forest-900 hover:bg-forest-900">
                <SolutionIcon name={r.icon} className="size-6 text-forest-500 group-hover:text-forest-300" />
                <h3 className="display mt-4 text-3xl text-forest-900 group-hover:text-sand-50">{r.name}</h3>
                <p className="mt-2 flex-1 group-hover:text-sand-200">{r.tagline}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-900 group-hover:text-sand-50">
                  Explore solution <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SolutionCta({ heading, text }: { heading: string; text: string }) {
  return (
    <section className={`${wrap} py-20 lg:py-24`}>
      <div className="rounded-[2rem] bg-forest-900 px-8 py-16 text-center sm:px-16 lg:py-20" style={{ backgroundImage: "radial-gradient(60% 80% at 50% 0%, rgba(143,208,169,0.22), transparent 70%)" }}>
        <h2 className="display mx-auto max-w-3xl text-4xl text-sand-50 sm:text-6xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-sand-200">{text}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sample">Request a free sample</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/lists">Explore databases</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
