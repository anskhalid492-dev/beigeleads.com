import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, CalendarClock, Check, CircleCheck, ClipboardCheck, Database, FileSpreadsheet, FileText, FileType, Fingerprint, Globe2, HeartPulse, Home, Inbox, KeyRound, Layers, Mail, MailCheck, Phone, Scale, Search, ShieldCheck, Sparkles, Store, Tags, Trash2, UserRoundSearch, UserX, Workflow, X, type LucideIcon } from "lucide-react";
import { Flag } from "@/components/shared/db-icon";
import { fmtDate } from "@/components/product/meta";
import { listsHref } from "@/lib/shop";
import { approvedValue, type OurDataSettings } from "@/lib/our-data/settings";
import type { OurDataFacts } from "@/lib/our-data/facts";
import { InsideTabs } from "@/components/our-data/inside-tabs";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const lead = "mt-4 max-w-2xl text-lg leading-relaxed text-forest-700";
const btnP = "inline-flex h-12 items-center gap-2 rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const btnS = "inline-flex h-12 items-center gap-2 rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50 hover:bg-sand-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50";
const link = "font-semibold text-forest-700 underline decoration-purple-600/40 underline-offset-4 hover:text-purple-700";

function Head({ title, text, dark, id }: { title: string; text?: string; dark?: boolean; id?: string }) {
  return <div className="max-w-3xl"><h2 id={id} className={dark ? "display text-4xl text-sand-50 sm:text-5xl" : h2}>{title}</h2>{text && <p className={dark ? "mt-4 max-w-2xl text-lg leading-relaxed text-sand-200" : lead}>{text}</p>}</div>;
}

export const JUMPS: [string, string][] = [
  ["inside", "What is inside"], ["coverage", "Coverage"], ["industries", "Industries"], ["sourcing", "Sources"], ["verification", "Verification"], ["accuracy", "Accuracy"], ["freshness", "Freshness"], ["delivery", "Delivery"], ["privacy", "Privacy"],
];

/** Hero: keyword-led headline, jump links and an animated record card (no real or invented data: masked bars only). */
export function Hero({ s }: { s: OurDataSettings }) {
  const largest = approvedValue(s, "largest");
  const rows: [string, string][] = [["Business name", "w-3/5"], ["Address and city", "w-4/5"], ["Email", "w-2/3"], ["Phone", "w-1/2"], ["Website", "w-3/5"], ["Category", "w-2/5"]];
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(48rem 24rem at 0% 0%, rgba(45,106,79,0.45), transparent 70%), radial-gradient(34rem 24rem at 100% 100%, rgba(124,58,237,0.16), transparent 70%)" }}>
      <div className={`${wrap} grid items-center gap-12 pb-28 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-36 lg:pt-20`}>
        <div className="hero-in">
          <h1 className="display text-5xl text-sand-50 sm:text-6xl xl:text-[5rem]">Explore the B2B Data Behind BeigeLeads</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand-200">
            BeigeLeads sells business email and phone databases for 200+ countries. See what each record holds, where the data comes from, how every email is checked, how often lists are refreshed and how your file reaches you. {largest ? `${largest}.` : ""}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lists" className={btnP}>Explore B2B Databases <ArrowRight className="size-4" aria-hidden /></Link>
            <Link href="/verification" className={btnS}>How We Verify Data</Link>
          </div>
          <nav aria-label="On this page" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              {JUMPS.map(([id, t]) => <li key={id}><a href={`#${id}`} className="inline-block rounded-full border border-forest-700 px-3.5 py-1.5 text-sm text-sand-200 transition-colors hover:border-forest-300 hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-sand-50">{t}</a></li>)}
            </ul>
          </nav>
        </div>
        <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden>
          <div className="absolute inset-x-6 top-6 h-full rotate-[5deg] rounded-3xl border border-forest-700 bg-forest-700/30" />
          <div className="absolute inset-x-3 top-3 h-full rotate-[2deg] rounded-3xl border border-forest-700 bg-forest-700/40" />
          <div className="od-float relative overflow-hidden rounded-3xl border border-forest-500/60 bg-forest-700/80 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-sand-100"><Database className="size-4 text-forest-300" />Business record</span>
              <span className="flex items-center gap-1.5 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-900"><BadgeCheck className="size-3.5" />Email checked</span>
            </div>
            <ul className="mt-5 space-y-3.5">
              {rows.map(([l, w]) => (
                <li key={l} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm">
                  <span className="text-forest-300">{l}</span><span className={`h-3 rounded-full bg-sand-50/20 ${w}`} />
                </li>
              ))}
            </ul>
            <div className="od-scan pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-purple-600/25 to-transparent" />
          </div>
          <span className="od-float absolute -left-6 top-16 rounded-full border border-forest-500/60 bg-forest-900 px-3.5 py-1.5 text-sm font-semibold text-sand-100 shadow-lg [animation-delay:-2s]"><Globe2 className="mr-1.5 inline size-4 text-forest-300" />200+ countries</span>
          <span className="od-float absolute -right-4 bottom-10 rounded-full border border-forest-500/60 bg-forest-900 px-3.5 py-1.5 text-sm font-semibold text-sand-100 shadow-lg [animation-delay:-4s]"><CalendarClock className="mr-1.5 inline size-4 text-forest-300" />Refreshed every 90 days</span>
        </div>
      </div>
    </section>
  );
}

/** The four statistic cards, placed under the hero. Only real or approved-with-evidence figures. */
export function Stats({ s, f }: { s: OurDataSettings; f: OurDataFacts }) {
  const records = approvedValue(s, "records");
  const accuracy = approvedValue(s, "accuracy");
  const cards: { icon: LucideIcon; label: string; big: string; note: string }[] = [
    { icon: Database, label: "Database Size", big: `${records ?? "8B+"} records`, note: "BeigeLeads owns a database of 8B+ business records. Every list page shows its own record count and last-updated date." },
    { icon: BadgeCheck, label: "Data Accuracy", big: accuracy ?? "5% bounce replacement", note: accuracy ? "Measured accuracy, see our method." : "If more than 5% of emails in a delivered list bounce, we replace them." },
    { icon: Globe2, label: "Global Coverage", big: "200+ countries", note: "Business data available worldwide, with ready-made databases for many of them." },
    { icon: CalendarClock, label: "Data Freshness", big: "Every 90 days", note: f.newestUpdate ? `Databases are refreshed on this cycle. Newest list update: ${fmtDate(f.newestUpdate)}.` : "Databases are refreshed on this cycle." },
  ];
  return (
    <section className="bg-sand-50 pb-6" aria-label="Data at a glance">
      <div className={wrap}>
        <ul className="-mt-20 grid gap-4 sm:grid-cols-2 lg:-mt-24 lg:grid-cols-4">
          {cards.map((c) => (
            <li key={c.label} className="relative rounded-2xl border border-sand-200 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,42,29,0.45)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-forest-500"><span className="grid size-8 place-items-center rounded-lg bg-forest-100 text-forest-700"><c.icon className="size-4" aria-hidden /></span>{c.label}</div>
              <p className="display mt-4 text-3xl text-forest-900 sm:text-4xl">{c.big}</p>
              <p className="mt-2 text-sm leading-relaxed text-forest-700">{c.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** What is inside: interactive field explorer, no counts. */
export function Inside() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="inside" aria-labelledby="inside-h">
      <div className={wrap}>
        <Head id="inside-h" title="What Is Inside a Database" text="Every business record is built from fields in five groups. Pick a group to see exactly what we collect. Check the masked sample on a list page before you buy." />
        <div className="mt-10"><InsideTabs /></div>
        <p className="mt-6 text-sm text-forest-700">Field guide: <Link href="/help/custom-list/data-fields" className={link}>what each field means</Link>.</p>
      </div>
    </section>
  );
}

/** Coverage: 200+ countries (owner statement) and the real ready-made countries. */
export function Coverage({ f }: { f: OurDataFacts }) {
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="coverage" aria-labelledby="coverage-h">
      <div className={wrap}>
        <Head id="coverage-h" title="Where Our Databases Cover" text="BeigeLeads offers business data in 200+ countries. The countries below already have a ready-made database on the site, and every link opens only real lists." />
        {f.byRegion.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 text-forest-700">Ready-made country databases appear here as they are added. <Link href="/custom-list" className={link}>Ask for a custom list</Link> for any country.</p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {f.byRegion.map((g) => (
              <div key={g.region} className="rounded-2xl border border-sand-200 bg-white p-6">
                <h3 className="display text-2xl text-forest-900">{g.region}</h3>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {g.countries.map((c) => (
                    <li key={c.slug}>
                      <Link href={listsHref({ countries: [c.slug] })} className="flex items-center gap-3 rounded-xl px-3 py-2 text-forest-700 transition-colors hover:bg-sand-100 hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
                        <Flag code={c.code} className="h-4 w-6 shrink-0" />{c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 text-forest-700">Need a country that is not listed yet? <Link href="/request-category" className={link}>Tell us what you need</Link> or <Link href="/custom-list" className={link}>request a custom list</Link>.</p>
      </div>
    </section>
  );
}

/** Industries: six fixed entry points that map to existing category pages. */
export function Industries() {
  const items: { icon: LucideIcon; t: string; d: string; href: string }[] = [
    { icon: Store, t: "Local Businesses Databases", d: "Restaurants, clinics, salons, gyms, shops and trades, found by what they sell and where they are.", href: "/lists/local-businesses-database" },
    { icon: Home, t: "Real Estate", d: "Agencies, brokers and property businesses for outreach to the property market.", href: "/lists/industry-databases/real-estate" },
    { icon: HeartPulse, t: "Healthcare", d: "Dentists, clinics, pharmacies and other health practices, listed by place.", href: "/lists/healthcare-lists" },
    { icon: Briefcase, t: "Business Databases", d: "Company-level business email lists for B2B prospecting across sectors.", href: "/lists/business-email-lists" },
    { icon: UserRoundSearch, t: "Job Titles Lists", d: "Lists built around the role of the person you want to reach.", href: "/lists/job-title-lists" },
    { icon: Phone, t: "Phone Numbers Databases", d: "Business phone number lists for teams that prospect by call or text, within the law.", href: "/lists/phone-number-lists" },
  ];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="industries" aria-labelledby="industries-h">
      <div className={wrap}>
        <Head id="industries-h" title="Industries We Cover" text="Start from the kind of business or contact you sell to. Each card opens that category with its ready-made databases." />
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.t}>
              <Link href={i.href} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-[0_18px_40px_-26px_rgba(15,42,29,0.5)] focus-visible:outline-2 focus-visible:outline-purple-600">
                <span className="grid size-12 place-items-center rounded-xl bg-forest-900 text-sand-50 transition-colors group-hover:bg-purple-600"><i.icon className="size-6" aria-hidden /></span>
                <h3 className="display mt-5 text-2xl text-forest-900">{i.t}</h3>
                <p className="mt-2 grow text-forest-700">{i.d}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-forest-900">Browse {i.t.toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6"><Link href="/lists" className={link}>Browse every database</Link></p>
      </div>
    </section>
  );
}

/** Roles: a seniority staircase of levels you can request, plus what is ready-made. */
export function Roles() {
  const levels = ["Owner or founder", "C-level", "Director or VP", "Manager", "Specialist"];
  const lanes: [LucideIcon, string, string, string][] = [
    [Database, "Ready-made", "Lists are organised by business type and place. Records can include an owner or contact name and job title where one was found.", "/lists"],
    [UserRoundSearch, "Job title lists", "Browse lists built around a role instead of a business type.", "/lists/job-title-lists"],
    [Layers, "Requested", "Need a specific level or title? Put it in a custom list request. We tell you what can be sourced.", "/custom-list"],
  ];
  return (
    <section className="overflow-hidden bg-sand-100 py-20 lg:py-24" id="roles" aria-labelledby="roles-h">
      <div className={`${wrap} grid items-end gap-12 lg:grid-cols-[1fr_1fr]`}>
        <div>
          <Head id="roles-h" title="Targeting by Role and Seniority" text="Reach the person who decides. Pick a level and a job title, and we source what is available." />
          <ul className="mt-8 space-y-3">
            {lanes.map(([I, t, d, h]) => (
              <li key={t}><Link href={h} className="group flex gap-4 rounded-2xl border border-sand-200 bg-white p-5 transition-colors hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-purple-600">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700"><I className="size-5" aria-hidden /></span>
                <span><span className="display block text-xl text-forest-900">{t}</span><span className="mt-1 block text-forest-700">{d}</span></span>
              </Link></li>
            ))}
          </ul>
        </div>
        <div aria-label="Seniority levels you can request">
          <p className="mb-3 text-sm font-semibold text-forest-500">Levels you can request, subject to sourcing</p>
          <ol className="flex h-80 items-end gap-2 sm:gap-3">
            {levels.map((l, i) => (
              <li key={l} className="flex h-full flex-1 items-end">
                <div className="od-lit w-full rounded-t-2xl p-3 text-forest-900" style={{ height: `${28 + i * 18}%`, ["--i" as string]: levels.length - 1 - i, ["--od-base" as string]: "#D8EADF" } as React.CSSProperties}>
                  <span className="display block text-base leading-tight sm:text-lg">{l}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="h-1.5 rounded-full bg-forest-900" />
          <p className="mt-3 text-sm text-forest-700">Availability varies by country and industry. <Link href="/custom-list" className={link}>Start a custom list request</Link>.</p>
        </div>
      </div>
    </section>
  );
}

/** Sourcing: eight source types flow into one enrichment node. Animated, CSS only. */
export function Sourcing() {
  const src: [LucideIcon, string][] = [[Store, "Business listings and maps"], [Globe2, "Company websites"], [Scale, "Public government registries"], [Layers, "Directories"], [KeyRound, "Licensed data providers"], [UserRoundSearch, "Public professional profiles and social handles"], [ClipboardCheck, "Surveys"], [Search, "Our own research"]];
  const Y = (i: number) => 26 + i * 64;
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24" id="sourcing" aria-labelledby="sourcing-h">
      <div className={wrap}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Head id="sourcing-h" dark title="How We Source Data" text="Our team collects raw data from many places, then adds what is missing, such as owners, technology and emails, before checking it." />
          <Link href="/data-sources" className={btnP}>Read our data sources <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <div className="mt-12 grid items-center gap-6 lg:grid-cols-[19rem_1fr_17rem] lg:gap-0">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {src.map(([I, t]) => <li key={t} className="flex h-[52px] items-center gap-3 rounded-xl border border-forest-700 bg-forest-700/40 px-4 text-sm"><I className="size-4 shrink-0 text-forest-300" aria-hidden />{t}</li>)}
          </ul>
          <svg viewBox="0 0 300 500" preserveAspectRatio="none" className="hidden h-[500px] w-full lg:block" aria-hidden>
            {src.map((_, i) => <path key={i} d={`M0,${Y(i)} C150,${Y(i)} 150,250 300,250`} fill="none" stroke="#2D6A4F" strokeWidth="1.5" />)}
            {src.map((_, i) => <path key={`d${i}`} d={`M0,${Y(i)} C150,${Y(i)} 150,250 300,250`} fill="none" stroke="#A78BFA" strokeWidth="2" className="od-dash" style={{ animationDelay: `${-i * 0.18}s` }} />)}
          </svg>
          <div className="relative rounded-3xl border border-forest-500/60 bg-forest-700/60 p-6">
            <span className="grid size-12 place-items-center rounded-xl bg-purple-600 text-white"><Sparkles className="size-6" aria-hidden /></span>
            <h3 className="display mt-4 text-2xl text-sand-50">Enrich and match</h3>
            <p className="mt-2 text-sm text-sand-200">We look for missing owners, technology and emails using published emails, pattern inference and waterfall enrichment, then match everything to one record per business.</p>
            <ul className="mt-4 space-y-2 text-sm text-sand-100">
              {["Owners and contacts", "Technology used", "Published and inferred emails"].map((x) => <li key={x} className="flex items-center gap-2"><CircleCheck className="size-4 text-forest-300" aria-hidden />{x}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Verification: detailed vertical timeline plus what an email check can and cannot tell you. */
export function Verification() {
  const steps: [LucideIcon, string, string, string][] = [
    [Search, "Collect", "Raw records are gathered from the source types above.", "Gives every list a wide, public starting point."],
    [Sparkles, "Enrich", "Missing owners, technology and emails are looked up and added.", "Fills gaps so records are useful, not just present."],
    [Workflow, "Standardise and remove duplicates", "Formats are cleaned and one business is kept once.", "Stops you paying for, or emailing, the same business twice."],
    [Tags, "Tag", "Each record is tagged by category, country, city and size.", "Lets you buy exactly the slice you need."],
    [MailCheck, "Check every email", "Each email goes through SMTP-level checks. Addresses that fail are corrected or dropped.", "Lowers the chance of bounces before you send."],
    [UserX, "Remove opt-outs", "People who asked to be removed are taken out before a file is built.", "Respects removal requests across every list."],
    [Inbox, "Build, date and deliver", "The file is built, a masked sample is made and the update date is recorded.", "You can see how recent a list is before you buy."],
  ];
  const can = ["The address is written correctly", "The domain is set up to receive email", "The mailbox appears to exist on the server"];
  const cannot = ["That a message will reach the inbox", "That the person still holds the role", "The answer for domains that accept all mail"];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="verification" aria-labelledby="verification-h">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[22rem_1fr]`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Head id="verification-h" title="How Data Is Verified" text="Seven stages take a raw record to a list you can send to. Verification lowers the chance of bounces. It does not guarantee that a message is delivered or read." />
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2"><Link href="/verification" className={link}>Full verification method</Link><Link href="/email-list-verification" className={link}>Verify your own list</Link></p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="display flex items-center gap-2 text-xl text-forest-900"><Check className="size-5 text-forest-500" aria-hidden />What an email check tells you</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-forest-700">{can.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="display flex items-center gap-2 text-xl text-forest-900"><X className="size-5 text-forest-500" aria-hidden />What it cannot tell you</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-forest-700">{cannot.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </div>
        <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[1.4rem] before:top-6 before:w-px before:bg-sand-300">
          {steps.map(([I, t, d, w], i) => (
            <li key={t} className="reveal relative flex gap-5">
              <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-forest-900 text-sand-50 ring-4 ring-sand-50"><I className="size-5" aria-hidden /></span>
              <div className="grow rounded-2xl border border-sand-200 bg-white p-5">
                <p className="text-sm font-semibold text-forest-500">Stage {i + 1}</p>
                <h3 className="display text-2xl text-forest-900">{t}</h3>
                <p className="mt-1 text-forest-700">{d}</p>
                <p className="mt-3 flex gap-2 rounded-xl bg-forest-100/60 px-3 py-2 text-sm text-forest-900"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden /><span><strong>Why it matters:</strong> {w}</span></p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Accuracy: what is promised, what is not, and how a replacement claim works. */
export function Accuracy({ s }: { s: OurDataSettings }) {
  const a = approvedValue(s, "accuracy");
  const claim: [string, string][] = [["Tell us", "Send the bounce report for the delivered list within the 30-day claim window."], ["We check", "We review the bounces against the list we delivered."], ["Replace or refund", "Bounced emails are replaced, or you get a proportional refund in crypto."], ["Back to 95%", "The list is restored to 95% verified."]];
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="accuracy" aria-labelledby="accuracy-h">
      <div className={wrap}>
        <Head id="accuracy-h" title="What Accuracy Means Here" text="No business data set is perfect, because businesses move, close and change their email addresses. What we give you is a clear rule for what happens when a list falls short." />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl bg-forest-900 p-7 text-sand-100 sm:p-9">
            <p className="text-sm font-semibold text-forest-300">Replacement rule</p>
            <p className="display mt-2 text-4xl text-sand-50 sm:text-5xl">More than 5% bounce? We replace them.</p>
            <div className="mt-8" role="img" aria-label="Bounce threshold: a list is restored to 95% verified">
              <div className="relative h-4 overflow-hidden rounded-full bg-forest-700"><div className="od-grow h-full w-[95%] rounded-full bg-gradient-to-r from-forest-500 to-forest-300" /></div>
              <div className="relative mt-2 h-6 text-sm"><span className="absolute left-0 text-forest-300">0%</span><span className="absolute left-[95%] -translate-x-1/2 whitespace-nowrap font-semibold text-sand-50">95% verified</span></div>
            </div>
            <p className="mt-4 text-sand-200">We restore a list to 95% verified, or refund the difference in proportion. <Link href="/legal/refund-replacement" className="font-semibold text-sand-50 underline underline-offset-4">Read the replacement policy</Link>.</p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-sand-200 bg-white p-6">
              <h3 className="display flex items-center gap-2 text-xl text-forest-900"><ShieldCheck className="size-5 text-forest-500" aria-hidden />What we stand behind</h3>
              <p className="mt-2 text-forest-700">A written replacement and refund rule, and a masked sample on every list page so you can judge before you buy.</p>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-6">
              <h3 className="display flex items-center gap-2 text-xl text-forest-900"><Fingerprint className="size-5 text-forest-500" aria-hidden />What it is not</h3>
              <p className="mt-2 text-forest-700">Accuracy figures on list pages are BeigeLeads&rsquo; clear promise, but BeigeLeads doesn&rsquo;t promise replies or sales.</p>
            </div>
            {a && <div className="rounded-2xl border border-sand-200 bg-white p-6"><h3 className="display flex items-center gap-2 text-xl text-forest-900"><BadgeCheck className="size-5 text-forest-500" aria-hidden />Measured accuracy: {a}</h3><p className="mt-2 text-forest-700">{s.claims.accuracy.evidence}{s.claims.accuracy.evidenceUrl && <> <Link href={s.claims.accuracy.evidenceUrl} className={link}>Method</Link></>}</p></div>}
          </div>
        </div>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {claim.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-sand-200 bg-white p-5"><span className="grid size-8 place-items-center rounded-full bg-forest-900 text-sm font-semibold text-sand-50">{i + 1}</span><h3 className="display mt-3 text-xl text-forest-900">{t}</h3><p className="mt-1 text-sm text-forest-700">{d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Freshness: a 90-day cycle ring, plain reasons it matters and three next-step tiles. */
export function Freshness() {
  const pts: [LucideIcon, string, string][] = [
    [CalendarClock, "On a 90-day cycle", "BeigeLeads refreshes its databases every 90 days. We do not claim real-time or daily updates."],
    [Search, "Dates you can see", "Each list page shows when that list was last updated."],
    [UserRoundSearch, "Why it matters", "People change jobs and businesses move or close, so email lists age. Older lists bounce more."],
  ];
  const next: [LucideIcon, string, string, string][] = [
    [Layers, "How freshness works", "The refresh cycle explained", "/help/data-quality/data-freshness"],
    [Database, "B2B data decay research", "What published studies found", "/benchmarks/b2b-data-decay"],
    [MailCheck, "Re-check an older list", "Verify a list you already own", "/email-list-verification"],
  ];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="freshness" aria-labelledby="freshness-h">
      <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
        <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden>
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
            <circle cx="100" cy="100" r="88" fill="none" stroke="#E8DEC6" strokeWidth="2" />
            <g className="od-ring"><circle cx="100" cy="100" r="88" fill="none" stroke="#2D6A4F" strokeWidth="3" strokeDasharray="138 415" strokeLinecap="round" /><circle cx="100" cy="12" r="6" fill="#7C3AED" /></g>
            <circle cx="100" cy="100" r="68" fill="#0F2A1D" />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center"><div><p className="display text-6xl text-sand-50">90</p><p className="text-sm font-semibold text-forest-300">days per refresh</p></div></div>
        </div>
        <div>
          <Head id="freshness-h" title="How Fresh Is the Data" text="Fresh data bounces less and reaches more of the people you meant to contact." />
          <ul className="mt-8 divide-y divide-sand-200 border-y border-sand-200">
            {pts.map(([I, t, d]) => (
              <li key={t} className="flex gap-4 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-sand-50"><I className="size-5" aria-hidden /></span>
                <div><h3 className="display text-xl text-forest-900">{t}</h3><p className="mt-1 text-forest-700">{d}</p></div>
              </li>
            ))}
          </ul>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {next.map(([I, t, d, href]) => (
              <li key={t}>
                <Link href={href} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-4 transition-colors hover:border-forest-700 hover:bg-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                  <span className="flex items-center justify-between"><I className="size-5 text-forest-500 transition-colors group-hover:text-forest-300" aria-hidden /><ArrowRight className="size-4 text-forest-700 transition-all group-hover:translate-x-0.5 group-hover:text-purple-100" aria-hidden /></span>
                  <span className="mt-4 font-semibold leading-snug text-forest-900 group-hover:text-sand-50">{t}</span>
                  <span className="mt-1 text-sm text-forest-700 group-hover:text-sand-200">{d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Formats and delivery. */
export function Delivery() {
  const fm: [LucideIcon, string, string][] = [[FileText, "CSV", "Opens in any spreadsheet, CRM or email tool."], [FileSpreadsheet, "Excel", "Ready to sort and filter in a workbook."], [FileType, "TXT", "Plain text for scripts and simple imports."]];
  const steps: [string, string][] = [["Pick a list", "Choose a database and package. No account needed."], ["Pay once in crypto", "One payment. No subscription."], ["Payment confirmed", "The network confirms your payment."], ["Open your email", "A link to your file arrives in your inbox."]];
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="delivery" aria-labelledby="delivery-h">
      <div className={wrap}>
        <Head id="delivery-h" title="Formats and Delivery" text="Lists come as CSV, Excel or TXT. After your crypto payment is confirmed, an email brings the link to your file." />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {fm.map(([I, t, d]) => <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><span className="grid size-11 place-items-center rounded-xl bg-forest-900 text-sand-50"><I className="size-5" aria-hidden /></span><h3 className="display mt-4 text-2xl text-forest-900">{t}</h3><p className="mt-1 text-forest-700">{d}</p></li>)}
        </ul>
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {steps.map(([t, d], i) => <li key={t} className="relative rounded-2xl bg-forest-900 p-5 text-sand-100"><span className="text-sm font-semibold text-forest-300">Step {i + 1}</span><h3 className="display mt-1 text-xl text-sand-50">{t}</h3><p className="mt-1 text-sm text-sand-200">{d}</p></li>)}
        </ol>
        <p className="mt-6 max-w-2xl text-forest-700">Delivery is usually instant and can take up to 12 hours in some cases. You can download your file as often as you need.</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link href="/help/delivery/how-you-receive-your-list" className={link}>How delivery works</Link><Link href="/help/delivery/file-formats" className={link}>File formats</Link><Link href="/legal/delivery" className={link}>Delivery policy</Link></p>
      </div>
    </section>
  );
}

/** Privacy and responsible use. */
export function Privacy() {
  const cards: [LucideIcon, string, string][] = [
    [Database, "How we collect", "We describe where data comes from and how we use it in our privacy policy and on the Data Sources page."],
    [Trash2, "Removal requests", "Anyone can ask to be removed. Opt-outs are saved and kept off every future file."],
    [Scale, "Your responsibility", "Buyers agree to use data lawfully in their own region and not for spam, fraud or harassment."],
    [Mail, "No blanket guarantees", "We explain our rules clearly. We do not promise that any use of the data is lawful everywhere."],
  ];
  const links: [string, string][] = [["Privacy policy", "/legal/privacy"], ["Lawful use policy", "/legal/lawful-use"], ["GDPR", "/legal/gdpr"], ["CCPA", "/legal/ccpa"], ["CAN-SPAM", "/legal/can-spam"], ["Opt out of our data", "/opt-out"]];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="privacy" aria-labelledby="privacy-h">
      <div className={wrap}>
        <Head id="privacy-h" title="Privacy and Responsible Use" text="Good data should be used with care. Here is how we handle it and what we expect from buyers." />
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(([I, t, d]) => <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><I className="size-6 text-forest-500" aria-hidden /><h3 className="display mt-4 text-2xl text-forest-900">{t}</h3><p className="mt-2 text-forest-700">{d}</p></li>)}
        </ul>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(([t, h]) => <li key={h}><Link href={h} className="flex items-center justify-between rounded-2xl border border-sand-200 bg-white px-5 py-4 font-semibold text-forest-900 transition-colors hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-purple-600">{t}<ArrowRight className="size-4 text-forest-500" aria-hidden /></Link></li>)}
        </ul>
      </div>
    </section>
  );
}

/** 14: final call to action. */
export function FinalCta() {
  return (
    <section className="bg-forest-900 py-20 text-center text-sand-100 lg:py-24">
      <div className={wrap}>
        <h2 className="display mx-auto max-w-3xl text-4xl text-sand-50 sm:text-6xl">Find the Business Data You Need</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-sand-200">Pay once. Own the list. See a masked sample on every list page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/lists" className={btnP}>Browse Databases</Link>
          <Link href="/custom-list" className={btnS}>Request Custom Data</Link>
        </div>
      </div>
    </section>
  );
}
