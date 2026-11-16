import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { DbBadge } from "@/components/shared/db-icon";
import { formatUsd, getCountry, getProduct, startingPriceCents } from "@/lib/catalog";
import { getSolution, type Solution } from "@/lib/solutions";
import { fmtNum } from "@/components/product/meta";
import { SolutionIcon } from "./icons";

/** Wide container used by every solutions section (1400px on desktop). */
export const wrap = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";
const h2 = "display text-5xl text-forest-900 sm:text-6xl lg:text-7xl";
const gridBg = {
  backgroundImage:
    "linear-gradient(rgba(143,208,169,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(143,208,169,0.07) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage: "radial-gradient(70% 80% at 80% 20%, #000, transparent)",
  WebkitMaskImage: "radial-gradient(70% 80% at 80% 20%, #000, transparent)",
} as const;

export function SolutionHero({ s }: { s: Solution }) {
  const products = s.productSlugs.map((x) => getProduct(x)).filter((p) => !!p);
  const fields = Object.keys(s.fieldUse);
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={gridBg} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 60% at 92% 8%, rgba(143,208,169,0.22), transparent 70%)" }} />
      <div className="relative">
        <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
          <Breadcrumbs wide="xl" items={[{ name: "Solutions", href: "/solutions" }, { name: s.name, href: `/solutions/${s.slug}` }]} />
        </div>
        <div className={`${wrap} grid gap-14 pb-24 pt-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-20 lg:pb-32 lg:pt-20`}>
          <div>
            <h1 className="display text-6xl text-sand-50 sm:text-7xl xl:text-[6.5rem] xl:leading-[0.92]">{s.h1}</h1>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed lg:text-2xl lg:leading-relaxed">{s.lede}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sample">{s.ctaLabel}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/lists">Browse databases</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-sand-300">One-time payment. No subscription. No account.</p>
          </div>

          {/* Visual: the route from list to result, with the real databases and fields behind it */}
          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur lg:p-10">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-forest-100">
                <SolutionIcon name={s.icon} className="size-7 text-forest-900" />
              </span>
              <p className="display text-3xl text-sand-50">From list to result</p>
            </div>
            <ol className="relative mt-9 space-y-7">
              <span aria-hidden className="absolute bottom-4 left-[0.95rem] top-4 w-px bg-forest-300/40" />
              {s.flow.map((step, i) => (
                <li key={step} className="row-in relative flex items-center gap-5" style={{ animationDelay: `${i * 160}ms` }}>
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-forest-300 text-sm font-bold text-forest-900">{i + 1}</span>
                  <span className="text-xl text-sand-50">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-9 border-t border-white/10 pt-6">
              <p className="text-sm text-sand-300">Databases that fit</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {products.map((p) => (
                  <li key={p!.slug} className="flex items-center gap-3 rounded-2xl bg-white/10 py-2 pl-2 pr-4">
                    <DbBadge category={p!.categorySlug} country={getCountry(p!.countrySlug)?.code} size="sm" tone="dark" />
                    <span className="text-sm font-semibold text-sand-50">{p!.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-sand-300">Key fields</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {fields.map((f) => (
                  <li key={f} className="rounded-full border border-forest-300/40 px-3 py-1 text-sm text-forest-100">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Challenge({ s }: { s: Solution }) {
  const [lead, ...rest] = s.challenge.paragraphs;
  return (
    <section className="bg-sand-50 py-24 lg:py-32">
      <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-16`}>
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold text-forest-500">The business challenge</p>
          <h2 className={`${h2} mt-4`}>{s.challenge.heading}</h2>
          <p className="mt-8 max-w-3xl text-2xl font-medium leading-snug text-forest-900 lg:text-3xl lg:leading-snug">{lead}</p>
        </div>
        <div className="space-y-6 self-end border-l-2 border-forest-900 pl-8 text-lg leading-relaxed lg:col-span-5 lg:text-xl lg:leading-relaxed">
          {rest.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PainPoints({ s }: { s: Solution }) {
  return (
    <section className="border-y border-sand-200 bg-sand-100 py-24 lg:py-32">
      <div className={wrap}>
        <h2 className={`${h2} max-w-5xl`}>{s.name}: the problems we solve</h2>
        <div className="mt-14 hidden grid-cols-2 gap-x-16 border-b-2 border-forest-900 pb-3 text-sm font-semibold text-forest-500 md:grid">
          <p>What you run into</p>
          <p>What the list gives you</p>
        </div>
        <ul>
          {s.pains.map((p) => (
            <li key={p.pain} className="group grid gap-4 border-b border-sand-300 py-9 md:grid-cols-2 md:gap-x-16">
              <h3 className="display text-3xl text-forest-900 lg:text-4xl">{p.pain}</h3>
              <p className="flex gap-4 text-lg">
                <ArrowRight className="mt-1.5 size-5 shrink-0 text-forest-500 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                <span>{p.fix}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function RecommendedDatabases({ s, heading = "Recommended databases" }: { s: Solution; heading?: string }) {
  const items = s.productSlugs.map((x) => getProduct(x)).filter((p) => !!p);
  return (
    <section className="bg-sand-50 py-24 lg:py-32">
      <div className={wrap}>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 className={`${h2} lg:col-span-6`}>{heading}</h2>
          <p className="text-xl lg:col-span-6 lg:max-w-xl lg:justify-self-end">{s.productNote}</p>
        </div>
        <ul className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const start = startingPriceCents(p!);
            return (
              <li key={p!.slug} className="flex flex-col overflow-hidden rounded-[1.75rem] border border-sand-300 bg-sand-100 transition-shadow hover:shadow-[0_30px_60px_-35px_rgba(15,42,29,0.55)]">
                <div className="flex items-center justify-between bg-forest-900 px-8 py-7">
                  <DbBadge category={p!.categorySlug} country={getCountry(p!.countrySlug)?.code} size="lg" tone="dark" />
                  <span className="rounded-full bg-forest-100 px-3 py-1 text-sm font-semibold text-forest-900">CSV file</span>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <h3 className="display text-4xl text-forest-900">{p!.name}</h3>
                  <p className="mt-3 flex-1 text-lg">{p!.description}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sand-300 pt-5">
                    <div>
                      <dt className="text-sm text-forest-500">Records</dt>
                      <dd className="text-xl font-bold text-forest-900">{fmtNum(p!.recordCount) ?? "Not counted yet"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-forest-500">Starting at</dt>
                      <dd className="text-xl font-bold text-forest-900">{start === null ? "Not priced yet" : formatUsd(start)}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={`/product/${p!.slug}`}>
                        View database <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/sample?product=${p!.slug}`}>Free sample</Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-lg">
          Need a different industry or country?{" "}
          <Link href="/request-category" className="font-semibold text-forest-900 underline underline-offset-4">Request a category</Link> or{" "}
          <Link href="/custom-list" className="font-semibold text-forest-900 underline underline-offset-4">ask for a custom list</Link>.
        </p>
      </div>
    </section>
  );
}

export function Applications({ s }: { s: Solution }) {
  return (
    <section className="border-y border-sand-200 bg-sand-100 py-24 lg:py-32">
      <div className={wrap}>
        <h2 className={`${h2} max-w-5xl`}>How {s.name} teams use the list</h2>
        <ul className="mt-14 grid border-t-2 border-forest-900 md:grid-cols-2 md:gap-x-16">
          {s.applications.map((a) => (
            <li key={a.t} className="group border-b border-sand-300 py-9">
              <h3 className="display text-3xl text-forest-900 transition-transform duration-300 group-hover:translate-x-2 lg:text-4xl">{a.t}</h3>
              <p className="mt-3 max-w-xl text-lg">{a.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Beneficiaries({ s }: { s: Solution }) {
  return (
    <section className="bg-forest-500 py-24 text-sand-50 lg:py-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-12 lg:items-center`}>
        <h2 className="display text-5xl text-sand-50 sm:text-6xl lg:col-span-4 lg:text-7xl">Who benefits?</h2>
        <ul className="flex flex-wrap gap-3 lg:col-span-8">
          {s.beneficiaries.map((b) => (
            <li key={b} className="rounded-full bg-sand-50 px-6 py-3 text-lg font-semibold text-forest-900 transition-transform hover:-translate-y-0.5">{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AvailableData({ s }: { s: Solution }) {
  const rows = Object.entries(s.fieldUse);
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-sand-100 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ ...gridBg, maskImage: "radial-gradient(60% 70% at 10% 90%, #000, transparent)", WebkitMaskImage: "radial-gradient(60% 70% at 10% 90%, #000, transparent)" }} />
      <div className={`${wrap} relative grid gap-12 lg:grid-cols-12 lg:gap-16`}>
        <div className="lg:col-span-5">
          <h2 className="display text-5xl text-sand-50 sm:text-6xl lg:text-7xl">Available data and information</h2>
          <p className="mt-6 max-w-lg text-lg">
            Each list is one CSV file. These are the fields that matter most for this solution. Every product page shows the full set, and the{" "}
            <Link href="/data-sources" className="font-semibold text-sand-50 underline underline-offset-4">data sources page</Link>{" "}
            explains where records come from. Our{" "}
            <Link href="/legal/lawful-use" className="font-semibold text-sand-50 underline underline-offset-4">lawful use policy</Link> covers how you may use them.
          </p>
        </div>
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.05] lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
            <span className="size-3 rounded-full bg-forest-300/60" />
            <span className="size-3 rounded-full bg-forest-300/40" />
            <span className="size-3 rounded-full bg-forest-300/20" />
            <span className="ml-3 text-sm text-sand-300">Fields in this solution</span>
          </div>
          <dl className="divide-y divide-white/10">
            {rows.map(([field, use]) => (
              <div key={field} className="grid gap-1 px-6 py-5 sm:grid-cols-[10rem_1fr] sm:gap-8">
                <dt className="font-semibold text-forest-300">{field}</dt>
                <dd className="text-lg">{use}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function SolutionSteps({ s }: { s: Solution }) {
  return (
    <section className="bg-sand-50 py-24 lg:py-32">
      <div className={wrap}>
        <h2 className={`${h2} max-w-4xl`}>How it works</h2>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          <span aria-hidden className="absolute left-0 right-0 top-[1.15rem] hidden h-px bg-forest-900/25 xl:block" />
          {s.steps.map((st, i) => (
            <li key={st.t} className="relative">
              <span className="relative z-10 grid size-10 place-items-center rounded-full bg-forest-900 text-base font-bold text-forest-300">{i + 1}</span>
              <h3 className="display mt-6 text-3xl text-forest-900">{st.t}</h3>
              <p className="mt-3 text-lg">{st.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function RelatedSolutions({ s }: { s: Solution }) {
  const items = s.related.map((r) => getSolution(r)).filter((x): x is Solution => !!x);
  return (
    <section className="border-t border-sand-200 bg-sand-100 py-24 lg:py-32">
      <div className={wrap}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className={`${h2} max-w-4xl`}>Related solutions</h2>
          <Link href="/solutions" className="text-lg font-semibold text-forest-900 underline underline-offset-4">All solutions</Link>
        </div>
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((r) => (
            <li key={r.slug}>
              <Link href={`/solutions/${r.slug}`} className="group flex h-full min-h-72 flex-col rounded-[1.75rem] border border-sand-300 bg-sand-50 p-8 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900">
                <SolutionIcon name={r.icon} className="size-9 text-forest-500 group-hover:text-forest-300" />
                <h3 className="display mt-6 text-4xl text-forest-900 group-hover:text-sand-50">{r.name}</h3>
                <p className="mt-3 flex-1 text-lg group-hover:text-sand-200">{r.tagline}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-forest-900 group-hover:text-sand-50">
                  Explore solution <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Premium accordion: native <details> (works without JS), wide two-column composition. */
export function SolutionFaq({ name, items }: { name: string; items: readonly (readonly [string, string])[] }) {
  return (
    <section className="bg-sand-50 py-24 lg:py-32">
      <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-16`}>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <h2 className={h2}>FAQs About {name}</h2>
            <p className="mt-6 text-lg">Short answers to what buyers ask us most. Still unsure? Request a free sample and judge the data yourself.</p>
            <Button asChild className="mt-8" size="lg">
              <Link href="/sample">Request a free sample</Link>
            </Button>
          </div>
        </div>
        <div className="space-y-3 lg:col-span-8">
          {items.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-sand-300 bg-sand-100 transition-colors open:border-forest-900 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-lg font-semibold text-forest-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 lg:px-8 lg:text-xl [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300 transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-5" aria-hidden />
                </span>
              </summary>
              <p className="px-6 pb-7 text-lg leading-relaxed lg:px-8">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }}
      />
    </section>
  );
}

export function SolutionCta({ heading, text }: { heading: string; text: string }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 lg:py-32" style={{ backgroundImage: "radial-gradient(60% 90% at 50% 0%, rgba(143,208,169,0.25), transparent 70%)" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={gridBg} />
      <div className={`${wrap} relative grid gap-10 lg:grid-cols-12 lg:items-center`}>
        <h2 className="display text-5xl text-sand-50 sm:text-6xl lg:col-span-7 lg:text-8xl lg:leading-[0.95]">{heading}</h2>
        <div className="lg:col-span-5">
          <p className="text-xl text-sand-200">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sample">Request a free sample</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/lists">Explore databases</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
