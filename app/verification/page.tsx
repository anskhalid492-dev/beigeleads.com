import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CalendarClock, Copy, Eraser, EyeOff, Layers, MailCheck, MapPin, Network, Scale, ShieldCheck, Sparkles, Tags, Trash2, Wand2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { Button } from "@/components/ui/button";
import { SolutionCta, SolutionFaq, wrap } from "@/components/solutions/sections";
import { EmailFlow } from "@/components/verification/email-flow";
import { HeroVisual } from "@/components/verification/hero-visual";
import { ProcessTimeline } from "@/components/verification/process-timeline";
import { VerifyRing } from "@/components/data-sources/verify-ring";
import { LEGAL_UPDATED, formatLegalDate } from "@/lib/legal/docs";

// Every statement comes from the owner's description of the operation (CLAUDE.md section 21) or
// from the site's own policies. No statistics, certifications, partnerships or guarantees are invented.
export const metadata: Metadata = {
  title: "How We Source & Verify Business Data",
  description:
    "Discover how BeigeLeads sources, researches and checks business data. Learn about our data quality process, email verification and responsible data practices.",
  alternates: { canonical: "/verification" },
};

const h2 = "display text-4xl text-forest-900 sm:text-5xl lg:text-6xl";
const h2Dark = "display text-4xl text-sand-50 sm:text-5xl lg:text-6xl";
const link = "font-semibold underline underline-offset-4";

const sources = [
  ["Public business listings and maps", "Public profiles such as map listings: business name, address, phone and other details a business shows publicly."],
  ["Company websites", "Contact pages, team pages and footers that the business publishes itself."],
  ["Public government registries", "Business and licence registers that are open to the public."],
  ["Business directories", "Trade and local directories that publish business contact details."],
  ["Licensed provider data", "Data we buy or license from providers. It goes through the same checks as everything else."],
  ["Public professional profiles and social handles", "Profile pages and handles that a business or professional shows publicly."],
  ["Surveys", "Information businesses give us directly when we ask."],
  ["Our own research", "Manual research by our team to fill gaps that no automated source covers."],
] as const;

const quality = [
  { icon: MailCheck, t: "Email validity", means: "Whether the recipient's mail server accepts the address.", why: "Dead addresses bounce, waste sends and hurt your sending reputation. We run SMTP checks in-house.", limit: "Some servers accept everything, so a small share can still bounce." },
  { icon: Copy, t: "Duplicate records", means: "The same business appearing more than once.", why: "Duplicates mean double calls, double emails and inflated counts. We remove them so one business appears once.", limit: "Businesses listed under very different names can slip through." },
  { icon: Wand2, t: "Business information consistency", means: "Name, address, phone and website agreeing with each other.", why: "A record that contradicts itself is hard to trust or to match against your CRM.", limit: "Sources can disagree, and we cannot confirm every record by phone." },
  { icon: Layers, t: "Formatting and standardization", means: "Phone numbers, addresses and names written one consistent way.", why: "Clean formats sort, filter and import properly in a CRM or spreadsheet.", limit: "Formats follow the source; unusual entries may remain." },
  { icon: Eraser, t: "Missing information", means: "Empty fields such as a phone number, website or email.", why: "A gap limits how you can reach a business. Our team fills missing basics and looks for emails and owners.", limit: "Not every business publishes every detail, so some fields stay empty." },
  { icon: CalendarClock, t: "Outdated information", means: "Details that were right once and have since changed.", why: "Businesses move, close and change numbers. We re-verify all data every 60 days.", limit: "Changes between checks can still go unnoticed for a while." },
  { icon: Tags, t: "Industry classification", means: "Tagging each record with its category.", why: "You buy a dentist list or a restaurant list, not a mix, so the tag decides what you receive.", limit: "A business that fits two categories sits in one list." },
  { icon: MapPin, t: "Geographic accuracy", means: "Tagging each record with its country and city.", why: "Local campaigns and territories depend on the right place.", limit: "Addresses follow what the source publishes." },
] as const;

const statuses = [
  ["Accepted", "The server says it accepts the address. This is what we keep."],
  ["Rejected", "The server says the address does not exist. We correct it or drop it."],
  ["Accepts everything", "The server accepts any address, so it cannot be confirmed. A small share of these can still bounce."],
  ["No answer", "The server did not respond. We cannot confirm it, so it is not treated as verified."],
] as const;

const fields = [
  ["Business name", "Identify the business and match it to accounts in your CRM."],
  ["Website", "Research what a business does before you write to it."],
  ["Email", "Business email address, checked by our team, for outreach."],
  ["Phone", "A second channel for follow-up calls."],
  ["Address", "Plan routes, mailers and territories."],
  ["City", "Segment campaigns and compare places."],
  ["Country", "Keep campaigns inside the regions you may lawfully contact."],
] as const;

const compliance = [
  ["GDPR", "/legal/gdpr", "How we treat personal data under EU and UK law. We do not currently sell EU or UK lists."],
  ["CCPA and CPRA", "/legal/ccpa", "Rights for California residents, including opt-out of sale."],
  ["CAN-SPAM", "/legal/can-spam", "US rules for commercial email, such as a working unsubscribe."],
  ["CASL", "/legal/casl", "Canada's anti-spam law. We do not currently sell Canadian contacts."],
  ["Lawful use policy", "/legal/lawful-use", "What buyers agree to: no spam, fraud, harassment or unlawful processing."],
  ["Opt-out and removal", "/opt-out", "Anyone can ask to be removed. Removed contacts are left out of every file we generate afterwards."],
] as const;

const dbCards = [
  { name: "Country databases", text: "Lists organised by country. Today the United States is live.", href: "/lists", badge: <Flag code="US" className="h-9 w-[54px]" /> },
  { name: "Industry databases", text: "Dentists and other industries, with more added list by list.", href: "/lists/dentists", badge: <DbBadge category="dentists" size="lg" /> },
  { name: "Local business databases", text: "Restaurants, cafes and bars, sorted by city.", href: "/lists/restaurants", badge: <DbBadge category="restaurants" size="lg" /> },
  { name: "E-commerce and retail databases", text: "Ski shops today, with other retail niches on request.", href: "/lists/ski-shops", badge: <DbBadge category="ski-shops" size="lg" /> },
  { name: "Professional databases", text: "Yes, we build professional databases. Tell us the profession and region you need and we will quote it.", href: "/request-category", badge: <DbBadge category="finance" size="lg" /> },
  { name: "Creator databases", text: "Yes, we build creator databases. Request the platform and niche you need and we will quote it.", href: "/request-category", badge: <DbBadge category="technology" size="lg" /> },
] as const;

const faq = [
  ["Where does BeigeLeads get its business data?", "From public business listings and maps, company websites, public government registries, business directories, licensed data providers, public professional profiles and social handles, surveys, and our own research. Every record then goes through the same cleaning and checking steps. The data sources page describes each type in more detail."],
  ["How does BeigeLeads collect business information?", "We use a mix of automated collection from public pages, licensed data, surveys and manual research by our team. Raw records are then cleaned, completed and checked before they join a list. Collection is only the first step, because a raw record is just a name and a place until it has been organised and verified."],
  ["How does BeigeLeads check email addresses?", "Our in-house team runs SMTP checks. That means asking the recipient's mail server whether it accepts the address, without sending a message to the person. Addresses that fail are corrected or dropped. Some mail servers accept every address, so no check is perfect and a small share can still bounce."],
  ["How often is business data updated?", "All data is re-verified every 60 days. Each list page shows the date it was last verified, so you can see how fresh a list is before you buy. Businesses can change between checks, so we recommend looking at that date and requesting a sample first."],
  ["Does email verification guarantee email delivery?", "No. Verification shows that a mail server accepted the address when we checked. Whether a message reaches an inbox also depends on your sending domain, your content and how recipients react. We do not promise delivery, but we do stand behind bounce rates: above 5%, we replace bounced emails under our Refund & Returns policy."],
  ["How does BeigeLeads handle duplicate records?", "During data organisation we standardise names, addresses and phone formats, then remove duplicates so one business appears once. Standardising first makes matching more reliable. A business listed under very different names in different sources can still slip through, so a quick duplicate check against your own CRM is worthwhile."],
  ["What information is included in your databases?", "Each list has seven fields: business name, address, city, country, phone, email and website. Every product page shows the exact fields and a masked sample. Our research can find extra details, but they are not part of the current lists. Ask through the custom list page if you need more."],
  ["Can I request a sample before purchasing?", "Yes. Every product page shows a masked sample, and you can request a free sample by email. The sample hides working contact details but shows the real columns, so you can judge the structure and fit of a list before you pay."],
  ["How can I request the removal of my information?", "Use the opt-out page. Your request is stored as a hashed record and applied to every file we generate afterwards. Contacts who unsubscribe from a customer's campaign must also be removed by that customer, who keeps their own suppression list."],
  ["Can I use purchased business data for cold email marketing?", "It depends on your country and your message. Rules such as CAN-SPAM, CASL and GDPR differ, and some places require consent first. We are not a law firm, and a purchased list is not a permission slip. You stay responsible for lawful use. Read our lawful use policy and compliance pages before you send."],
] as const;

export default function VerificationPage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-forest-900 text-sand-100">
        <div aria-hidden className="grid-drift pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(143,208,169,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(143,208,169,0.07) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(70% 80% at 70% 40%, #000, transparent)", WebkitMaskImage: "radial-gradient(70% 80% at 70% 40%, #000, transparent)" }} />
        <div aria-hidden className="glow-breathe pointer-events-none absolute -right-40 top-0 size-[40rem] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.25), transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 size-[28rem] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.22), transparent)" }} />
        <div className="relative">
          <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
            <Breadcrumbs wide items={[{ name: "Data verification", href: "/verification" }]} />
          </div>
          <div className={`${wrap} grid gap-12 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-14`}>
            <div>
              <h1 className="display text-5xl text-sand-50 sm:text-6xl xl:text-7xl xl:leading-[0.95]">Good Data Starts With Knowing Where It Comes From.</h1>
              <p className="rise mt-7 max-w-xl text-lg leading-relaxed sm:text-xl" style={{ animationDelay: "300ms" }}>
                Discover how BeigeLeads researches, collects, organizes and verifies business information to help companies find the right contacts, explore new markets and build better prospect lists.
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "450ms" }}>
                <Button asChild size="lg"><Link href="/sample">Request a free sample</Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/data-sources">See where data comes from</Link></Button>
              </div>
              <ul className="rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: "600ms" }}>
                {["In-house SMTP checks", "Re-verified every 60 days", "Masked sample on every list page"].map((t) => (
                  <li key={t} className="rounded-full border border-forest-300/40 px-3 py-1 text-sm text-forest-100">{t}</li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-semibold text-forest-300">
                Last updated <time dateTime={LEGAL_UPDATED}>{formatLegalDate(LEGAL_UPDATED)}</time>
              </p>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* 2. Philosophy */}
      <section className="bg-sand-50 py-20 lg:py-28">
        <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <div className="reveal">
            <h2 className={h2}>Where a record comes from decides how far you can trust it.</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed">
              <p>A source tells you how fresh a record is, who published it and why. A business that publishes its own phone number on its own website is a stronger source than a number copied three times between directories.</p>
              <p>Collecting information is the easy part. A pile of raw records has duplicates, gaps and formats that do not match. The work that makes a list useful is organising it and checking it, and then checking it again later.</p>
              <p>We also think you should know the limits. A business database is a snapshot of public information. It is never complete, and it is never perfectly current. This page explains what we do, and what we cannot promise.</p>
            </div>
          </div>
          <ol className="reveal space-y-3">
            {[
              [Network, "Collect", "Gather records from public and licensed sources."],
              [Layers, "Organize", "Clean, complete and de-duplicate."],
              [ShieldCheck, "Check", "Run SMTP checks and quality checks."],
              [CalendarClock, "Maintain", "Re-verify all data every 60 days."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Network;
              return (
                <li key={t as string} className="flex items-center gap-5 rounded-3xl border border-sand-300 bg-sand-100 p-5 transition-transform hover:-translate-y-0.5" style={{ marginLeft: `${i * 1.25}rem` }}>
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><I className="size-6" aria-hidden /></span>
                  <div>
                    <h3 className="display text-2xl text-forest-900">{t as string}</h3>
                    <p>{d as string}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 3. Sources */}
      <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-28">
        <div className={`${wrap} grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}>
          <div className="reveal lg:sticky lg:top-24 lg:self-start">
            <h2 className={h2}>Where does our data come from?</h2>
            <p className="mt-5 text-lg">Eight types of source, all described by our team and listed here exactly as we use them. We do not claim exclusive providers, partnerships or special permissions.</p>
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/data-sources">Read the full data sources page <ArrowRight className="size-4" aria-hidden /></Link>
            </Button>
          </div>
          <ul className="divide-y divide-sand-300 border-y border-sand-300">
            {sources.map(([t, d]) => (
              <li key={t} className="reveal group grid gap-1 py-5 sm:grid-cols-[1fr_1.4fr] sm:gap-8">
                <h3 className="display text-2xl text-forest-900 transition-transform duration-300 group-hover:translate-x-1.5">{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Process */}
      <section className="bg-forest-900 py-20 text-sand-100 lg:py-28">
        <div className={wrap}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={h2Dark}>Our data research process</h2>
            <p className="mt-4 text-lg">Eight stages, from choosing a category to putting a file in your hands.</p>
          </div>
          <div className="mt-14">
            <ProcessTimeline />
          </div>
        </div>
      </section>

      {/* 5. Quality */}
      <section className="bg-sand-50 py-20 lg:py-28">
        <div className={wrap}>
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className={h2}>How we approach data quality</h2>
            <p className="mt-4 text-lg">Eight things we look at, what each one means, and where it stops. We do not claim that every record passes every check.</p>
          </div>
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {quality.map((q) => (
              <article key={q.t} className="reveal flex gap-5 border-t-2 border-forest-900 pt-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><q.icon className="size-6" aria-hidden /></span>
                <div>
                  <h3 className="display text-3xl text-forest-900">{q.t}</h3>
                  <p className="mt-2"><strong className="text-forest-900">What it means:</strong> {q.means}</p>
                  <p className="mt-1"><strong className="text-forest-900">Why it matters:</strong> {q.why}</p>
                  <p className="mt-1 text-forest-500"><strong>Limit:</strong> {q.limit}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Email verification */}
      <section className="relative overflow-hidden bg-forest-900 py-20 text-sand-100 lg:py-28">
        <div aria-hidden className="glow-breathe pointer-events-none absolute left-1/2 top-0 h-72 w-[48rem] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.18), transparent)" }} />
        <div className={`${wrap} relative`}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={h2Dark}>Email verification, explained</h2>
            <p className="mt-4 text-lg">Email verification means checking, before you send, whether an address is likely to work. Ours is done in-house by our own team.</p>
          </div>
          <div className="mt-14"><EmailFlow /></div>

          <div className="mt-20 grid gap-12 lg:grid-cols-2">
            <div className="reveal">
              <h3 className="display text-3xl text-sand-50">Common status categories</h3>
              <dl className="mt-5 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.05]">
                {statuses.map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                    <dt className="font-semibold text-forest-300">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="reveal space-y-6">
              <div>
                <h3 className="display text-3xl text-sand-50">Why addresses stop working</h3>
                <p className="mt-2">People change jobs, businesses close or switch mail provider, and mailboxes get deleted. An address that worked last year can fail today, which is why we re-verify on a schedule.</p>
              </div>
              <div>
                <h3 className="display text-3xl text-sand-50">Verified does not mean delivered</h3>
                <p className="mt-2">A verified address was accepted by a server when we checked. Inbox placement also depends on your domain, your content and how recipients react. Verification does not guarantee delivery and does not predict replies.</p>
              </div>
              <div>
                <h3 className="display text-3xl text-sand-50">Send responsibly</h3>
                <p className="mt-2">Warm up a new domain, start with small batches, write specific messages, include a working unsubscribe, and watch your bounce rate. Good sending habits protect your results more than any list can.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Freshness */}
      <section className="bg-sand-50 py-20 lg:py-28">
        <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <div className="reveal rounded-[2rem] bg-forest-900 p-8 sm:p-10">
            <VerifyRing />
          </div>
          <div className="reveal">
            <h2 className={h2}>Data freshness and maintenance</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed">
              <p>Businesses move, close, rename and change numbers all the time, and people leave the jobs their email addresses belonged to. A database that is never revisited slowly gets worse.</p>
              <p>That is why all BeigeLeads data is re-verified every 60 days. Every list page shows the date it was last verified, so you can judge freshness yourself before you buy.</p>
              <p>Re-verification helps, but it is not instant. Changes between checks can still go unnoticed for a while, so treat any list as a recent snapshot and check the date.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Beyond emails */}
      <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-28">
        <div className={wrap}>
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className={h2}>Data quality is not just about emails</h2>
            <p className="mt-4 text-lg">A good list lets you research, segment and reach businesses in more than one way. These are the fields in our current lists.</p>
          </div>
          <dl className="mx-auto mt-12 grid max-w-5xl gap-x-12 md:grid-cols-2">
            {fields.map(([f, d]) => (
              <div key={f} className="reveal border-b border-sand-300 py-5">
                <dt className="display text-2xl text-forest-900">{f}</dt>
                <dd className="mt-1">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mx-auto mt-8 max-w-3xl text-center text-forest-700">
            Industry comes from the category you buy, so every list is already filtered to one kind of business. Our research can find extra details such as owners or tech stack, but these are not in the current lists. If you need more, ask through the{" "}
            <Link href="/custom-list" className={link}>custom list page</Link>.
          </p>
        </div>
      </section>

      {/* 9. Privacy and compliance */}
      <section className="bg-forest-900 py-20 text-sand-100 lg:py-28">
        <div className={wrap}>
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className={h2Dark}>Privacy, compliance and responsible use</h2>
            <p className="mt-4 text-lg">We describe how we operate. We do not claim blanket compliance, and a purchased list is not permission to contact everyone for every purpose. You remain responsible for making sure your own use follows the laws that apply to you.</p>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {compliance.map(([t, href, d]) => (
              <li key={t} className="reveal">
                <Link href={href} className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.05] p-6 transition-colors hover:border-forest-300 hover:bg-white/[0.09]">
                  <ShieldCheck className="size-6 text-forest-300" aria-hidden />
                  <h3 className="display mt-3 text-2xl text-sand-50">{t}</h3>
                  <p className="mt-2 flex-1 text-sand-200">{d}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sand-50">Read more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="reveal mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="flex gap-4"><EyeOff className="mt-1 size-6 shrink-0 text-forest-300" aria-hidden /><p><strong className="text-sand-50">Data minimisation.</strong> Our lists hold business contact details only, and samples are masked.</p></div>
            <div className="flex gap-4"><Trash2 className="mt-1 size-6 shrink-0 text-forest-300" aria-hidden /><p><strong className="text-sand-50">Opt-outs are applied.</strong> Removed contacts are left out of every file we generate afterwards.</p></div>
          </div>
        </div>
      </section>

      {/* 10. Guarantees */}
      <section className="bg-sand-50 py-20 lg:py-28">
        <div className={wrap}>
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className={h2}>What we can and cannot guarantee</h2>
            <p className="mt-4 text-lg">Trust comes from being clear about limits, so here they are.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="reveal rounded-[2rem] bg-forest-900 p-8 text-sand-100 sm:p-10">
              <h3 className="display text-3xl text-sand-50">What we do</h3>
              <ul className="mt-5 space-y-3">
                {[
                  "Check emails with in-house SMTP tests and re-verify all data every 60 days.",
                  "Show a masked sample and the last-verified date before you buy.",
                  "Apply opt-outs to every file we generate.",
                  "Replace bounced emails if more than 5% bounce, until the list is back to 95% verified and 95% accurate, under our Refund & Returns policy.",
                ].map((t) => (
                  <li key={t} className="flex gap-3"><Sparkles className="mt-1 size-5 shrink-0 text-forest-300" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
            <div className="reveal rounded-[2rem] border border-sand-300 bg-sand-100 p-8 sm:p-10">
              <h3 className="display text-3xl text-forest-900">What we cannot guarantee</h3>
              <ul className="mt-5 space-y-3">
                {[
                  "That a verified email reaches an inbox, or gets a reply.",
                  "That business information has not changed since we checked it.",
                  "That every record in a category is included, or that every record passes every check.",
                  "That a list is lawful to use for every purpose in every country. Review your own use first.",
                  "That quality is identical across sources and categories. It varies.",
                ].map((t) => (
                  <li key={t} className="flex gap-3"><Scale className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden />{t}</li>
                ))}
              </ul>
              <p className="mt-6">A free sample is the best way to judge a list for yourself. Read the <Link href="/legal/refund-replacement" className={link}>Refund &amp; Returns policy</Link> for the exact terms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Explore databases */}
      <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-28">
        <div className={wrap}>
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className={h2}>Explore our databases</h2>
            <p className="mt-4 text-lg">Every category is open: browse ready-made databases or request a custom one.</p>
          </div>
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dbCards.map((c) => (
              <li key={c.name} className="reveal">
                <Link href={c.href} className="group flex h-full flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-all hover:-translate-y-1 hover:border-forest-900 hover:shadow-[0_24px_50px_-30px_rgba(15,42,29,0.6)]">
                  <span className="flex h-12 items-center">{c.badge}</span>
                  <h3 className="display mt-5 text-3xl text-forest-900">{c.name}</h3>
                  <p className="mt-2 flex-1">{c.text}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-900">
                    {c.href === "/request-category" ? "Request a category" : "Explore databases"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SolutionFaq name="Our Data Sourcing and Verification" items={faq} />
      <SolutionCta
        heading="Better Research. Better Data. Better Opportunities."
        text="Explore business databases built to help you discover new markets and reach relevant businesses."
        primaryLabel="Explore All Databases"
        secondaryLabel="Request a Free Sample"
        primaryHref="/lists"
        secondaryHref="/sample"
      />
    </>
  );
}
