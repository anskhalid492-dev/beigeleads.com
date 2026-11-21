import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Globe, Inbox, ListChecks, Mail, PenLine, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { DFY_BEHIND, DFY_OWNERSHIP_POINTS, DFY_SERVICES, DFY_STEPS, DFY_WHO } from "@/lib/dfy/content";
import { range, type DfySettings } from "@/lib/dfy/settings";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const icons: Record<string, LucideIcon> = { domains: Globe, inboxes: Inbox, leads: ListChecks, copy: PenLine, sending: Send, testing: FlaskConical };
const primary = "inline-flex h-12 items-center justify-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const usd0 = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** The pipeline shown in the hero describes the real order of work. The status words are stage names, not measurements. */
const PIPE: [LucideIcon, string, string][] = [
  [Globe, "Secondary domains", "Bought and configured"],
  [Inbox, "Inboxes", "Warmed up step by step"],
  [ListChecks, "Prospects", "Verified before sending"],
  [PenLine, "Copy", "Waiting for your approval"],
  [Send, "Sending", "Managed by our team"],
];

export function DfyHero({ low }: { low: number }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100">
      <div aria-hidden className="dfy-glow pointer-events-none absolute -right-24 -top-24 size-[30rem] rounded-full bg-purple-600/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(rgba(143,208,169,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(143,208,169,0.07) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(70% 80% at 70% 40%, #000, transparent)", WebkitMaskImage: "radial-gradient(70% 80% at 70% 40%, #000, transparent)" }} />
      <div className={`${wrap} relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24`}>
        <div>
          <h1 className="display text-5xl text-sand-50 sm:text-6xl lg:text-7xl">Done-for-you cold email outbound, built and managed for you.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">We buy your secondary domains, set up and warm the inboxes, verify your prospects, write the copy and run the sending. You approve every message. One payment, no subscription.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#packages" className={primary}>Explore DFY packages</a>
            <a href="#how" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50">See how it works</a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sand-200">
            {[`Packages from ${usd0(low)}, one-time`, "No subscription", "You approve every message"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-forest-300" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className="dfy-mail absolute bottom-10 grid size-9 place-items-center rounded-lg border border-sand-50/20 bg-sand-50/10 text-sand-100" style={{ ["--i" as string]: i, left: `${6 + i * 34}%` }}><Mail className="size-4" /></span>)}
          <div className="relative rounded-3xl border border-sand-50/15 bg-forest-700/40 p-5 backdrop-blur">
            <p className="mb-4 text-sm font-semibold text-sand-50">Your outbound, in the order we build it</p>
            <div className="relative">
              <span className="absolute bottom-3 left-[1.4rem] top-3 w-px bg-sand-50/15" />
              <span className="dfy-travel absolute left-[1.4rem] size-2 -translate-x-1/2 rounded-full bg-purple-600 shadow-[0_0_14px_3px_rgba(124,58,237,0.7)]" />
              <ol className="space-y-2.5">
                {PIPE.map(([I, t, d], i) => (
                  <li key={t} className="dfy-row flex items-center gap-3 rounded-2xl border border-sand-50/12 bg-sand-50/[0.04] px-3 py-2.5" style={{ ["--i" as string]: i }}>
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-forest-900 text-forest-300"><I className="size-[1.1rem]" /><span className="dfy-dot absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-forest-900 bg-forest-500" /></span>
                    <span className="min-w-0"><span className="block text-sm font-semibold text-sand-50">{t}</span><span className="dfy-state block text-xs text-sand-200">{d}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 flex items-center gap-2 border-t border-sand-50/10 pt-3 text-xs text-sand-200"><ShieldCheck className="size-4 text-forest-300" />Nothing is sent until you approve the copy.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DfyServices() {
  return (
    <section className="bg-sand-50 py-16 lg:py-20"><div className={wrap}>
      <h2 className={`${h2} max-w-3xl`}>Everything cold email outbound needs, in one service</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DFY_SERVICES.map((s) => { const I = icons[s.id]; return (
          <article key={s.id} className="rounded-3xl border border-sand-300 bg-sand-100 p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-forest-900 text-forest-300"><I className="size-5" aria-hidden /></span>
            <p className="mt-4 text-sm font-semibold text-forest-500">{s.label}</p>
            <h3 className="mt-1 text-lg font-bold text-forest-900">{s.title}</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed">{s.text}</p>
          </article>); })}
      </div>
    </div></section>
  );
}

export function DfyWho() {
  return (
    <section className="bg-sand-100 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>Who done-for-you outbound is for</h2>
      <p className="mt-3 max-w-2xl text-lg">Each use case links to the BeigeLeads solution page with the lists and guidance for it.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DFY_WHO.map((w) => (
          <li key={w.title}>
            <Link href={w.href} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-5 transition-colors hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
              <h3 className="font-bold text-forest-900">{w.title}</h3>
              <p className="mt-1.5 flex-1 text-[0.95rem] leading-relaxed">{w.text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 group-hover:text-purple-700">{w.link} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div></section>
  );
}

export function DfySteps() {
  return (
    <section id="how" className="scroll-mt-24 bg-sand-50 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>How done-for-you outbound works</h2>
      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DFY_STEPS.map(([t, d], i) => <li key={t} className="rounded-3xl border border-sand-300 bg-sand-100 p-6"><span aria-hidden className="display text-4xl text-sand-300">{i + 1}</span><h3 className="mt-2 text-lg font-bold text-forest-900"><span className="sr-only">Step {i + 1}: </span>{t}</h3><p className="mt-2 text-[0.95rem] leading-relaxed">{d}</p></li>)}
      </ol>
    </div></section>
  );
}

type Pkg = DfySettings["packages"][number];
const GROUPS: { title: string; rows: [string, (p: Pkg) => string][] }[] = [
  { title: "Volume", rows: [["Verified leads", (p) => p.leads.toLocaleString("en-US")], ["Initial sends", (p) => p.initialSends.toLocaleString("en-US")], ["Follow-ups", (p) => String(p.followups)]] },
  { title: "Infrastructure (estimates)", rows: [["Sending domains", (p) => range(p.domainsMin, p.domainsMax)], ["Inboxes", (p) => range(p.inboxesMin, p.inboxesMax)]] },
  { title: "Service", rows: [["Reporting", (p) => p.reporting], ["Support", (p) => p.support]] },
];
const INCLUDED = ["Domain purchase and DNS setup", "Inbox setup and warm-up", "Verified prospect sourcing", "Copywriting for your approval", "Managed sending"];

export function DfyCompare({ s }: { s: DfySettings }) {
  const cols = s.packages.length;
  return (
    <section id="compare" className="scroll-mt-24 bg-sand-100 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>Compare DFY outbound packages</h2>
      <p className="mt-3 max-w-2xl text-lg">Every package is a one-time payment and includes the full service. They differ in volume, estimated infrastructure and reporting.</p>
      <div className="mt-8 overflow-x-auto rounded-3xl border border-sand-300 bg-white">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">DFY Outbound packages compared</caption>
          <thead>
            <tr>
              <td className="w-[28%] p-5 align-bottom text-forest-500">One-time price</td>
              {s.packages.map((p) => (
                <th key={p.name} scope="col" className={`p-5 align-bottom ${p.featured ? "bg-forest-900 text-sand-50" : ""}`}>
                  {p.featured && <span className="mb-2 inline-block rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-semibold text-white">Most chosen</span>}
                  <span className="block text-lg font-bold">{p.name}</span>
                  <span className="display mt-1 block text-4xl">{usd0(p.monthlyCents)}</span>
                </th>
              ))}
            </tr>
          </thead>
          {GROUPS.map((g) => (
            <tbody key={g.title}>
              <tr><th colSpan={cols + 1} scope="colgroup" className="bg-sand-100 px-5 py-2 text-left text-sm font-semibold text-forest-700">{g.title}</th></tr>
              {g.rows.map(([label, f]) => (
                <tr key={label} className="border-t border-sand-200">
                  <th scope="row" className="p-4 pl-5 font-medium">{label}</th>
                  {s.packages.map((p) => <td key={p.name} className={`p-4 font-semibold capitalize text-forest-900 ${p.featured ? "bg-forest-900/[0.05]" : ""}`}>{f(p)}</td>)}
                </tr>
              ))}
            </tbody>
          ))}
          <tbody>
            <tr><th colSpan={cols + 1} scope="colgroup" className="bg-sand-100 px-5 py-2 text-left text-sm font-semibold text-forest-700">Included in every package</th></tr>
            {INCLUDED.map((label) => (
              <tr key={label} className="border-t border-sand-200">
                <th scope="row" className="p-4 pl-5 font-medium">{label}</th>
                {s.packages.map((p) => <td key={p.name} className={`p-4 ${p.featured ? "bg-forest-900/[0.05]" : ""}`}><Check className="size-4 text-forest-500" aria-label="Included" /></td>)}
              </tr>
            ))}
            {s.ownershipEnabled && (
              <tr className="border-t border-sand-200">
                <th scope="row" className="p-4 pl-5 font-medium">Own your infrastructure</th>
                {s.packages.map((p) => <td key={p.name} className={`p-4 text-forest-900 ${p.featured ? "bg-forest-900/[0.05]" : ""}`}>Optional, +{usd0(s.ownershipCents)} one-time</td>)}
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-sand-200">
              <td className="p-5" />
              {s.packages.map((p) => <td key={p.name} className={`p-5 ${p.featured ? "bg-forest-900/[0.05]" : ""}`}><a href="#packages" className={`${primary} h-11 px-5 text-sm`}>Choose {p.name}</a></td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-sm">Domain and inbox numbers are estimates. We confirm your allocation after onboarding and never reduce it silently.</p>
    </div></section>
  );
}

export function DfyOwnership({ s }: { s: DfySettings }) {
  if (!s.ownershipEnabled) return null;
  return (
    <section className="bg-sand-50 py-16 lg:py-20"><div className={`${wrap} grid gap-8 lg:grid-cols-2`}>
      <div><h2 className={h2}>Own your outbound infrastructure, if you want to</h2><p className="mt-4 text-lg">{s.ownershipDescription}</p></div>
      <ul className="space-y-3">{DFY_OWNERSHIP_POINTS.map((t) => <li key={t} className="flex gap-2 rounded-2xl bg-sand-100 p-4 text-[0.95rem]"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{t}</li>)}</ul>
    </div></section>
  );
}

export function DfyDetails() {
  return (
    <section className="bg-sand-100 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>What happens behind the scenes</h2>
      <p className="mt-3 max-w-2xl text-lg">Six parts of the work, each with what you can expect from it.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DFY_BEHIND.map((it) => (
          <article key={it.id} className="flex flex-col rounded-3xl border border-sand-200 bg-white p-6">
            <h3 className="text-lg font-bold text-forest-900">{it.title}</h3>
            <p className="mt-1 text-sm font-medium text-forest-500">{it.lead}</p>
            <ul className="mt-4 space-y-2.5 border-t border-sand-200 pt-4 text-[0.95rem]">{it.points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{p}</li>)}</ul>
          </article>
        ))}
      </div>
    </div></section>
  );
}

export function DfyFinalCta({ low }: { low: number }) {
  return (
    <section className="bg-sand-50 py-16 lg:py-20"><div className={wrap}>
      <div className="relative overflow-hidden rounded-[2rem] bg-forest-900 px-6 py-14 text-center text-sand-100 sm:px-12">
        <div aria-hidden className="dfy-glow pointer-events-none absolute -left-20 -top-24 size-96 rounded-full bg-purple-600/25 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="display text-4xl text-sand-50 sm:text-5xl">Hand off your cold email outbound.</h2>
          <p className="mt-4 text-lg text-sand-200">Pick a package, pay once and tell us about your business. We plan, build and run it, and you approve every message.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#packages" className={primary}>Get started from {usd0(low)}</a>
            <Link href="/custom-list" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50">Need something custom?</Link>
          </div>
          <p className="mt-5 text-sm text-sand-200">One-time payment in crypto. No subscription, nothing renews.</p>
        </div>
      </div>
    </div></section>
  );
}
