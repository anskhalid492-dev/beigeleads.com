import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Paged } from "@/components/shared/paged";
import { JsonLd } from "@/components/shared/json-ld";
import { SampleTable } from "@/components/shared/sample-table";
import { PlaceSection, type PlaceItem } from "@/components/category/place-section";
import { SolutionFaq } from "@/components/solutions/sections";
import { TargetConsole } from "@/components/category/console";
import { AboutUses, Block, SalesHero, Steps, Why, WHY_BEIGE } from "@/components/category/blocks";
import { DatabaseRow } from "@/components/category/parts";
import { industryView, STANDARD_FIELDS } from "@/lib/category-view";
import { formatUsd, getProduct, type Category } from "@/lib/catalog";
import { sheetRows } from "@/lib/real-sheet";
import type { ShopProduct } from "@/lib/shop";

const collection = (name: string, path: string, description: string) => ({ "@context": "https://schema.org", "@type": "CollectionPage", name, description, url: `https://beigeleads.com${path}` });

/** Industry page with a real list (Dentists prototype). Purchase actions appear only for live products. */
export function IndustryPage({ c, products, geo }: { c: Category; products: ShopProduct[]; geo: { name: string; regions: PlaceItem[]; cities: PlaceItem[] }[] }) {
  const main = products[0];
  const live = main?.status === "live";
  const sheet = sheetRows(products.map((p) => p.slug));
  const path = `/lists/${c.slug}`;
  const places = ["Nationwide (United States)", ...geo.flatMap((g) => g.regions.map((r) => r.name))];
  const full = main ? getProduct(main.slug) : undefined;
  const view = industryView(c);
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
      <SalesHero eyebrow={`${c.name} contact databases`} h1={`Reach the ${c.name} You Want to Sell To.`} sub={`${c.description} Preview a masked sample, pick a package and pay once.`} primary={{ label: live ? "View Packages" : "View List Details", href: main ? `/lists/${main.slug}` : "/lists" }} secondary={{ label: "See a sample", href: main ? `/lists/${main.slug}#sample` : "/sample" }} points={["Target by place", "Preview available data", "Pay once, no subscription"]}>
        {main && <TargetConsole mode="browse" title="Preview your list" industries={[{ slug: c.slug, name: c.name }]} industryLocked placeName="United States" places={places} fields={main.fields} status={{ live, text: live ? "Available to buy. Pick a package on the list page." : "Preview only. This list is not for sale yet; request a free sample." }} cta={{ label: live ? "View Packages" : "View List Details", href: `/lists/${main.slug}${live ? "#pricing" : ""}` }} secondary={{ label: "Free sample", href: `/sample?category=${c.slug}` }} />}
      </SalesHero>
      {geo.flatMap((g) => {
        const many = geo.filter((x) => x.regions.length || x.cities.length).length > 1;
        const where = many ? ` in ${g.name}` : "";
        return [
          g.regions.length > 0 && <Block key={`${g.name}-r`} title="" tone="sand"><PlaceSection title={`${c.name} Email Lists by States${where}`} lead="Pick a state or region to see the recorded inventory there." places={g.regions} noun="states" /></Block>,
          g.cities.length > 0 && <Block key={`${g.name}-c`} title=""><PlaceSection title={`${c.name} Email Lists by Cities${where}`} lead="Pick a city to see the recorded inventory there." places={g.cities} noun="cities" /></Block>,
        ];
      })}
      <Block title={`Explore Available ${c.name} Databases`}>
        <Paged className="space-y-3" items={products.map((p) => <DatabaseRow key={p.slug} p={p} />)} />
        {full && !full.placeholderData && <ul className="mt-5 flex flex-wrap gap-2">{full.packages.map((k) => <li key={k.name} className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900">{k.name}: {k.records.toLocaleString("en-US")} records, {formatUsd(k.priceUsdCents)}</li>)}</ul>}
      </Block>
      {sheet && <Block title="What's Inside the Data" lead="Real rows from a list, with emails and phone numbers masked. Full files hold complete contact details." tone="sand"><SampleTable rows={sheet} /></Block>}
      <AboutUses title={`About ${c.name} Email Lists`} usesTitle={`Who Uses ${c.singular} Data`} paragraphs={view.whatIs} uses={c.useCases.map((u) => [u.name, u.text] as const)} />
      <Block title="How to Choose"><Why items={view.choose} /></Block>
      <Block title="Why Buy From BeigeLeads" tone="sand"><Why items={WHY_BEIGE} /></Block>
      <Block title="How It Works"><Steps items={[["Choose your prospects", "Pick the list and the place."], ["Review the data", "Check the masked sample or request a free one."], ["Select your package", "Choose the size that fits."], ["Pay once, get your list", "Pay in crypto and receive your file by email."]]} /></Block>
      <SolutionFaq name={`${c.name} Lists`} items={faqs} />
      <JsonLd data={collection(`${c.name} Email Lists`, path, c.description)} />
    </>
  );
}
