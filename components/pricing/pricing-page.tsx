import Link from "next/link";
import { ArrowRight, Briefcase, Check, Download, FileSpreadsheet, ListChecks, MapPin, Package, Search, Users, Eye, BadgeDollarSign, type LucideIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { DbBadge } from "@/components/shared/db-icon";
import { SolutionFaq } from "@/components/solutions/sections";
import { formatUsd, getCategory, getCountry, getProducts, startingPriceCents, type Product } from "@/lib/catalog";
import { BUY_STEPS, PRICE_FACTORS, PRICING_FAQS } from "@/lib/pricing-content";
import { SITE_URL } from "@/lib/site";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-6xl";
const link = "font-semibold text-forest-900 underline underline-offset-4";
const icons: Record<string, LucideIcon> = { users: Users, briefcase: Briefcase, map: MapPin, list: ListChecks, package: Package, search: Search };

/** Only lists that are really on sale with real prices. Placeholder or draft products never appear. */
export const purchasable = () => getProducts().filter((p) => p.status === "live" && !p.placeholderData && p.packages.length > 0);

function Hero() {
  const gone = ["Monthly fees", "Credits", "Seat licenses"];
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand-100 to-sand-50">
      <Breadcrumbs wide items={[{ name: "Pricing", href: "/pricing" }]} />
      <div className={`${wrap} grid gap-12 pb-16 pt-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-20 lg:pb-24`}>
        <div className="hero-in">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-500">Simple, transparent pricing</p>
          <h1 className="display mt-4 text-6xl text-forest-900 sm:text-7xl xl:text-[6.25rem]">Pay Once. Own the List.</h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed">
            No subscriptions. No credits. No recurring fees. Find the contacts you need, choose your database, and make a one-time purchase.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lists" className="inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700">Explore Databases</Link>
            <Link href="/custom-list" className="inline-flex h-12 items-center rounded-full border border-forest-900/25 bg-white px-7 font-semibold text-forest-900 transition-colors hover:border-purple-600 hover:text-purple-700">Build My List</Link>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[0.95rem] font-semibold text-forest-900">
            {[[BadgeDollarSign, "One-Time Payment"], [Eye, "Preview Before Purchase"], [Download, "Downloadable Data"]].map(([I, t]) => {
              const Icon = I as LucideIcon;
              return <li key={t as string} className="flex items-center gap-2"><Icon className="size-5 text-forest-500" aria-hidden />{t as string}</li>;
            })}
          </ul>
        </div>
        <div aria-hidden className="hero-in hidden select-none lg:block" style={{ animationDelay: "150ms" }}>
          <div className="rounded-[2rem] border border-sand-300 bg-sand-50 p-10">
            {gone.map((g, i) => (
              <p key={g} className="relative display mb-2 w-fit text-5xl leading-[1.15] text-forest-700/70">
                {g}
                <span className="strike-line absolute left-0 top-1/2 h-[3px] w-full rounded bg-purple-600" style={{ ["--d" as string]: `${500 + i * 260}ms` }} />
              </p>
            ))}
            <p className="display mt-8 text-7xl text-forest-900">Once.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p }: { p: Product }) {
  const c = getCategory(p.categorySlug);
  const k = getCountry(p.countrySlug);
  const start = startingPriceCents(p);
  if (!c || !k || start === null) return null;
  return (
    <li>
      <Link href={`/product/${p.slug}#pricing`} className="group flex h-full flex-col rounded-3xl border border-sand-300 bg-sand-50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-forest-900 hover:shadow-[0_24px_50px_-28px_rgba(15,42,29,0.55)]">
        <div className="flex items-center gap-3">
          <DbBadge category={c.slug} country={k.code} size="md" />
          <p className="text-sm text-forest-500">{c.name} · {k.name}</p>
        </div>
        <h3 className="display mt-5 text-4xl text-forest-900">{p.name}</h3>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-sand-200 pt-5">
          <div><dt className="text-xs text-forest-500">Contacts</dt><dd className="font-semibold text-forest-900">{p.recordCount?.toLocaleString("en-US") ?? "Not counted"}</dd></div>
          <div><dt className="text-xs text-forest-500">Starting at</dt><dd className="font-semibold text-forest-900">{formatUsd(start)}</dd></div>
        </dl>
        <p className="mt-4 text-sm"><span className="font-semibold text-forest-900">Packages:</span> {p.packages.map((x) => x.records.toLocaleString("en-US")).join(", ")} records</p>
        <p className="mt-2 text-sm"><span className="font-semibold text-forest-900">Fields:</span> {p.fields.join(", ")}</p>
        <p className="mt-2 flex items-center gap-2 text-sm"><Check className="size-4 text-forest-500" aria-hidden />Masked sample available</p>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold text-forest-900">View Pricing &amp; Packages <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
      </Link>
    </li>
  );
}

function Shop({ items }: { items: Product[] }) {
  return (
    <section id="databases" className="scroll-mt-20 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={h2}>Find Your List. See Your Price.</h2>
        <p className="mt-4 max-w-2xl text-lg">Every price below comes from the list&rsquo;s own product page, so what you see here is what you pay at checkout.</p>
        {items.length ? (
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
        ) : (
          <div className="mt-12 grid gap-8 rounded-[2rem] border border-dashed border-sand-300 bg-sand-100 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h3 className="display text-3xl text-forest-900 sm:text-4xl">Prices appear here when a list goes on sale.</h3>
              <p className="mt-3 max-w-xl">We only show real prices, never estimates. Browse the lists we cover, check a masked sample, or describe the list you need.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/lists" className="inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700">Browse Lists</Link>
              <Link href="/custom-list" className="inline-flex h-12 items-center rounded-full border border-forest-900/25 bg-white px-7 font-semibold text-forest-900 transition-colors hover:border-purple-600 hover:text-purple-700">Custom List</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Factors() {
  return (
    <section className="border-y border-sand-200 bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16`}>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className={h2}>The Right Data. The Right Price.</h2>
          <p className="mt-5 text-lg">These are the things that can affect what a database costs. They explain why prices differ between lists. They do not mean every factor changes every price.</p>
        </div>
        <ul className="divide-y divide-sand-300 border-y border-sand-300">
          {PRICE_FACTORS.map((f) => {
            const I = icons[f.icon];
            return (
              <li key={f.t} className="flex gap-5 py-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-sand-300 bg-sand-50"><I className="size-5 text-forest-500" aria-hidden /></span>
                <div><h3 className="text-xl font-bold text-forest-900">{f.t}</h3><p className="mt-1">{f.d}</p></div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={h2}>How buying works</h2>
        <p className="mt-4 max-w-2xl text-lg">Four steps from search to download. No account, no subscription.</p>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-forest-500/40 md:block" />
          {BUY_STEPS.map((s, i) => (
            <li key={s.t} className="relative">
              <span className="relative grid size-12 place-items-center rounded-full bg-forest-900 font-bold text-forest-300">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display mt-5 text-3xl text-forest-900">{s.t}</h3>
              <p className="mt-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Contrast() {
  const ours = ["One-time list purchases", "No monthly platform subscription", "No credit consumption", "Product-level pricing", "Downloadable purchased datasets"];
  const theirs = ["May charge recurring access fees", "May use credit-based exports", "May impose ongoing usage limits"];
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24">
      <div className={wrap}>
        <h2 className="display max-w-3xl text-4xl text-sand-50 sm:text-6xl">One purchase, not a plan.</h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl bg-sand-50 p-8 text-forest-700 sm:p-10">
            <h3 className="display text-4xl text-forest-900">BeigeLeads</h3>
            <ul className="mt-6 space-y-4 text-lg">{ours.map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden />{t}</li>)}</ul>
          </div>
          <div className="rounded-3xl border border-white/15 p-8 sm:p-10">
            <h3 className="display text-4xl text-sand-50">Subscription platforms</h3>
            <ul className="mt-6 space-y-4 text-lg">{theirs.map((t) => <li key={t} className="flex gap-3"><span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-sand-300" />{t}</li>)}</ul>
            <p className="mt-6 text-sm text-sand-300">Models differ by vendor. Check each provider&rsquo;s own pricing page.</p>
          </div>
        </div>
        <p className="mt-8 max-w-3xl text-sm text-sand-300">
          Buying a list does not give you unlimited redistribution rights, and no list stays accurate forever. Contacts change, so use the data within the{" "}
          <Link href="/legal/lawful-use" className="text-sand-50 underline underline-offset-4">lawful use policy</Link>.
        </p>
      </div>
    </section>
  );
}

function Custom() {
  return (
    <section className="py-20 lg:py-24">
      <div className={wrap}>
        <div className="grid gap-8 rounded-[2rem] bg-forest-100/70 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className={h2}>Need Something More Specific?</h2>
            <p className="mt-4 max-w-xl text-lg">Tell us your target industry, location, and audience requirements. We&rsquo;ll review your request and provide a custom quote.</p>
          </div>
          <div className="lg:justify-self-end">
            <Link href="/custom-list" className="inline-flex h-12 items-center gap-2 rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700">Build My Custom List <FileSpreadsheet className="size-4" aria-hidden /></Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm">Also see <Link href="/how-it-works" className={link}>how it works</Link>, <Link href="/verification" className={link}>how we verify data</Link> and the <Link href="/legal/refund-replacement" className={link}>Refund &amp; Returns policy</Link>.</p>
      </div>
    </section>
  );
}

export function PricingPage() {
  const items = purchasable();
  const lowFor = (p: Product) => (startingPriceCents(p) ?? 0) / 100;
  return (
    <>
      <Hero />
      <Shop items={items} />
      <Factors />
      <Steps />
      <Contrast />
      <Custom />
      <SolutionFaq name="BeigeLeads Pricing" items={PRICING_FAQS} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "One-Time Business Email List Pricing", url: `${SITE_URL}/pricing`, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
      {items.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "ItemList",
          itemListElement: items.map((p, i) => ({
            "@type": "ListItem", position: i + 1,
            item: { "@type": "Product", name: p.name, url: `${SITE_URL}/product/${p.slug}`, offers: { "@type": "Offer", priceCurrency: "USD", price: lowFor(p).toFixed(2), availability: "https://schema.org/InStock", url: `${SITE_URL}/product/${p.slug}` } },
          })),
        }} />
      )}
    </>
  );
}
