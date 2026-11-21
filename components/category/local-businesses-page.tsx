import Link from "next/link";
import { Building2, MapPin, ShieldCheck, Mail, FileDown, RefreshCw } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { SampleTable } from "@/components/shared/sample-table";
import { Block, FinalCta, WHY_BEIGE, Why } from "@/components/category/blocks";
import { wrap } from "@/components/category/parts";
import { ListCard } from "@/components/lists/list-card";
import { Flag } from "@/components/shared/db-icon";
import { classifyLocal, LOCAL_NAME, LOCAL_SLUG } from "@/lib/import/local-business";
import { sheetRows } from "@/lib/real-sheet";
import type { ShopProduct } from "@/lib/shop";

export const LOCAL_PATH = `/lists/${LOCAL_SLUG}`;
export const LOCAL_TITLE = "Local Businesses Database | Local Business Contact Lists";
export const LOCAL_DESC = "Local business contact databases by industry and location. See a masked sample first, then pay once and download the file in CSV, Excel or TXT.";

const FAQS: [string, string][] = [
  ["What is in the Local Businesses Database?", "It groups ready-made lists that target local establishments and location-based service businesses, such as restaurants, salons, clinics and trades. Open a list to see its fields, masked sample, packages and price."],
  ["Can I see a sample before I buy?", "Yes. Every list page shows a masked sample, and you can request a free sample file by email."],
  ["How do I find businesses in my area?", "Use Browse by Location on this page to see which countries and regions have a ready-made list, or open a list and check its coverage."],
  ["Is it a subscription?", "No. You pay once per list, in crypto, and keep the file. There are no seats, credits or monthly fees."],
  ["How is the file delivered?", "By email, as a link to your file in CSV, Excel or TXT format. Delivery is mostly instant and in some cases takes up to 12 hours at most."],
  ["What if a list for my niche is missing?", "Send a custom list request and describe the businesses and places you want. We tell you what we can source."],
];

const place = (p: ShopProduct) => (p.scope === "city" ? p.title.replace(/^Business contacts in /, "") : p.region || p.countryName);

/** Landing page of the Local Businesses Database category (section 111). Built only from the products really moved into it. */
export function LocalBusinessesPage({ products }: { products: ShopProduct[] }) {
  const has = products.length > 0;
  const withIndustry = products.map((p) => ({ p, industry: classifyLocal({ name: p.name, categoryName: p.categoryName, channel: p.channel ?? "", countryName: p.countryName, region: p.region }).industry || "Local services" }));
  const industries = [...withIndustry.reduce((m, x) => m.set(x.industry, (m.get(x.industry) ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const countries = [...new Map(products.map((p) => [p.countrySlug, { name: p.countryName, code: p.countryCode }])).entries()];
  const regions = [...new Map(products.filter((p) => p.region || p.scope === "city").map((p) => [`${p.countrySlug}/${place(p)}`, { name: place(p), country: p.countryName, code: p.countryCode, slug: p.slug }])).values()].slice(0, 24);
  const sheet = sheetRows(products.map((p) => p.slug));
  const first = products[0];
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: LOCAL_NAME, href: LOCAL_PATH }]} />
      <section className={`${wrap} pb-4 pt-2`}>
        <div className="relative overflow-hidden rounded-[2rem] bg-forest-900 p-7 text-sand-100 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[22rem] rounded-full bg-purple-600/25 blur-3xl" />
          <h1 className="display cat-in relative max-w-[16ch] text-[2.9rem] leading-[0.95] text-sand-50 sm:text-[4.4rem]">The Ultimate Local Businesses Database</h1>
          <p className="relative mt-4 max-w-[52ch] text-lg text-sand-200">Explore local business contact databases by industry and location.</p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Link href="#databases" className="inline-flex h-12 items-center rounded-full bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">Explore Databases</Link>
            <Link href="#industries" className="inline-flex h-12 items-center rounded-full border border-sand-300/50 px-6 font-semibold text-sand-50 hover:bg-forest-700">Browse Industries</Link>
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-sm font-semibold text-forest-300"><ShieldCheck className="size-4" aria-hidden />Masked sample on every list page.</p>
        </div>
      </section>

      {!has && (
        <Block title="Local business lists are being organised">
          <p className="max-w-[60ch]">No ready-made local business list is filed here yet. Browse every ready-made list, or tell us which local businesses and places you need.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/lists" className="inline-flex h-11 items-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700">Browse all lists</Link>
            <Link href="/custom-list?categoryText=Local%20businesses" className="inline-flex h-11 items-center rounded-full border border-forest-900 px-5 text-sm font-semibold text-forest-900 hover:bg-sand-100">Build a custom list</Link>
          </div>
        </Block>
      )}

      {has && (
        <Block title="Database Preview" lead="Real rows from a list, with emails and phone numbers masked. Full files hold complete contact details." tone="sand">
          {sheet ? <SampleTable rows={sheet} /> : (
            <div className="rounded-2xl border border-sand-300 bg-white p-6">
              <p className="font-semibold text-forest-900">Request a free sample</p>
              <p className="mt-1 max-w-[56ch]">Sample rows for these lists are sent by email, with contact details masked.</p>
              <Link href={`/sample?product=${first.slug}`} className="mt-4 inline-flex h-11 items-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700">Request a free sample</Link>
            </div>
          )}
        </Block>
      )}

      {has && (
        <section id="industries" className="scroll-mt-24 py-12 sm:py-14"><div className={wrap}>
          <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">Browse by Industry</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map(([name]) => (
              <li key={name}><Link href={`#databases`} className="flex items-center gap-3 rounded-2xl border border-sand-300 bg-white p-4 font-semibold text-forest-900 transition hover:border-forest-900 motion-reduce:transition-none"><span className="grid size-9 place-items-center rounded-lg bg-forest-900 text-forest-300"><Building2 className="size-4" aria-hidden /></span>{name}</Link></li>
            ))}
          </ul>
        </div></section>
      )}

      {has && (
        <Block title="Browse by Location" tone="sand">
          <ul className="flex flex-wrap gap-2">
            {countries.map(([slug, c]) => <li key={slug}><Link href={`/lists?industry=${LOCAL_SLUG}&country=${slug}`} className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 hover:border-forest-900"><Flag code={c.code} className="h-3 w-[18px]" />{c.name}</Link></li>)}
          </ul>
          {regions.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{regions.map((r) => <li key={r.slug}><Link href={`/lists/${r.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-forest-900 ring-1 ring-sand-300 hover:ring-forest-900"><MapPin className="size-3.5 text-forest-500" aria-hidden />{r.name}</Link></li>)}</ul>}
        </Block>
      )}

      {has && (
        <section id="databases" className="scroll-mt-24 py-12 sm:py-14"><div className={wrap}>
          <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">Available Local Business Databases</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ListCard key={p.slug} p={p} />)}</ul>
        </div></section>
      )}

      <Block title="Why Choose BeigeLeads" tone="sand">
        <Why items={WHY_BEIGE.slice(0, 4)} />
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {([[Mail, "Checked with in-house SMTP tests"], [RefreshCw, "Re-verified every 60 days"], [FileDown, "CSV, Excel or TXT, delivered by email"]] as const).map(([Icon, t]) => <li key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-forest-900 ring-1 ring-sand-300"><Icon className="size-4 text-forest-500" aria-hidden />{t}</li>)}
        </ul>
      </Block>

      <SolutionFaq name="Local Businesses Database" items={FAQS} />
      <FinalCta title="Explore Local Business Databases" text="Pick a list, check its masked sample, and pay once." cta={{ label: "Explore Local Business Databases", href: has ? "#databases" : "/lists" }} secondary={{ label: "Build a custom list", href: "/custom-list?categoryText=Local%20businesses" }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: LOCAL_NAME, description: LOCAL_DESC, url: `https://beigeleads.com${LOCAL_PATH}` }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    </>
  );
}
