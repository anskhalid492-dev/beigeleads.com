import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, CircleCheck, Database, FileDown, Globe2, Layers, MailCheck, Search, ShieldCheck, Sparkles, Target, UserRoundSearch, Workflow, type LucideIcon } from "lucide-react";
import { Flag } from "@/components/shared/db-icon";
import { fmtDate } from "@/components/product/meta";
import { FIELD_CATALOG, FIELD_GROUPS } from "@/lib/product-fields";
import { listsHref } from "@/lib/shop";
import { approvedValue, type OurDataSettings } from "@/lib/our-data/settings";
import type { OurDataFacts } from "@/lib/our-data/facts";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const lead = "mt-4 max-w-2xl text-lg leading-relaxed text-forest-700";
const btnP = "inline-flex h-12 items-center gap-2 rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const btnS = "inline-flex h-12 items-center gap-2 rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50 hover:bg-sand-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50";
const link = "font-semibold text-forest-700 underline decoration-purple-600/40 underline-offset-4 hover:text-purple-700";

function Head({ title, text }: { title: string; text?: string }) {
  return <div className="max-w-3xl"><h2 className={h2}>{title}</h2>{text && <p className={lead}>{text}</p>}</div>;
}

/** 1 + 2: hero and the four statistic cards. Cards show only what is real or approved with evidence. */
export function Hero({ s, f }: { s: OurDataSettings; f: OurDataFacts }) {
  const records = approvedValue(s, "records");
  const accuracy = approvedValue(s, "accuracy");
  const largest = approvedValue(s, "largest");
  const n = f.countries.length;
  const cards: { icon: LucideIcon; label: string; big: string; note: string }[] = [
    { icon: Database, label: "Database Records", big: records ?? "Counted per list", note: records ? "Total across BeigeLeads databases." : "Every list page shows its own record count and last-updated date." },
    { icon: BadgeCheck, label: "Data Accuracy", big: accuracy ?? "5% bounce replacement", note: accuracy ? "Measured accuracy, see our method." : "If more than 5% of emails in a delivered list bounce, we replace them." },
    { icon: Globe2, label: "Global Coverage", big: n > 0 ? `${n} ${n === 1 ? "country" : "countries"}` : "Growing", note: n > 0 ? "With ready-made databases listed on the site today." : "Countries appear here as lists are added." },
    { icon: CalendarClock, label: "Data Freshness", big: "Every 90 days", note: f.newestUpdate ? `Databases are refreshed on this cycle. Newest list update: ${fmtDate(f.newestUpdate)}.` : "Databases are refreshed on this cycle." },
  ];
  return (
    <section className="bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(46rem 22rem at 0% 0%, rgba(45,106,79,0.4), transparent 70%)" }}>
      <div className={`${wrap} pb-16 pt-14 lg:pb-24 lg:pt-20`}>
        <div className="hero-in max-w-4xl">
          <h1 className="display text-5xl text-sand-50 sm:text-7xl xl:text-[5.5rem]">Explore the Data Behind BeigeLeads</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand-200">
            See what is inside our business databases, where the data comes from, how it is checked and how it reaches you. {largest ? `${largest}.` : "Everything on this page comes from how we actually work."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lists" className={btnP}>Explore B2B Databases <ArrowRight className="size-4" aria-hidden /></Link>
            <Link href="/verification" className={btnS}>How We Verify Data</Link>
          </div>
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <li key={c.label} className="rounded-2xl border border-forest-700 bg-forest-700/40 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-forest-300"><c.icon className="size-4" aria-hidden />{c.label}</div>
              <p className="display mt-4 text-3xl text-sand-50 sm:text-4xl">{c.big}</p>
              <p className="mt-3 text-sm leading-relaxed text-sand-200">{c.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 3: what is inside, the field catalog by group. */
export function Inside({ f }: { f: OurDataFacts }) {
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="inside">
      <div className={wrap}>
        <Head title="What Is Inside a Database" text={`Each record can hold up to ${f.fieldCount} fields in five groups. Which fields are filled varies by product and by record, so check the masked sample on a list page before you buy.`} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FIELD_GROUPS.map((g) => {
            const rows = FIELD_CATALOG.filter((x) => x.group === g);
            return (
              <div key={g} className="rounded-2xl border border-sand-200 bg-white p-6">
                <h3 className="display text-2xl text-forest-900">{g}</h3>
                <p className="mt-1 text-sm text-forest-500">{rows.length} fields</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {rows.slice(0, 8).map((r) => <li key={r.name} className="rounded-full bg-sand-100 px-3 py-1 text-sm text-forest-700">{r.name}</li>)}
                  {rows.length > 8 && <li className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-forest-900">+{rows.length - 8} more</li>}
                </ul>
              </div>
            );
          })}
          <div className="rounded-2xl bg-forest-900 p-6 text-sand-100">
            <h3 className="display text-2xl text-sand-50">See real rows first</h3>
            <p className="mt-2 text-sand-200">Every list page has a masked sample. You can also request a free one.</p>
            <Link href="/sample" className="mt-5 inline-flex items-center gap-2 font-semibold text-sand-50 underline underline-offset-4">Request a free sample <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
        <p className="mt-6 text-sm text-forest-700">Field guide: <Link href="/help/custom-list/data-fields" className={link}>what each field means</Link>.</p>
      </div>
    </section>
  );
}

/** 4: coverage by region, real countries only. */
export function Coverage({ f }: { f: OurDataFacts }) {
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="coverage">
      <div className={wrap}>
        <Head title="Where Our Databases Cover" text="Countries below have a ready-made database on the site today. The list grows as databases are added, and each link opens only real lists." />
        {f.byRegion.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 text-forest-700">No country databases are listed yet. <Link href="/custom-list" className={link}>Ask for a custom list</Link>.</p>
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
        <p className="mt-6 text-forest-700">Need a country that is not listed? <Link href="/request-category" className={link}>Tell us what you need</Link>.</p>
      </div>
    </section>
  );
}

/** 5: industries from the real catalog. */
export function Industries({ f }: { f: OurDataFacts }) {
  if (!f.industries.length) return null;
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="industries">
      <div className={wrap}>
        <Head title="Industries We Cover" text="These categories each have at least one database on the site now." />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {f.industries.slice(0, 24).map((i) => (
            <li key={i.slug}>
              <Link href={`/lists/${i.slug}`} className="flex items-center justify-between rounded-2xl border border-sand-200 bg-white px-5 py-4 font-semibold text-forest-900 transition-colors hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-purple-600">
                {i.name}<ArrowRight className="size-4 text-forest-500" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6"><Link href="/lists" className={link}>Browse every database</Link></p>
      </div>
    </section>
  );
}

/** 6: roles. Only what exists: the contact fields and the custom list workflow. */
export function Roles() {
  const items: [LucideIcon, string, string][] = [
    [UserRoundSearch, "Contact fields", "Many records include an owner or decision-maker name and a contact job title where one was found. Availability varies by product."],
    [Target, "Custom list requests", "Need specific job titles or seniority? Add them to a custom list request and we tell you what can be sourced."],
    [Layers, "Business-level lists", "Ready-made lists are organised by business type and place, not by individual job title."],
  ];
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="roles">
      <div className={wrap}>
        <Head title="Targeting by Role and Seniority" text="Be clear about what is ready-made and what is requested." />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map(([I, t, d]) => (
            <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><I className="size-6 text-forest-500" aria-hidden /><h3 className="display mt-4 text-2xl text-forest-900">{t}</h3><p className="mt-2 text-forest-700">{d}</p></li>
          ))}
        </ul>
        <p className="mt-6"><Link href="/custom-list" className={link}>Start a custom list request</Link></p>
      </div>
    </section>
  );
}

/** 7: sourcing, matching /data-sources. */
export function Sourcing() {
  const src = ["Business listings and maps", "Company websites", "Public government registries", "Directories", "Licensed data providers", "Public professional profiles and social handles", "Surveys", "Our own research"];
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24" id="sourcing">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[1fr_1.1fr]`}>
        <div>
          <h2 className="display text-4xl text-sand-50 sm:text-5xl">How We Source Data</h2>
          <p className="mt-4 text-lg leading-relaxed text-sand-200">Our team collects raw data from many places, then adds what is missing, such as owners, technology and emails, before checking it.</p>
          <Link href="/data-sources" className={`${btnP} mt-8`}>Read our data sources <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {src.map((x) => <li key={x} className="flex items-start gap-3 rounded-xl border border-forest-700 bg-forest-700/40 p-4"><CircleCheck className="mt-0.5 size-5 shrink-0 text-forest-300" aria-hidden />{x}</li>)}
        </ul>
      </div>
    </section>
  );
}

/** 8: verification diagram. */
export function Verification() {
  const steps: [LucideIcon, string, string][] = [
    [Search, "Collect", "Raw records from the sources above."],
    [Sparkles, "Enrich", "Find missing owners, technology and emails."],
    [MailCheck, "Check emails", "SMTP-level checks on every email."],
    [Workflow, "Organise", "Tag by category, place and size; remove duplicates."],
    [FileDown, "Deliver", "Export to CSV, Excel or TXT."],
  ];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="verification">
      <div className={wrap}>
        <Head title="How Data Is Verified" text="Verification lowers the chance of bounces. It does not guarantee that a message is delivered or read." />
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {steps.map(([I, t, d], i) => (
            <li key={t} className="relative rounded-2xl border border-sand-200 bg-white p-5">
              <span className="grid size-10 place-items-center rounded-full bg-forest-100 text-forest-900"><I className="size-5" aria-hidden /></span>
              <p className="mt-3 text-sm text-forest-500">Step {i + 1}</p>
              <h3 className="display text-xl text-forest-900">{t}</h3>
              <p className="mt-1 text-sm text-forest-700">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2"><Link href="/verification" className={link}>Full verification method</Link><Link href="/email-list-verification" className={link}>Verify your own list</Link></p>
      </div>
    </section>
  );
}

/** 9: what accuracy means. */
export function Accuracy({ s }: { s: OurDataSettings }) {
  const a = approvedValue(s, "accuracy");
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="accuracy">
      <div className={`${wrap} grid gap-10 lg:grid-cols-2`}>
        <div>
          <h2 className={h2}>What Accuracy Means Here</h2>
          <p className={lead}>No business data set is perfect, because businesses move, close and change their email addresses. What we can promise is a clear rule for what happens when a list falls short.</p>
        </div>
        <ul className="space-y-3 text-forest-700">
          <li className="flex gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden /><span>If more than 5% of the emails in a delivered list bounce, we replace the bounced emails until the list is back at 95% verified, or refund the difference in proportion. Details: <Link href="/legal/refund-replacement" className={link}>replacement policy</Link>.</span></li>
          {a && <li className="flex gap-3"><BadgeCheck className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden /><span>Measured accuracy: {a}. {s.claims.accuracy.evidence}{s.claims.accuracy.evidenceUrl && <> <Link href={s.claims.accuracy.evidenceUrl} className={link}>Method</Link></>}</span></li>}
          <li className="flex gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden /><span>Accuracy figures on list pages are BeigeLeads&rsquo; own statements, not independent audits.</span></li>
        </ul>
      </div>
    </section>
  );
}

/** 10: freshness. */
export function Freshness({ f }: { f: OurDataFacts }) {
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="freshness">
      <div className={wrap}>
        <Head title="How Fresh Is the Data" text="BeigeLeads refreshes its databases every 90 days. We do not claim real-time or daily updates." />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-sand-200 bg-white p-6"><h3 className="display text-2xl text-forest-900">Dates you can see</h3><p className="mt-2 text-forest-700">Each list page shows when that list was last updated.{f.newestUpdate && <> The newest update on the site is {fmtDate(f.newestUpdate)}.</>}</p></div>
          <div className="rounded-2xl border border-sand-200 bg-white p-6"><h3 className="display text-2xl text-forest-900">Why it matters</h3><p className="mt-2 text-forest-700">Business emails go out of date as people and companies change. <Link href="/help/data-quality/data-freshness" className={link}>Read how freshness works</Link>.</p></div>
        </div>
      </div>
    </section>
  );
}

/** 11: formats and delivery. */
export function Delivery() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24" id="delivery">
      <div className={wrap}>
        <Head title="Formats and Delivery" text="Lists come as CSV, Excel or TXT. After your crypto payment is confirmed, an email brings the link to your file." />
        <ul className="mt-8 flex flex-wrap gap-3">{["CSV", "Excel", "TXT"].map((x) => <li key={x} className="rounded-full border border-sand-300 bg-white px-5 py-2 font-semibold text-forest-900">{x}</li>)}</ul>
        <p className="mt-6 max-w-2xl text-forest-700">Delivery is usually quick and can take up to 12 hours in some cases. There is no account to create.</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link href="/help/delivery/how-you-receive-your-list" className={link}>How delivery works</Link><Link href="/help/delivery/file-formats" className={link}>File formats</Link></p>
      </div>
    </section>
  );
}

/** 12: privacy and responsible use. */
export function Privacy() {
  const links: [string, string][] = [["Privacy policy", "/legal/privacy"], ["Lawful use policy", "/legal/lawful-use"], ["GDPR", "/legal/gdpr"], ["CCPA", "/legal/ccpa"], ["CAN-SPAM", "/legal/can-spam"], ["Opt out of our data", "/opt-out"]];
  return (
    <section className="bg-sand-50 py-20 lg:py-24" id="privacy">
      <div className={wrap}>
        <Head title="Privacy and Responsible Use" text="We explain how we collect and use data, and anyone can ask to be removed. Buyers agree to use data lawfully in their own region. We make no blanket compliance guarantees." />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
