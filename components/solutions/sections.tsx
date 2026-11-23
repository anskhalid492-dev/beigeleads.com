import { solutionProducts } from "@/lib/solution-products";
import Link from "next/link";
import { FaqAnswer } from "@/components/shared/faq-answer";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, type Crumb } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { DbBadge } from "@/components/shared/db-icon";
import { formatUsd, getCountry, startingPriceCents } from "@/lib/catalog";
import { getSolution, type Solution } from "@/lib/solutions";
import { fmtNum } from "@/components/product/meta";
import { SolutionIcon } from "./icons";

/** Container for solutions sections: 1200px on desktop. Text blocks inside use narrower columns. */
export const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const sectionHead = "mx-auto max-w-3xl text-center";

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(143,208,169,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(143,208,169,0.08) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage: "radial-gradient(60% 75% at 50% 35%, #000, transparent)",
  WebkitMaskImage: "radial-gradient(60% 75% at 50% 35%, #000, transparent)",
} as const;

/** Headline whose words rise in one after another. */
function RiseWords({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={`${w}-${i}`} className="rise inline-block" style={{ animationDelay: `${120 + i * 70}ms` }}>
          {w}
          {" "}
        </span>
      ))}
    </>
  );
}

type Chip = { label: string; category?: string; country?: string };

/** Centered, animated hero shared by /solutions and every solution page. */
export function HeroShell({
  crumbs, h1, lede, primary, secondary, flow, chips, icon, note,
}: {
  crumbs: Crumb[];
  h1: string;
  lede: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  flow: readonly string[];
  chips: readonly Chip[];
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100">
      <div aria-hidden className="grid-drift pointer-events-none absolute inset-0" style={gridStyle} />
      <div aria-hidden className="glow-breathe pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.28), transparent)" }} />
      <div className="relative">
        <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
          <Breadcrumbs wide items={crumbs} />
        </div>
        <div className="mx-auto max-w-4xl px-5 pb-8 pt-10 text-center sm:px-8 lg:pt-14">
          <span className="rise mx-auto grid size-16 place-items-center rounded-2xl bg-forest-100 text-forest-900 shadow-[0_0_0_10px_rgba(143,208,169,0.12)]">{icon}</span>
          <h1 className="display mt-8 text-5xl text-sand-50 sm:text-6xl lg:text-7xl lg:leading-[0.95]">
            <RiseWords text={h1} />
          </h1>
          <p className="rise mx-auto mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ animationDelay: "700ms" }}>{lede}</p>
          <div className="rise mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "850ms" }}>
            <Button asChild size="lg"><Link href={primary.href}>{primary.label}</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href={secondary.href}>{secondary.label}</Link></Button>
          </div>
          {note && <p className="rise mt-4 text-sm text-sand-300" style={{ animationDelay: "950ms" }}>{note}</p>}
        </div>

        {/* Pipeline: nodes light up in turn while a dot travels the line */}
        <div className="rise mx-auto max-w-3xl px-5 pb-6 pt-10 sm:px-8" style={{ animationDelay: "1000ms" }}>
          <div className="relative">
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5 h-px bg-forest-300/30" />
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5">
              <span className="travel-dot absolute -top-[3px] size-[7px] -translate-x-1/2 rounded-full bg-forest-300 shadow-[0_0_12px_3px_rgba(143,208,169,0.7)]" />
            </span>
            <ol className="relative grid grid-cols-4 gap-2">
              {flow.map((step, i) => (
                <li key={step} className="flex flex-col items-center text-center">
                  <span className="node-on grid size-10 place-items-center rounded-full text-sm font-bold" style={{ animationDelay: `${i * 1.6}s` }}>{i + 1}</span>
                  <span className="mt-3 text-sm text-sand-100 sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3 px-5 pb-20 pt-4 sm:px-8 lg:pb-24">
          {chips.map((c, i) => (
            <li key={c.label} className="floaty flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] py-1.5 pl-1.5 pr-4 text-sm text-sand-50" style={{ animationDelay: `${i * 0.5}s` }}>
              {c.category ? (
                <DbBadge category={c.category} country={c.country} size="sm" tone="dark" />
              ) : (
                <span className="ml-2.5 size-2 rounded-full bg-forest-300" />
              )}
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SolutionHero({ s }: { s: Solution }) {
  const chips: Chip[] = [
    ...solutionProducts(s).map((p) => ({ label: p.name, category: p.categorySlug, country: getCountry(p.countrySlug)?.code })),
    ...Object.keys(s.fieldUse).map((f) => ({ label: f })),
  ];
  return (
    <HeroShell
      crumbs={[{ name: "Solutions", href: "/solutions" }, { name: s.name, href: `/solutions/${s.slug}` }]}
      h1={s.h1}
      lede={s.lede}
      primary={{ label: s.ctaLabel, href: "/sample" }}
      secondary={{ label: "Browse databases", href: "/lists" }}
      flow={s.flow}
      chips={chips}
      icon={<SolutionIcon name={s.icon} className="size-8" />}
      note="One-time payment. No subscription. No account."
    />
  );
}

export function Challenge({ s }: { s: Solution }) {
  const [lead, ...rest] = s.challenge.paragraphs;
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <p className="text-sm font-semibold text-forest-500">The business challenge</p>
          <h2 className={`${h2} mt-3`}>{s.challenge.heading}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-lg leading-relaxed">
          <p className="text-xl font-medium text-forest-900 sm:text-2xl sm:leading-snug">{lead}</p>
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
    <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>{s.name}: the problems we solve</h2>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {s.pains.map((p) => (
            <li key={p.pain} className="flex flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7">
              <p className="text-sm font-semibold text-forest-500">You run into</p>
              <h3 className="display mt-2 text-2xl text-forest-900 sm:text-[1.7rem]">{p.pain}</h3>
              <div className="mt-5 flex flex-1 gap-3 border-t border-sand-300 pt-5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                  <Check className="size-4" aria-hidden />
                </span>
                <p>{p.fix}</p>
              </div>
            </li>
          ))}
          <li className="flex flex-col justify-between rounded-3xl bg-forest-900 p-7 text-sand-100">
            <p className="display text-2xl text-sand-50 sm:text-[1.7rem]">Check it yourself before you pay.</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/sample">Request a free sample</Link>
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function RecommendedDatabases({ s, heading = "Recommended databases" }: { s: Solution; heading?: string }) {
  const items = solutionProducts(s);
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>{heading}</h2>
          <p className="mt-4 text-lg">{s.productNote}</p>
        </div>
        <ul className="mt-12 flex flex-wrap justify-center gap-6">
          {items.map((p) => {
            const start = startingPriceCents(p!);
            return (
              <li key={p!.slug} className="flex w-full flex-col overflow-hidden rounded-3xl border border-sand-300 bg-sand-100 transition-shadow hover:shadow-[0_25px_50px_-30px_rgba(15,42,29,0.6)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex items-center justify-between bg-forest-900 px-6 py-5">
                  <DbBadge category={p!.categorySlug} hint={p!.name} country={getCountry(p!.countrySlug)?.code} size="md" tone="dark" />
                  <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-900">CSV · Excel · TXT</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="display text-3xl text-forest-900">{p!.name}</h3>
                  <p className="mt-2 flex-1">{p!.description}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-sand-300 pt-4">
                    <div>
                      <dt className="text-sm text-forest-500">Records</dt>
                      <dd className="text-lg font-bold text-forest-900">{fmtNum(p!.recordCount) ?? "Not counted yet"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-forest-500">Starting at</dt>
                      <dd className="text-lg font-bold text-forest-900">{start === null ? "Not priced yet" : formatUsd(start)}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild size="sm">
                      <Link href={`/lists/${p!.slug}`}>
                        View database <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/sample?product=${p!.slug}`}>Free sample</Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-center">
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
    <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>How {s.name} teams use the list</h2>
        </div>
        <ul className="mx-auto mt-12 max-w-4xl divide-y divide-sand-300 border-y border-sand-300">
          {s.applications.map((a) => (
            <li key={a.t} className="group grid gap-2 py-6 sm:grid-cols-[1fr_1.2fr] sm:gap-10">
              <h3 className="display text-2xl text-forest-900 transition-transform duration-300 group-hover:translate-x-1.5 sm:text-3xl">{a.t}</h3>
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
    <section className="bg-forest-500 py-16 text-sand-50 lg:py-20">
      <div className={`${wrap} text-center`}>
        <h2 className="display text-4xl text-sand-50 sm:text-5xl">Who benefits?</h2>
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {s.beneficiaries.map((b) => (
            <li key={b} className="rounded-full bg-sand-50 px-5 py-2.5 font-semibold text-forest-900 transition-transform hover:-translate-y-0.5">{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AvailableData({ s }: { s: Solution }) {
  const rows = Object.entries(s.fieldUse);
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className="display text-4xl text-sand-50 sm:text-5xl">Available data and information</h2>
          <p className="mt-4 text-lg">
            Each list is one file in CSV, Excel or TXT format. These are the fields that matter most here. The{" "}
            <Link href="/data-sources" className="font-semibold text-sand-50 underline underline-offset-4">data sources page</Link>{" "}
            shows where records come from, and the{" "}
            <Link href="/legal/lawful-use" className="font-semibold text-sand-50 underline underline-offset-4">lawful use policy</Link> covers how you may use them.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05]">
          <dl className="divide-y divide-white/10">
            {rows.map(([field, use]) => (
              <div key={field} className="grid gap-1 px-6 py-4 sm:grid-cols-[9rem_1fr] sm:gap-8">
                <dt className="font-semibold text-forest-300">{field}</dt>
                <dd>{use}</dd>
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
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>How it works</h2>
        </div>
        <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-forest-900/25 lg:block" />
          {s.steps.map((st, i) => (
            <li key={st.t} className="relative text-center">
              <span className="relative z-10 mx-auto grid size-10 place-items-center rounded-full bg-forest-900 font-bold text-forest-300">{i + 1}</span>
              <h3 className="display mt-5 text-2xl text-forest-900">{st.t}</h3>
              <p className="mx-auto mt-2 max-w-xs">{st.d}</p>
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
    <section className="border-t border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>Related solutions</h2>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((r) => (
            <li key={r.slug}>
              <Link href={`/solutions/${r.slug}`} className="group flex h-full flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-colors duration-300 hover:border-forest-900 hover:bg-forest-900">
                <SolutionIcon name={r.icon} className="size-8 text-forest-500 group-hover:text-forest-300" />
                <h3 className="display mt-5 text-3xl text-forest-900 group-hover:text-sand-50">{r.name}</h3>
                <p className="mt-2 flex-1 group-hover:text-sand-200">{r.tagline}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-900 group-hover:text-sand-50">
                  Explore solution <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center">
          <Link href="/solutions" className="font-semibold text-forest-900 underline underline-offset-4">See all solutions</Link>
        </p>
      </div>
    </section>
  );
}

/** Accordion: native <details>, works without JS. Single centered column. */
export function SolutionFaq({ name, items }: { name: string; items: readonly (readonly [string, string])[] }) {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={sectionHead}>
          <h2 className={h2}>FAQs About {name}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {items.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-sand-300 bg-sand-100 transition-colors open:border-forest-900 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-4 text-lg font-semibold text-forest-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300 transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-4" aria-hidden />
                </span>
              </summary>
              <p className="px-6 pb-6 leading-relaxed"><FaqAnswer text={a} /></p>
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

export function SolutionCta({ heading, text, primaryLabel = "Request a free sample", secondaryLabel = "Explore databases", primaryHref = "/sample", secondaryHref = "/lists" }: { heading: string; text: string; primaryLabel?: string; secondaryLabel?: string; primaryHref?: string; secondaryHref?: string }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 py-20 text-center lg:py-24">
      <div aria-hidden className="glow-breathe pointer-events-none absolute left-1/2 top-0 h-80 w-[48rem] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.25), transparent)" }} />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="display text-4xl text-sand-50 sm:text-6xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-sand-200">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
