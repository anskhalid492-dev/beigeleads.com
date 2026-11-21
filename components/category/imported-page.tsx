import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { Block } from "@/components/category/blocks";
import { ListCard } from "@/components/lists/list-card";
import type { Category } from "@/lib/catalog";
import type { ShopProduct } from "@/lib/shop";

const SHOWN = 48;
export const listsLabel = (name: string) => (/\blists?$/i.test(name.trim()) ? name.trim() : `${name.trim()} Lists`);

/** Category page for an imported industry (section 91). Says only what is known: the products, their places and packages are on each list page. */
export function ImportedCategoryPage({ c, products }: { c: Category; products: ShopProduct[] }) {
  const path = `/lists/${c.slug}`;
  const base = c.name.replace(/\s+lists?$/i, "");
  const label = listsLabel(c.name); // "General Targeted Lists", never "... Lists Lists"
  const countries = [...new Map(products.map((p) => [p.countrySlug, p.countryName])).entries()];
  const live = products.some((p) => p.status === "live");
  const faqs: [string, string][] = [
    [`What do the ${base.toLowerCase()} lists contain?`, "Open a list to see its masked sample and the details it includes. Sample files only ever contain masked data."],
    ["Can I preview a list before I pay?", "Yes. Every list page shows a masked sample, and you can request a free sample file by email."],
    ["How does one-time pricing work?", "You pay once per list, in crypto. No subscription, seats or credits. Packages and prices are shown on each list page."],
    ["How is the list delivered?", "By email, as a link to your file in CSV, Excel or TXT format. Delivery is mostly instant and in some cases takes up to 12 hours at most."],
    ["What if I need something that is not listed?", "Use the custom list builder and describe the prospects you want."],
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: c.name, href: path }]} />
      <section className="border-b border-sand-200 bg-sand-50 py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-5">
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] text-forest-900">{label}</h1>
          <p className="mt-4 max-w-[62ch] text-lg">Ready-made {base.toLowerCase()} lists. Open a list to see its masked sample, packages and price, then pay once and keep the file.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/lists?industry=${c.slug}`} className="inline-flex h-11 items-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700">{live ? "Compare in the catalog" : "See in the catalog"}</Link>
            <Link href={`/custom-list?category=${c.slug}`} className="inline-flex h-11 items-center rounded-full border border-forest-900 px-5 text-sm font-semibold text-forest-900 hover:bg-sand-100">Build a custom list</Link>
          </div>
        </div>
      </section>
      {countries.length > 1 && (
        <Block title={`${label} by Country`} tone="sand">
          <ul className="flex flex-wrap gap-2">{countries.map(([slug, name]) => <li key={slug}><Link href={`/lists?industry=${c.slug}&country=${slug}`} className="inline-flex rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 hover:border-forest-900">{name}</Link></li>)}</ul>
        </Block>
      )}
      <Block title={`Available ${base} Databases`}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0, SHOWN).map((p) => <ListCard key={p.slug} p={p} />)}</ul>
        {products.length > SHOWN && <p className="mt-5 text-sm"><Link className="font-semibold underline" href={`/lists?industry=${c.slug}`}>See all {base.toLowerCase()} lists in the catalog</Link></p>}
      </Block>
      <SolutionFaq name={label} items={faqs} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: label, description: `Ready-made ${base.toLowerCase()} lists with a masked sample on every list page.`, url: `https://beigeleads.com${path}` }} />
    </>
  );
}
