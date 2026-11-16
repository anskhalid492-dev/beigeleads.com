import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SolutionIcon } from "@/components/solutions/icons";
import { SolutionCta, RecommendedDatabases, SolutionFaq, wrap } from "@/components/solutions/sections";
import { solutions } from "@/lib/solutions";

export const metadata: Metadata = {
  title: "Solutions: business databases for every growth goal",
  description:
    "Find the right BeigeLeads database for lead generation, cold email, sales prospecting, agencies, research, local marketing and more. Pay once, sample first.",
  alternates: { canonical: "/solutions" },
};

const faq = [
  ["What is a BeigeLeads solution?", "A guide to using our business databases for one goal, such as cold email or sales prospecting. Each solution page explains the problem, the databases that help, how to use them and what to watch out for."],
  ["Do I have to buy a solution?", "No. Solutions are guides, not products. You buy a database, and the solution page helps you pick the right one."],
  ["Which databases are available today?", "Dentists, restaurants and ski shops in the United States. More industries and countries are added list by list, and you can request one."],
  ["Is there a subscription?", "No. You pay once in crypto and keep the file. There is no account."],
  ["Can I see the data before I pay?", "Yes. Every database page shows a masked sample, and you can request a free sample by email."],
] as const;

const trust = [
  { icon: EyeOff, t: "Masked sample first", d: "See real columns before you pay." },
  { icon: CalendarCheck2, t: "Re-verified every 60 days", d: "A last-verified date sits on every list." },
  { icon: ShieldCheck, t: "Opt-outs honoured", d: "People who ask to be removed are left out of delivered files." },
  { icon: Wallet, t: "Pay once", d: "No subscription, no account." },
] as const;

export default function SolutionsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest-900 text-sand-100">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 60% at 85% 0%, rgba(143,208,169,0.22), transparent 70%)" }} />
        <div className="relative">
          <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
            <Breadcrumbs wide="xl" items={[{ name: "Solutions", href: "/solutions" }]} />
          </div>
          <div className={`${wrap} pb-24 pt-12 lg:pb-32 lg:pt-20`}>
            <h1 className="display max-w-6xl text-6xl text-sand-50 sm:text-7xl xl:text-[7.5rem] xl:leading-[0.92]">Start with the goal. We will point you to the list.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed">
              Twelve ways businesses use BeigeLeads databases, from filling a sales pipeline to entering a new market. Pick the one that sounds like your job and see which lists fit.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#all-solutions">Find your solution</a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/sample">Get a free sample</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="all-solutions" className={`${wrap} scroll-mt-20 py-24 lg:py-32`}>
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">All solutions</h2>
        <ul className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((s) => (
            <li key={s.slug}>
              <Link href={`/solutions/${s.slug}`} className="group flex h-full flex-col rounded-[1.75rem] border border-sand-300 bg-sand-50 p-8 transition-all hover:-translate-y-1 hover:border-forest-900 hover:shadow-[0_24px_50px_-28px_rgba(15,42,29,0.6)]">
                <span className="grid size-12 place-items-center rounded-2xl bg-forest-900">
                  <SolutionIcon name={s.icon} className="size-6 text-forest-300" />
                </span>
                <h3 className="display mt-5 text-3xl text-forest-900">{s.name}</h3>
                <p className="mt-2 flex-1">{s.tagline}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-900">
                  Explore solution <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-sand-200 bg-sand-100">
        <ul className={`${wrap} grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4`}>
          {trust.map((t) => (
            <li key={t.t} className="flex gap-4">
              <t.icon className="mt-1 size-6 shrink-0 text-forest-500" aria-hidden />
              <div>
                <p className="font-bold text-forest-900">{t.t}</p>
                <p className="mt-1 text-sm">{t.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <RecommendedDatabases
        s={{ ...solutions[0], productNote: "These lists are available now and work for most of the solutions above." }}
      />

      <SolutionFaq name="BeigeLeads Solutions" items={faq} />
      <SolutionCta heading="Not sure which solution fits?" text="Request a free sample and tell us what you are trying to achieve. We will point you to the right list." />
    </>
  );
}
