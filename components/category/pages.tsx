import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SampleTable } from "@/components/shared/sample-table";
import { PlaceDirectory, type Place } from "@/components/geo/city-directory";
import { RelatedGuides } from "@/components/lists/related-guides";
import { SolutionFaq } from "@/components/solutions/sections";
import { TargetBuilder, TargetConsole, type Group } from "@/components/category/console";
import { Block, SalesHero, Steps, UseCases, Why, WHY_BEIGE } from "@/components/category/blocks";
import { DatabaseRow } from "@/components/category/parts";
import { CEO_CONTENT, FIELD_NOTES, STANDARD_FIELDS } from "@/lib/category-view";
import { formatUsd, getProduct, type Category } from "@/lib/catalog";
import { sampleSheets } from "@/lib/sample-data";
import type { ShopProduct } from "@/lib/shop";
import type { TaxChild, TaxGroup } from "@/lib/taxonomy";

const collection = (name: string, path: string, description: string) => ({ "@context": "https://schema.org", "@type": "CollectionPage", name, description, url: `https://beigeleads.com${path}` });
const REQUESTABLE = ["Contact name", "Job title"];
const SIZES = ["Small businesses", "Mid-size companies", "Large companies"];

const REQUEST_STEPS: [string, string][] = [
  ["Describe your prospects", "Pick industries, places and roles, then add anything else in your own words."],
  ["We review the request", "We check what can be sourced and verified, and tell you honestly if we cannot."],
  ["Get a sample and a quote", "Where we can source it, you see what you would receive before you pay."],
  ["Pay once, receive your list", "One payment in crypto, then your file by email. No subscription."],
];

const requestFaqs = (what: string, where: string): [string, string][] => [
  ["What data is included?", `Custom lists are scoped with you. Our ready-made business lists carry business name, address, city, country, phone, email and website. ${REQUESTABLE.join(" and ")} can be requested, subject to sourcing; we never promise a field we cannot source.`],
  ["Can I preview the contacts?", "Yes. Where a list can be sourced, you see a masked sample first. You can also request a free sample file by email."],
  ["How current is the data?", "Every list is re-verified every 60 days, and emails are checked with in-house SMTP tests."],
  [`Can I target specific cities or regions${where}?`, "Yes, name them in your request. We tell you whether we can source them."],
  ["How does one-time pricing work?", "You pay once per list, in crypto. No subscription, seats or credits. A custom request has no price until we have reviewed it."],
  ["How is the list delivered?", "By email, as a link to your file in CSV, Excel or TXT format. No account is needed."],
  [`What if I need a different set of prospects than ${what}?`, "Describe it in the custom list builder. Nothing is too niche to ask."],
];

/** Job-title page, unavailable: a custom request landing page (CEO prototype). */
export function RolePage({ group, child, industries }: { group: TaxGroup; child: TaxChild; industries: { slug: string; name: string }[] }) {
  const who = child.name.replace(/ Email Lists$/, "");
  const path = `/lists/${group.slug}/${child.slug}`;
  const roles = group.children.map((c) => c.name.replace(/ Email Lists$/, ""));
  const custom = `/custom-list?categoryText=${encodeURIComponent(who)}`;
  const groups: Group[] = [
    { key: "roles", title: "Roles", hint: "The people you want to reach.", options: roles },
    { key: "industries", title: "Industries", hint: "Where they work.", options: industries.map((i) => i.name) },
    { key: "places", title: "Countries and places", hint: "Type a country, state or city and press Add.", options: [], free: true },
    { key: "size", title: "Company size", hint: "A rough size. We confirm what can be filtered.", options: SIZES },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: group.name, href: `/lists/${group.slug}` }, { name: child.name, href: path }]} />
      <SalesHero tone="forest" eyebrow={`${who} contact databases`} h1="Reach the People Who Make the Decisions." sub={`Find ${who} contacts by industry, company size and location. We build the list around your audience and tell you what can be sourced before you pay.`} primary={{ label: `Request My ${who} List`, href: custom }} secondary={{ label: "See a sample", href: "/sample" }} points={["Target by role, industry and place", "Preview a masked sample", "Pay once, no subscription"]}>
        <TargetConsole mode="request" title="Shape your prospect list" industries={industries} placeName="" roles={roles.slice(0, 5)} fields={["Business name", "City", "Email"]} requestable={REQUESTABLE} status={{ live: false, text: `Custom request. No ready-made ${who} list is on sale.` }} cta={{ label: `Request My ${who} List` }} secondary={{ label: "See a sample", href: "/sample" }} />
      </SalesHero>
      <Block title="What You Can Target" lead="Choose segments, then send them as one request. Everything is subject to sourcing." tone="sand"><TargetBuilder groups={groups} placeName="" base="/custom-list" /></Block>
      <Block title="What's Inside the Data" lead="Ready-made business lists carry the fields below. Contact name and job title are not in them; for a role list we scope the fields with you.">
        <div className="grid gap-x-12 gap-y-3 md:grid-cols-2">{[...STANDARD_FIELDS, ...REQUESTABLE].map((f) => <p key={f} className="flex items-baseline justify-between gap-4 border-b border-sand-300 py-2"><span className="font-bold text-forest-900">{f}</span><span className="text-right text-sm">{REQUESTABLE.includes(f) ? "Can be requested, subject to sourcing" : FIELD_NOTES[f]}</span></p>)}</div>
      </Block>
      <Block title={`Who Uses ${who} Contact Data`} tone="sand"><UseCases items={CEO_CONTENT.uses} /></Block>
      <Block title="Why Buy From BeigeLeads"><Why items={WHY_BEIGE} /></Block>
      <Block title="How a Custom Request Works" tone="sand"><Steps items={REQUEST_STEPS} /></Block>
      <RelatedGuides terms={[child.name, "job title", "decision maker", "email list"]} />
      <SolutionFaq name={child.name} items={requestFaqs(who, "")} />
      <JsonLd data={collection(child.name, path, child.blurb)} />
    </>
  );
}

/** Industry page with a real list (Dentists prototype). Purchase actions appear only for live products. */
export function IndustryPage({ c, products, geo }: { c: Category; products: ShopProduct[]; geo: { name: string; regions: Place[]; cities: Place[] }[] }) {
  const main = products[0];
  const live = main?.status === "live";
  const sheet = sampleSheets[c.slug];
  const path = `/lists/${c.slug}`;
  const places = ["Nationwide (United States)", ...geo.flatMap((g) => g.regions.map((r) => r.name))];
  const full = main ? getProduct(main.slug) : undefined;
  const faqs: [string, string][] = [
    ["What data is included?", `Each record is one business: ${STANDARD_FIELDS.join(", ").toLowerCase()}. Some businesses do not publish every detail, so a cell can be empty.`],
    ["Can I preview the contacts?", "Yes. The list page shows a masked sample, and you can request a free sample file by email."],
    ["How current is the database?", "Lists are re-verified every 60 days and emails are checked with in-house SMTP tests."],
    [`Can I target specific cities?`, "Ready-made lists are national. Place pages show where we have recorded inventory, and a custom request can target a city."],
    ["How does one-time pricing work?", "You pay once per list, in crypto. No subscription, seats or credits."],
    ["How is the list delivered?", "By email, as a link to your file in CSV, Excel or TXT format. No account is needed."],
    ["What if I need custom prospects?", "Use the custom list builder and describe the prospects you want."],
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: c.name, href: path }]} />
      <SalesHero eyebrow={`${c.name} contact databases`} h1={`Reach the ${c.name} You Want to Sell To.`} sub={`${c.description} Preview a masked sample, pick a package and pay once.`} primary={{ label: live ? "View Packages" : "View List Details", href: main ? `/product/${main.slug}` : "/lists" }} secondary={{ label: "See a sample", href: main ? `/product/${main.slug}#sample` : "/sample" }} points={["Target by place", "Preview available data", "Pay once, no subscription"]}>
        {main && <TargetConsole mode="browse" title="Preview your list" industries={[{ slug: c.slug, name: c.name }]} industryLocked placeName="United States" places={places} fields={main.fields} status={{ live, text: live ? "Available to buy. Pick a package on the list page." : "Preview only. This list is not for sale yet; request a free sample." }} cta={{ label: live ? "View Packages" : "View List Details", href: `/product/${main.slug}${live ? "#pricing" : ""}` }} secondary={{ label: "Free sample", href: `/sample?category=${c.slug}` }} />}
      </SalesHero>
      {geo.some((g) => g.regions.length || g.cities.length) && (
        <Block title={`${c.name} by Place`} lead="Where we have recorded inventory." tone="sand">
          {geo.map((g) => (g.regions.length || g.cities.length) ? <div key={g.name} className="space-y-5">{g.regions.length > 0 && <PlaceDirectory places={g.regions} label={`Search ${g.name} states or regions`} empty="No state or region matches." />}{g.cities.length > 0 && <PlaceDirectory places={g.cities} label={`Search ${g.name} cities`} empty="No city matches." />}</div> : null)}
        </Block>
      )}
      <Block title={`Explore Available ${c.name} Databases`}>
        <div className="space-y-4">{products.map((p) => <DatabaseRow key={p.slug} p={p} />)}</div>
        {full && !full.placeholderData && <ul className="mt-5 flex flex-wrap gap-2">{full.packages.map((k) => <li key={k.name} className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900">{k.name}: {k.records.toLocaleString("en-US")} records, {formatUsd(k.priceUsdCents)}</li>)}</ul>}
        {full?.placeholderData && <p className="mt-4 text-sm">Package sizes and prices appear here once this list goes on sale.</p>}
      </Block>
      {sheet && <Block title="What's Inside the Data" lead="A masked example. Real files hold full contact details." tone="sand"><SampleTable rows={sheet.rows} /><ul className="mt-5 flex flex-wrap gap-2">{STANDARD_FIELDS.map((f) => <li key={f} className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900">{f}</li>)}</ul></Block>}
      <Block title={`Who Uses ${c.singular} Data`}><UseCases items={c.useCases.map((u) => [u.name, u.text] as const)} /></Block>
      <Block title="Why Buy From BeigeLeads" tone="sand"><Why items={WHY_BEIGE} /></Block>
      <Block title="How It Works"><Steps items={[["Choose your prospects", "Pick the list and the place."], ["Review the data", "Check the masked sample or request a free one."], ["Select your package", "Choose the size that fits."], ["Pay once, get your list", "Pay in crypto and receive your file by email."]]} /></Block>
      <RelatedGuides terms={[c.name, "email list"]} />
      <SolutionFaq name={`${c.name} Lists`} items={faqs} />
      <JsonLd data={collection(`${c.name} Email Lists`, path, c.description)} />
    </>
  );
}

/** Geographic page, unavailable: a custom request landing page (Germany prototype). Never shows other countries' inventory as local data. */
export function PlacePage({ group, child, country, industries }: { group: TaxGroup; child: TaxChild; country: { slug: string; name: string }; industries: { slug: string; name: string }[] }) {
  const path = `/lists/${group.slug}/${child.slug}/${country.slug}`;
  const k = country.name;
  const custom = `/custom-list?countryText=${encodeURIComponent(k)}&categoryText=${encodeURIComponent(`Business email list in ${k}`)}`;
  const groups: Group[] = [
    { key: "industries", title: "Industries", hint: "Which businesses you want to reach.", options: industries.map((i) => i.name) },
    { key: "places", title: "States, regions and cities", hint: `Type a place in ${k} and press Add.`, options: [], free: true },
    { key: "roles", title: "Job titles", hint: "Who at the business.", options: ["CEOs", "Founders", "Managing directors", "Marketing leaders", "Sales leaders", "HR managers"] },
    { key: "size", title: "Business size", hint: "A rough size. We confirm what can be filtered.", options: SIZES },
  ];
  const uses: [string, string][] = [
    ["B2B sales teams", `Build a prospect list for outreach in ${k} by industry and city.`],
    ["Marketing agencies", `Plan local campaigns for clients who sell into ${k}.`],
    ["Recruitment firms", `Find employers in a sector and region you place candidates in.`],
    ["Market research teams", `Reach businesses for surveys and interviews.`],
    ["Business development teams", `Map potential partners and distributors.`],
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: group.name, href: `/lists/${group.slug}` }, { name: child.name, href: `/lists/${group.slug}/${child.slug}` }, { name: k, href: path }]} />
      <SalesHero eyebrow={`${k} business contact databases`} h1={`Need Business Contacts in ${k}?`} sub={`Tell us the industries, cities and professional roles you want to reach. We review your requirements and tell you what can be sourced.`} primary={{ label: `Request My ${k} List`, href: custom }} secondary={{ label: "See a sample", href: "/sample" }} points={["Target by industry and location", "Preview a masked sample", "Pay once, no subscription"]}>
        <TargetConsole mode="request" title={`Shape your ${k} list`} industries={industries} placeName={k} fields={["Business name", "City", "Email"]} requestable={REQUESTABLE} status={{ live: false, text: `Custom request. No ready-made ${k} list is on sale yet.` }} cta={{ label: `Request My ${k} List` }} secondary={{ label: "See a sample", href: "/sample" }} />
      </SalesHero>
      <Block title="What You Can Target" lead="Pick segments and send them as one request. Everything is subject to sourcing; we only offer data we can lawfully source and verify." tone="sand"><TargetBuilder groups={groups} placeName={k} base="/custom-list" /></Block>
      <Block title="What's Inside the Data" lead={`Fields we can include in a custom list. We never promise a field we cannot source for ${k}.`}>
        <div className="grid gap-x-12 gap-y-3 md:grid-cols-2">{[...STANDARD_FIELDS, ...REQUESTABLE].map((f) => <p key={f} className="flex items-baseline justify-between gap-4 border-b border-sand-300 py-2"><span className="font-bold text-forest-900">{f}</span><span className="text-right text-sm">{REQUESTABLE.includes(f) ? "Can be requested, subject to sourcing" : FIELD_NOTES[f]}</span></p>)}</div>
      </Block>
      <Block title={`Who Uses ${k} Business Data`} tone="sand"><UseCases items={uses} /></Block>
      <Block title="Why Buy From BeigeLeads"><Why items={WHY_BEIGE} /></Block>
      <Block title="How a Custom Request Works" tone="sand"><Steps items={REQUEST_STEPS} /></Block>
      <RelatedGuides terms={[k, "country", "geographic", "email list"]} />
      <SolutionFaq name={`${k} Business Lists`} items={requestFaqs(k, ` in ${k}`)} />
      <JsonLd data={collection(`${k} Business Email Lists`, path, `Request a custom business contact list for ${k}.`)} />
    </>
  );
}
