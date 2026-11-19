import Link from "next/link";
import { ArrowRight, Check, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/shared/json-ld";
import { DbBadge } from "@/components/shared/db-icon";
import { fieldMeta, fmtDate, fmtNum } from "@/components/product/meta";
import { FIELDS, formatUsd, getCategory, getCities, getCountry, getProduct, startingPriceCents, type Product } from "@/lib/catalog";
import { productSamples, type ProductSampleRow } from "@/lib/sample-data";
import { getFocus } from "@/lib/solution-focus";
import { solutions, type Solution } from "@/lib/solutions";
import { SolutionIcon } from "./icons";
import { PainTabs } from "./pain-tabs";
import { wrap } from "./sections";

/** White rounded panel on the sand page background, as in the reference layout. */
function Panel({ children, id, dark }: { children: React.ReactNode; id?: string; dark?: boolean }) {
  return (
    <section id={id} className={wrap}>
      <div className={`rounded-[2rem] border p-6 sm:p-10 lg:p-14 ${dark ? "relative overflow-hidden border-forest-900 bg-forest-900" : "border-sand-200 bg-white"}`}>{children}</div>
    </section>
  );
}

function Title({ lead, accent, sub }: { lead: string; accent: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="display text-4xl text-forest-900 sm:text-5xl">
        {lead} <span className="text-purple-600">{accent}</span>
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-lg">{sub}</p>}
    </div>
  );
}

const cols: { field: string; label: string; key: keyof ProductSampleRow }[] = [
  { field: "Business name", label: "Business name", key: "business" },
  { field: "Address", label: "Address", key: "address" },
  { field: "City", label: "City", key: "city" },
  { field: "Phone", label: "Phone", key: "phone" },
  { field: "Email", label: "Email", key: "email" },
  { field: "Website", label: "Website", key: "website" },
];
const masked = new Set(["address", "phone", "email"]);

export function primaryProduct(s: Solution): Product | undefined {
  return getProduct(s.productSlugs[0]);
}

export function PreviewPanel({ s }: { s: Solution }) {
  const p = primaryProduct(s);
  if (!p) return null;
  const rows = (productSamples[p.categorySlug] ?? []).slice(0, 5);
  const shown = cols.filter((c) => p.fields.includes(c.field));
  return (
    <Panel id="preview">
      <Title lead="Preview our" accent={p.name} sub="A masked sample of the real layout. Contact details are hidden here and unlocked in the full file." />
      <div className="mt-10 overflow-hidden rounded-2xl border border-sand-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Masked sample rows from the {p.name}</caption>
            <thead className="bg-forest-900 text-sand-50">
              <tr>{shown.map((c) => <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {rows.map((r) => (
                <tr key={r.business} className="odd:bg-white even:bg-sand-50">
                  {shown.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-4 py-3 ${c.key === "business" ? "font-semibold text-forest-900" : ""}`}>
                      {masked.has(c.key) ? (
                        <span className="inline-flex items-center gap-1.5"><Lock className="size-3 text-forest-500" aria-hidden />{r[c.key]}</span>
                      ) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href={`/product/${p.slug}`}>Get full access</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/sample">Request free sample</Link></Button>
        </div>
        {p.placeholderData && <p className="text-center text-sm text-forest-500">Example rows with fictional businesses, shown to demonstrate the layout.</p>}
      </div>
    </Panel>
  );
}

export function FieldsPanel({ s }: { s: Solution }) {
  const p = primaryProduct(s);
  const fields = (p ? FIELDS.filter((f) => p.fields.includes(f)) : FIELDS) as readonly string[];
  return (
    <Panel id="fields">
      <Title lead="What's included in the" accent={`${p ? p.name : "BeigeLeads database"}?`} sub="Seven fields per record. Nothing is listed here that the files do not contain." />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {fields.map((f) => {
          const m = fieldMeta[f];
          const Icon = m.icon;
          return (
            <li key={f} className="rounded-2xl border border-sand-200 bg-sand-50 p-5 transition-colors hover:border-forest-500">
              <span className="grid size-11 place-items-center rounded-xl bg-forest-100 text-forest-900"><Icon className="size-5" aria-hidden /></span>
              <h3 className="mt-4 text-lg font-bold text-forest-900">{f}</h3>
              <p className="mt-1.5 text-sm leading-relaxed">{s.fieldUse[f as keyof typeof s.fieldUse] ?? m.text}</p>
            </li>
          );
        })}
        <li className="flex flex-col justify-between rounded-2xl border border-dashed border-forest-500 bg-forest-100/50 p-5">
          <div>
            <h3 className="text-lg font-bold text-forest-900">Need other fields?</h3>
            <p className="mt-1.5 text-sm leading-relaxed">Tell us what you need and we will say whether we can supply it.</p>
          </div>
          <Link href="/contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900 underline-offset-4 hover:underline">Talk to us <ArrowRight className="size-4" aria-hidden /></Link>
        </li>
      </ul>
    </Panel>
  );
}

export function WhyPanel({ s }: { s: Solution }) {
  const { audience } = getFocus(s.slug);
  return (
    <Panel id="why">
      <Title lead={`Why ${audience} choose`} accent="BeigeLeads" />
      <ul className="mt-10 grid gap-5 md:grid-cols-2">
        {s.helps.map((h) => (
          <li key={h.t} className="flex gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-6">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300"><Check className="size-4" aria-hidden /></span>
            <div>
              <h3 className="text-xl font-bold text-forest-900">{h.t}</h3>
              <p className="mt-2 leading-relaxed">{h.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function StepsPanel({ s }: { s: Solution }) {
  const p = primaryProduct(s);
  return (
    <Panel id="how">
      <Title lead="How to use the" accent={p ? p.name : "the BeigeLeads database"} />
      <ol className="relative mt-12 grid gap-6 md:grid-cols-4">
        <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-sand-300 md:block" />
        {s.steps.map((st, i) => (
          <li key={st.t} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 grid size-10 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50 ring-8 ring-white">{i + 1}</span>
            <div className="mt-5 w-full flex-1 rounded-2xl border border-sand-200 bg-sand-50 p-5">
              <h3 className="text-lg font-bold text-forest-900">{st.t}</h3>
              <p className="mt-2 text-sm leading-relaxed">{st.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function ListsPanel({ s }: { s: Solution }) {
  const prods = s.productSlugs.flatMap((x) => { const p = getProduct(x); return p ? [p] : []; });
  const { focus } = getFocus(s.slug);
  const country = getCountry("united-states");
  const cities = country ? getCities(country.slug) : [];
  const first = prods[0];
  const catName = first ? getCategory(first.categorySlug)?.name ?? "" : "";
  return (
    <Panel id="lists">
      <Title lead="Databases for" accent={focus} sub={s.productNote} />
      <ul className="mt-10 flex flex-wrap justify-center gap-5">
        {prods.map((p) => (
          <li key={p.slug} className="flex w-full flex-col rounded-2xl md:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.85rem)] border border-sand-200 bg-sand-50 p-6 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <DbBadge category={p.categorySlug} country={getCountry(p.countrySlug)?.code} />
              <h3 className="text-lg font-bold leading-tight text-forest-900">{p.name}</h3>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-forest-500">Records</dt><dd className="font-bold text-forest-900">{fmtNum(p.recordCount) ?? "Soon"}</dd></div>
              <div><dt className="text-forest-500">From</dt><dd className="font-bold text-forest-900">{startingPriceCents(p) === null ? "Soon" : formatUsd(startingPriceCents(p) as number)}</dd></div>
              {p.lastVerified && <div className="col-span-2"><dt className="text-forest-500">Last verified</dt><dd className="font-bold text-forest-900">{fmtDate(p.lastVerified)}</dd></div>}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="sm"><Link href={`/product/${p.slug}`}>View database</Link></Button>
              <Button asChild size="sm" variant="secondary"><Link href="/sample">Free sample</Link></Button>
            </div>
          </li>
        ))}
      </ul>
      {first && cities.length > 0 && (
        <div className="mt-10 border-t border-sand-200 pt-8 text-center">
          <h3 className="text-lg font-bold text-forest-900">Browse by city</h3>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link href={`/lists/${first.categorySlug}/${c.countrySlug}/${c.slug}`} className="inline-flex rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-forest-900 hover:border-forest-900">{catName} in {c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export function UsePanel({ s }: { s: Solution }) {
  const spans = ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];
  return (
    <Panel id="use">
      <Title lead={`What ${getFocus(s.slug).audience} do with`} accent="the data" />
      <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        {s.applications.map((a, i) => (
          <li key={a.t} className={`rounded-2xl border border-sand-200 bg-sand-50 p-6 ${spans[i] ?? "lg:col-span-2"}`}>
            <h3 className="text-xl font-bold text-forest-900">{a.t}</h3>
            <p className="mt-2 leading-relaxed">{a.d}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center"><Button asChild size="lg"><Link href="/sample">Request a free sample</Link></Button></div>
    </Panel>
  );
}

export function ChallengesPanel({ s }: { s: Solution }) {
  const { audience } = getFocus(s.slug);
  return (
    <Panel id="challenges">
      <Title lead={`Who uses this data, and`} accent="what it solves" sub={`Pick a challenge ${audience} run into.`} />
      <div className="mt-10"><PainTabs pains={s.pains} /></div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-sm font-semibold text-forest-900">Typical buyers:</span>
        {s.beneficiaries.map((b) => <span key={b} className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-forest-900">{b}</span>)}
      </div>
    </Panel>
  );
}

export function OthersPanel({ s }: { s: Solution }) {
  const others = [...s.related, ...solutions.map((x) => x.slug)]
    .filter((x, i, a) => x !== s.slug && a.indexOf(x) === i)
    .slice(0, 6)
    .flatMap((x) => { const o = solutions.find((y) => y.slug === x); return o ? [o] : []; });
  return (
    <Panel id="others">
      <Title lead="Explore other" accent="solutions" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((o) => (
          <li key={o.slug}>
            <Link href={`/solutions/${o.slug}`} className="group flex h-full gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-5 transition-colors hover:border-forest-900">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-forest-300"><SolutionIcon name={o.icon} className="size-5" /></span>
              <span>
                <span className="flex items-center gap-1.5 font-bold text-forest-900">{o.navName}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                <span className="mt-1 block text-sm leading-relaxed">{o.tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const resources = [
  { href: "/data-sources", t: "Where our data comes from", d: "The sources our team collects and enriches data from." },
  { href: "/verification", t: "How we verify data", d: "SMTP checks and 60-day re-verification, explained." },
  { href: "/legal/lawful-use", t: "Lawful use policy", d: "What you agree to when you use a BeigeLeads file." },
  { href: "/legal/refund-replacement", t: "Refund & Returns", d: "What happens if bounced emails exceed 5%." },
];

export function ResourcesPanel() {
  return (
    <Panel id="resources">
      <Title lead="Explore related" accent="resources" />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {resources.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-sand-50 p-5 transition-colors hover:border-forest-900">
              <h3 className="font-bold text-forest-900">{r.t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed">{r.d}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900">Read more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function FaqPanel({ name, items }: { name: string; items: readonly (readonly [string, string])[] }) {
  return (
    <Panel id="faq">
      <Title lead="FAQs about" accent={name} />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-sand-200 bg-sand-50 transition-colors open:border-forest-900 open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-4 text-lg font-semibold text-forest-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 [&::-webkit-details-marker]:hidden">
              {q}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300 transition-transform duration-300 group-open:rotate-45"><Plus className="size-4" aria-hidden /></span>
            </summary>
            <p className="px-6 pb-6 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    </Panel>
  );
}

export function CtaPanel({ heading, text }: { heading: string; text: string }) {
  return (
    <Panel dark>
      <div aria-hidden className="glow-breathe pointer-events-none absolute left-1/2 top-0 h-80 w-[48rem] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.25), transparent)" }} />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="display text-4xl text-sand-50 sm:text-6xl">{heading}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-sand-200">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/sample">Request a free sample</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/lists">Explore databases</Link></Button>
        </div>
        <p className="mt-4 text-sm text-sand-300">One-time payment. No subscription. No account.</p>
      </div>
    </Panel>
  );
}
