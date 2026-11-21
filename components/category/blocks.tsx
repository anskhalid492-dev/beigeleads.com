import Link from "next/link";
import { BadgeCheck, Briefcase, Check, Megaphone, Search, ShieldCheck, Target, Users } from "lucide-react";
import { h2, wrap } from "@/components/category/parts";

export function SalesHero({ eyebrow, h1, sub, primary, secondary, points, children, tone = "sand" }: { eyebrow: string; h1: string; sub: string; primary: { label: string; href: string }; secondary: { label: string; href: string }; points: string[]; children: React.ReactNode; tone?: "sand" | "forest" }) {
  const dark = tone === "forest";
  return (
    <section className={`${wrap} pb-4 pt-2`}>
      <div className={`grid items-center gap-8 overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-12 lg:p-12 ${dark ? "bg-forest-900 text-sand-100" : "border border-sand-300 bg-sand-100"}`}>
        <div>
          <p className={`text-sm font-bold ${dark ? "text-forest-300" : "text-forest-500"}`}>{eyebrow}</p>
          <h1 className={`display cat-in mt-3 text-[2.9rem] leading-[0.95] sm:text-[4.2rem] ${dark ? "text-sand-50" : "text-forest-900"}`}>{h1}</h1>
          <p className={`mt-4 max-w-[52ch] text-lg ${dark ? "text-sand-200" : ""}`}>{sub}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={primary.href} className="inline-flex h-12 items-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{primary.label}</Link>
            <Link href={secondary.href} className={`inline-flex h-12 items-center rounded-full border px-6 font-semibold ${dark ? "border-sand-300/50 text-sand-50 hover:bg-forest-700" : "border-forest-900 text-forest-900 hover:bg-forest-900 hover:text-sand-50"}`}>{secondary.label}</Link>
          </div>
          <ul className="mt-6 space-y-2">{points.map((x) => <li key={x} className={`flex items-center gap-2.5 font-semibold ${dark ? "text-sand-50" : "text-forest-900"}`}><span className={`grid size-5 place-items-center rounded-full ${dark ? "bg-forest-500" : "bg-forest-100"}`}><Check className="size-3" aria-hidden /></span>{x}</li>)}</ul>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Block({ title, lead, children, tone }: { title: string; lead?: string; children: React.ReactNode; tone?: "sand" }) {
  return (
    <section className={tone === "sand" ? "border-y border-sand-200 bg-sand-100 py-12 sm:py-14" : "py-12 sm:py-14"}>
      <div className={wrap}>{title && <h2 className={h2}>{title}</h2>}{title && lead && <p className="mt-3 max-w-[60ch]">{lead}</p>}<div className={title ? "mt-8" : ""}>{children}</div></div>
    </section>
  );
}

/** Prospect rows: who, and how they would use the data. A ruled grid, not cards. */
export function UseCases({ items }: { items: readonly (readonly [string, string])[] }) {
  return <ul className="grid border-t border-sand-300 md:grid-cols-2 md:gap-x-12">{items.map(([a, b]) => <li key={a} className="border-b border-sand-300 py-5"><p className="display text-2xl text-forest-900">{a}</p><p className="mt-1">{b}</p></li>)}</ul>;
}


const USE_ICONS = [Users, Megaphone, Target, Briefcase, Search];
const iconFor = (name: string, i: number) => {
  const n = name.toLowerCase();
  if (/agenc|market|advert|seo/.test(n)) return Megaphone;
  if (/recruit|hiring|staff/.test(n)) return Search;
  if (/sales|sdr|outbound|business develop/.test(n)) return Target;
  if (/founder|owner|start/.test(n)) return Briefcase;
  return USE_ICONS[i % USE_ICONS.length];
};

/** "About" and "Who uses it" as ONE section: story on the left, the people who use the data on the right. */
export function AboutUses({ title, usesTitle, paragraphs, uses }: { title: string; usesTitle: string; paragraphs: readonly string[]; uses: readonly (readonly [string, string])[] }) {
  const [lead, ...rest] = paragraphs;
  return (
    <section className="py-12 sm:py-14">
      <div className={wrap}>
        <div className="grid gap-10 overflow-hidden rounded-[2rem] border border-sand-300 bg-sand-100 p-6 sm:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:p-12">
          <div>
            <h2 className={h2}>{title}</h2>
            {lead && <p className="mt-5 text-xl leading-snug text-forest-900">{lead}</p>}
            {rest.length > 0 && <div className="mt-4 space-y-3 leading-relaxed">{rest.map((x, i) => <p key={i}>{x}</p>)}</div>}
            <ul className="mt-6 flex flex-wrap gap-2">
              {["Pay once, no subscription", "5% replacement promise", "Masked sample first"].map((t, i) => (
                <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900">{i === 0 ? <ShieldCheck className="size-4 text-forest-500" aria-hidden /> : <BadgeCheck className="size-4 text-forest-500" aria-hidden />}{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="display text-2xl text-forest-900 sm:text-3xl">{usesTitle}</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {uses.map(([a, b], i) => { const Icon = iconFor(a, i); return (
                <li key={a} className="group rounded-2xl border border-sand-300 bg-white p-5 transition-colors hover:border-forest-900">
                  <span className="grid size-10 place-items-center rounded-xl bg-forest-100 text-forest-700 transition-colors group-hover:bg-forest-900 group-hover:text-sand-50"><Icon className="size-5" aria-hidden /></span>
                  <p className="display mt-4 text-xl text-forest-900">{a}</p>
                  <p className="mt-1 text-sm leading-relaxed">{b}</p>
                </li>
              ); })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Steps } from "@/components/category/steps";

export function Why({ items }: { items: readonly (readonly [string, string])[] }) {
  return <ul className="grid gap-x-12 gap-y-6 md:grid-cols-2">{items.map(([a, b]) => <li key={a} className="flex gap-3"><span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300"><Check className="size-3.5" aria-hidden /></span><div><p className="font-bold text-forest-900">{a}</p><p className="mt-0.5">{b}</p></div></li>)}</ul>;
}

export const WHY_BEIGE: [string, string][] = [
  ["Pay once, no subscription", "One purchase per list. No seats, credits or monthly fees."],
  ["Masked sample first", "Every ready-made list page shows a masked sample, and you can request a free sample by email."],
  ["Checked, then re-checked", "Emails are checked with in-house SMTP tests and every list is re-verified every 60 days."],
  ["Replacement policy", "If more than 5% of emails bounce, we replace them or refund proportionally. See the refund policy."],
  ["Targeted selection", "Choose by industry and place instead of buying one giant file."],
  ["Custom sourcing", "Need something we do not list? Send a request and we tell you what we can source."],
];

export function FinalCta({ title, text, cta, secondary }: { title: string; text: string; cta: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <section className="py-12 sm:py-14"><div className={wrap}>
      <div className="rounded-[2rem] bg-forest-900 p-8 text-center text-sand-100 sm:p-12">
        <h2 className="display text-[2.3rem] leading-tight text-sand-50 sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-[50ch] text-sand-200">{text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={cta.href} className="inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">{cta.label}</Link>
          {secondary && <Link href={secondary.href} className="inline-flex h-12 items-center rounded-full border border-sand-300/50 px-7 font-semibold text-sand-50 hover:bg-forest-700">{secondary.label}</Link>}
        </div>
      </div>
    </div></section>
  );
}
