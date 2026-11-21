import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { Layers } from "lucide-react";
import { SolutionIcon } from "@/components/solutions/icons";
import { HeroShell, SolutionCta, RecommendedDatabases, SolutionFaq, wrap } from "@/components/solutions/sections";
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
  ["Which databases are available?", "Browse the lists page for what you can buy now. Not there? Request a custom list or a new category and we will say honestly whether we can build it."],
  ["Is there a subscription?", "No. You pay once in crypto and keep the file. There is no account."],
  ["Can I see the data before I pay?", "Yes. Every database page shows a masked sample, and you can request a free sample by email."],
] as const;

const trust = [
  { icon: EyeOff, t: "Masked sample on every list page", d: "See real columns before you pay." },
  { icon: CalendarCheck2, t: "Re-verified every 90 days", d: "A last-verified date sits on every list." },
  { icon: ShieldCheck, t: "Opt-outs honoured", d: "People who ask to be removed are left out of delivered files." },
  { icon: Wallet, t: "Pay once", d: "No subscription, no account." },
] as const;

export default function SolutionsPage() {
  return (
    <>
      <HeroShell
        crumbs={[{ name: "Solutions", href: "/solutions" }]}
        h1="Start with the goal. We will point you to the list."
        lede="Twelve ways businesses use BeigeLeads databases, from filling a sales pipeline to entering a new city. Pick the one that sounds like your job and see which lists fit."
        primary={{ label: "Find your solution", href: "#all-solutions" }}
        secondary={{ label: "Get a free sample", href: "/sample" }}
        flow={["Pick your goal", "See the lists", "Check the sample", "Download the file"]}
        chips={[
          { label: "Dentists", category: "dentists", country: "US" },
          { label: "Restaurants", category: "restaurants", country: "US" },
          { label: "Ski shops", category: "ski-shops", country: "US" },
          { label: "Pay once" },
          { label: "Masked sample on every list page" },
        ]}
        icon={<Layers className="size-8" aria-hidden />}
      />

      <section id="all-solutions" className="scroll-mt-20 bg-sand-50 py-20 lg:py-24">
        <div className={wrap}>
          <h2 className="display mx-auto max-w-3xl text-center text-4xl text-forest-900 sm:text-5xl">All solutions</h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((s) => (
              <li key={s.slug}>
                <Link href={`/solutions/${s.slug}`} className="group flex h-full flex-col rounded-3xl border border-sand-300 bg-sand-100 p-7 transition-all hover:-translate-y-1 hover:border-forest-900 hover:shadow-[0_24px_50px_-28px_rgba(15,42,29,0.6)]">
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
        </div>
      </section>

      <section className="border-y border-sand-200 bg-sand-100">
        <ul className={`${wrap} grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
          {trust.map((t) => (
            <li key={t.t} className="flex flex-col items-center text-center">
              <t.icon className="size-7 text-forest-500" aria-hidden />
              <p className="mt-3 font-bold text-forest-900">{t.t}</p>
              <p className="mt-1 text-sm">{t.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <RecommendedDatabases
        s={{ ...solutions[0], productNote: "These lists are available now and work for most of the solutions above." }}
        heading="Featured databases"
      />

      <SolutionFaq name="BeigeLeads Solutions" items={faq} />
      <SolutionCta heading="Not sure which solution fits?" text="Request a free sample and tell us what you are trying to achieve. We will point you to the right list." />
    </>
  );
}
