import Link from "next/link";
import { Check, Globe, Inbox, ListChecks, PenLine, Send, FlaskConical, type LucideIcon } from "lucide-react";
import { DFY_COMPARE, DFY_OWNERSHIP_POINTS, DFY_SECTIONS, DFY_SERVICES, DFY_STEPS, DFY_WHO } from "@/lib/dfy/content";
import { range, type DfySettings } from "@/lib/dfy/settings";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const icons: Record<string, LucideIcon> = { domains: Globe, inboxes: Inbox, leads: ListChecks, copy: PenLine, sending: Send, testing: FlaskConical };
const primary = "inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function DfyHero({ from }: { from: string }) {
  return (
    <section className="bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(48rem 24rem at 100% 0%, rgba(45,106,79,0.45), transparent 70%)" }}>
      <div className={`${wrap} py-20 lg:py-28`}>
        <p className="text-sm font-semibold text-forest-300">DONE-FOR-YOU OUTBOUND</p>
        <h1 className="display mt-4 max-w-4xl text-5xl text-sand-50 sm:text-7xl">Your Entire Outbound Engine. Built &amp; Managed for You.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand-200">Domains, inboxes, verified prospects, copy and managed sending, handled by our team.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#packages" className={primary}>Explore DFY Packages</a>
          <a href="#how" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50">See How It Works</a>
        </div>
        <p className="mt-6 text-sm text-sand-200">{from}</p>
      </div>
    </section>
  );
}

export function DfyServices() {
  return (
    <section className="bg-sand-50 py-16 lg:py-20"><div className={wrap}>
      <h2 className={`${h2} max-w-3xl`}>Everything outbound needs, in one service</h2>
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
      <h2 className={h2}>Who it&rsquo;s for</h2>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">{DFY_WHO.map(([t, d]) => <div key={t} className="rounded-2xl bg-white p-5"><dt className="font-bold text-forest-900">{t}</dt><dd className="mt-1 text-[0.95rem]">{d}</dd></div>)}</dl>
    </div></section>
  );
}

export function DfySteps() {
  return (
    <section id="how" className="scroll-mt-24 bg-sand-50 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>How DFY works</h2>
      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DFY_STEPS.map(([t, d], i) => <li key={t} className="rounded-3xl border border-sand-300 bg-sand-100 p-6"><span aria-hidden className="display text-4xl text-sand-300">{i + 1}</span><h3 className="mt-2 text-lg font-bold text-forest-900"><span className="sr-only">Step {i + 1}: </span>{t}</h3><p className="mt-2 text-[0.95rem] leading-relaxed">{d}</p></li>)}
      </ol>
    </div></section>
  );
}

export function DfyCompare({ s }: { s: DfySettings }) {
  const val = (p: DfySettings["packages"][number], k: string) => k === "leads" ? p.leads.toLocaleString("en-US") : k === "initialSends" ? p.initialSends.toLocaleString("en-US") : k === "followups" ? String(p.followups) : k === "domains" ? range(p.domainsMin, p.domainsMax) : k === "inboxes" ? range(p.inboxesMin, p.inboxesMax) : k === "reporting" ? p.reporting : p.support;
  return (
    <section className="bg-sand-100 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>Compare packages</h2>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-sand-300 bg-white">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead><tr className="border-b border-sand-200"><th className="p-4" scope="col"><span className="sr-only">Feature</span></th>{s.packages.map((p) => <th key={p.name} scope="col" className="p-4 font-bold text-forest-900">{p.name}</th>)}</tr></thead>
          <tbody>
            <tr className="border-b border-sand-200"><th scope="row" className="p-4 font-medium">Monthly price</th>{s.packages.map((p) => <td key={p.name} className="p-4 font-semibold text-forest-900">${(p.monthlyCents / 100).toLocaleString("en-US")}</td>)}</tr>
            {DFY_COMPARE.map(([label, k]) => <tr key={k} className="border-b border-sand-200 last:border-0"><th scope="row" className="p-4 font-medium">{label}{(k === "domains" || k === "inboxes") && " (estimate)"}</th>{s.packages.map((p) => <td key={p.name} className="p-4 capitalize">{val(p, k)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div></section>
  );
}

export function DfyOwnership({ s }: { s: DfySettings }) {
  if (!s.ownershipEnabled) return null;
  return (
    <section className="bg-sand-50 py-16 lg:py-20"><div className={`${wrap} grid gap-8 lg:grid-cols-2`}>
      <div><h2 className={h2}>Own your infrastructure, if you want to</h2><p className="mt-4 text-lg">{s.ownershipDescription}</p></div>
      <ul className="space-y-3">{DFY_OWNERSHIP_POINTS.map((t) => <li key={t} className="flex gap-2 rounded-2xl bg-sand-100 p-4 text-[0.95rem]"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{t}</li>)}</ul>
    </div></section>
  );
}

export function DfyDetails() {
  const items = [DFY_SECTIONS.infra, DFY_SECTIONS.sourcing, DFY_SECTIONS.copy, DFY_SECTIONS.sending, DFY_SECTIONS.testing, DFY_SECTIONS.reporting, DFY_SECTIONS.approval];
  return (
    <section className="bg-sand-100 py-16 lg:py-20"><div className={wrap}>
      <h2 className={h2}>What happens behind the scenes</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.map((it) => <article key={it.title} className="rounded-3xl bg-white p-6"><h3 className="text-lg font-bold text-forest-900">{it.title}</h3><ul className="mt-3 space-y-2 text-[0.95rem]">{it.points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{p}</li>)}</ul></article>)}
      </div>
    </div></section>
  );
}

export function DfyFinalCta() {
  return (
    <section className="bg-forest-900 py-16 text-center text-sand-100 lg:py-20"><div className={wrap}>
      <h2 className="display text-4xl text-sand-50 sm:text-5xl">Ready to hand off your outbound?</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="#packages" className={primary}>Explore DFY Packages</a><Link href="/custom-list" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 hover:border-sand-50">Need something custom?</Link></div>
    </div></section>
  );
}
