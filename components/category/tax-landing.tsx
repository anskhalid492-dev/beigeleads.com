import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Flag } from "@/components/shared/db-icon";
import { SampleTable } from "@/components/shared/sample-table";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { SolutionFaq } from "@/components/solutions/sections";
import { Block, Steps, UseCases, Why, WHY_BEIGE } from "@/components/category/blocks";
import { DatabaseRow, StatusPanel, wrap } from "@/components/category/parts";
import { fallbackCopy, GROUP_COPY, SHOP_STEPS } from "@/lib/category-copy";
import { realSamples, sheetRows } from "@/lib/real-sheet";
import { COMPLIANCE_NOTE, STATUS_LABEL, childHref, industryChildren, nodeFaqs, type TaxChild, type TaxGroup } from "@/lib/taxonomy";
import type { ShopProduct } from "@/lib/shop";

type Props = { group: TaxGroup; child?: TaxChild; country?: { slug: string; name: string }; tax: TaxGroup[]; products: ShopProduct[]; industries: { slug: string; name: string }[] };

const cta = "inline-flex h-12 items-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const ghost = "inline-flex h-12 items-center rounded-full border border-forest-900 px-6 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50";

const chip = (s: "available" | "upcoming") => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s === "available" ? "bg-forest-100 text-forest-900" : "bg-purple-100 text-forest-900"}`}>{STATUS_LABEL[s]}</span>
);

/** Country page for a product: the flat shopping page for countries with a full-country product, else the industry place page. */
function countryHref(p: ShopProduct, all: ShopProduct[]) {
  const hasFull = all.some((x) => x.countrySlug === p.countrySlug && x.scope === "country" && x.categorySlug === "business");
  return hasFull ? `/lists/${p.countrySlug}-business-email-lists` : `/lists/${p.categorySlug}/${p.countrySlug}`;
}

/** One shopping landing template for list-type groups (/lists/<group>), subcategories and country views. No package prices here: they live on product pages. */
export function TaxLanding({ group, child, country, tax, products: allProducts, industries }: Props) {
  const node = child ?? group;
  const status = node.status;
  const compliance = child?.compliance ?? group.compliance;
  const copy = GROUP_COPY[group.slug] ?? fallbackCopy(group.name);
  const mapped = node.productSlugs ?? [];
  const pool = mapped.length ? allProducts.filter((p) => mapped.includes(p.slug)) : allProducts;
  const products = country ? pool.filter((p) => p.countrySlug === country.slug) : pool;
  const base = `/lists/${group.slug}`;
  const path = `${base}${child ? `/${child.slug}` : ""}${country ? `/${country.slug}` : ""}`;
  const title = country ? `${child?.name ?? group.name} in ${country.name}` : node.name;
  const paragraphs = (node.content ?? "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const kids = group.slug === "industry-databases" ? industryChildren(industries, tax) : group.children;
  const live = products.filter((p) => p.status === "live").length > 0;
  const custom = `/custom-list?categoryText=${encodeURIComponent(title)}`;
  const crumbs = [{ name: "Lists", href: "/lists" }, { name: group.name, href: base }, ...(child ? [{ name: child.name, href: `${base}/${child.slug}` }] : []), ...(country ? [{ name: country.name, href: path }] : [])];

  const slugs = products.map((p) => p.slug);
  const rows = (realSamples(slugs)?.rows ?? []).slice(0, 5); // real, masked rows only
  const sheet = sheetRows(slugs);
  const countries = [...new Map(products.map((p) => [p.countrySlug, p])).values()];
  const inds = [...new Map(products.filter((p) => p.scope !== "city" && p.categorySlug !== "business").map((p) => [p.categorySlug, p])).values()];
  const cities = products.filter((p) => p.scope === "city");
  const others = tax.filter((g) => g.slug !== group.slug && g.published !== false && g.menuVisible !== false);
  const primary = products.length ? { label: "Browse ready-made databases", href: "#databases" } : { label: "Browse all ready-made lists", href: "/lists#databases" };
  const faqs = nodeFaqs(title, status, compliance);

  return (
    <>
      <Breadcrumbs items={crumbs} />

      <section className={`${wrap} pb-4 pt-2`}>
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-sand-300 bg-sand-100 p-6 sm:p-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-12 lg:p-12">
          <div>
            <p className="flex flex-wrap items-center gap-2.5 text-sm font-bold text-forest-500">
              <span className="grid size-8 place-items-center rounded-lg bg-forest-900 text-forest-300"><TaxIconSvg name={group.icon} className="size-4" /></span>
              {group.name}{chip(status)}
              {country && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-forest-900">View for {country.name}</span>}
            </p>
            <h1 className="display cat-in mt-3 text-[2.9rem] leading-[0.95] text-forest-900 sm:text-[4.2rem]">{title}</h1>
            <p className="display mt-3 text-[1.5rem] leading-tight text-forest-700">{copy.headline}</p>
            <p className="mt-3 max-w-[52ch] text-lg">{child ? child.blurb : group.blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={primary.href} className={cta}>{primary.label}</Link>
              <Link href="/sample" className={ghost}>Request a free sample</Link>
            </div>
            <ul className="mt-6 space-y-2">{["Preview a masked sample first", "Pay once, no subscription", "CSV, Excel or TXT by email"].map((x) => <li key={x} className="flex items-center gap-2.5 font-semibold text-forest-900"><span className="grid size-5 place-items-center rounded-full bg-forest-100"><Check className="size-3" aria-hidden /></span>{x}</li>)}</ul>
          </div>
          {rows.length > 0 && <div className="overflow-hidden rounded-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_70px_-30px_rgba(15,42,29,0.7)]" aria-label="Masked sample preview">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><span className="truncate font-mono text-xs text-sand-300">{products[0]?.slug ?? "ready-made-list"}</span><span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-forest-900">Masked sample</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[24rem] text-left text-[0.8rem]"><thead><tr className="text-forest-300">{["Business", "City", "Email"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => <tr key={r.business} className="border-t border-white/10 text-sand-100"><td className="whitespace-nowrap px-4 py-2.5 font-medium text-sand-50">{r.business}</td><td className="whitespace-nowrap px-4 py-2.5">{r.city}</td><td className="whitespace-nowrap px-4 py-2.5 font-mono">{r.email}</td></tr>)}</tbody></table></div>
            <p className="border-t border-white/10 bg-black/20 px-4 py-2.5 text-xs text-sand-300">Real rows with emails and phone numbers masked. Real files hold full details.</p>
          </div>}
        </div>
      </section>

      {compliance && (
        <section className={`${wrap} pt-8`}><div role="note" className="flex gap-3 rounded-2xl border border-sand-300 bg-white p-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest-500" aria-hidden />
          <div><p className="font-bold text-forest-900">{COMPLIANCE_NOTE[compliance].title}</p><p className="mt-1 text-sm">{COMPLIANCE_NOTE[compliance].text}</p></div>
        </div></section>
      )}

      <section id="databases" className="scroll-mt-28 py-12 sm:py-14"><div className={wrap}>
        {products.length > 0 ? (
          <>
            <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">{status === "upcoming" ? "Ready-Made Databases You Can Buy Today" : `${node.name}: Ready-Made Databases`}</h2>
            <p className="mt-3 max-w-[60ch]">{status === "upcoming" ? `${title} is not on sale yet. These are the real ready-made business databases available now.` : "Each database has its own page with a masked sample, the fields it includes and packages."}{!live && " Some are previews that are not for sale yet."}</p>
            <div className="mt-8 space-y-4">{products.map((p) => <DatabaseRow key={p.slug} p={p} />)}</div>
          </>
        ) : (
          <StatusPanel title={country ? `No ${title.toLowerCase()} database is recorded yet` : `${title} is not on sale yet`} text={country ? `We sell national lists and no inventory is recorded for ${country.name} in this category yet.` : "No ready-made database exists for this category today, so nothing here can be bought. Browse the lists we do have, or tell us what you need."}>
            <div className="mt-5 flex flex-wrap gap-3"><Link href="/lists#databases" className={cta}>Browse ready-made lists</Link><Link href={custom} className={ghost}>Ask for a custom list</Link></div>
          </StatusPanel>
        )}
      </div></section>

      {(countries.length > 0 || inds.length > 0 || cities.length > 0) && (
        <section className="border-y border-sand-200 bg-sand-100 py-12 sm:py-14"><div className={wrap}>
          <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">Narrow It Down</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {countries.length > 0 && <div><h3 className="font-bold text-forest-900">By country</h3><ul className="mt-3 flex flex-wrap gap-2">{countries.map((p) => <li key={p.countrySlug}><Link href={countryHref(p, allProducts)} className="inline-flex items-center gap-2 rounded-full border border-forest-900 bg-white px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><Flag code={p.countryCode} />{p.countryName}</Link></li>)}</ul></div>}
            {cities.length > 0 && <div><h3 className="font-bold text-forest-900">By city</h3><ul className="mt-3 flex flex-wrap gap-2">{cities.map((p) => <li key={p.slug}><Link href={`/lists/${p.slug}`} className="inline-flex rounded-full border border-forest-900 bg-white px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{p.name.replace(/ Business Email List$/, "")}</Link></li>)}</ul></div>}
            {inds.length > 0 && <div><h3 className="font-bold text-forest-900">By industry</h3><ul className="mt-3 flex flex-wrap gap-2">{inds.map((p) => <li key={p.categorySlug}><Link href={`/lists/${p.categorySlug}`} className="inline-flex rounded-full border border-forest-900 bg-white px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{p.categoryName}</Link></li>)}</ul></div>}
          </div>
        </div></section>
      )}

      {!child && kids.length > 0 && (
        <Block title={`In ${group.name}`} lead="Open a category to see what it covers and what you can buy under it.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kids.map((c) => (
            <li key={c.slug}><Link href={childHref(group, c)} className="group flex h-full flex-col rounded-2xl border border-sand-300 bg-white p-5 transition-colors hover:border-forest-900">
              <span className="flex items-center justify-between gap-2"><span className="display text-xl text-forest-900">{c.name}</span>{chip(c.status)}</span>
              <span className="mt-2 text-sm">{c.short}</span>
              <span className="mt-4 text-sm font-semibold text-forest-900 underline decoration-purple-600 decoration-2 underline-offset-4 group-hover:decoration-forest-900">Open category</span>
            </Link></li>
          ))}</ul>
        </Block>
      )}

      {sheet && <Block title="What's Inside the Data" lead="Real rows from a list, with emails and phone numbers masked. Full files hold complete contact details." tone="sand"><SampleTable rows={sheet} /></Block>}

      <Block title={`About ${title}`}>
        <div className="max-w-[68ch] space-y-4 text-[1.05rem] leading-relaxed">
          {copy.whatIs.map((x, i) => <p key={i}>{x}</p>)}
          {paragraphs.map((x, i) => <p key={`c${i}`}>{x}</p>)}
          {country && <p>This is a view of the category for {country.name}. Ready-made lists are national unless a place page says otherwise.</p>}
        </div>
      </Block>

      <Block title={`Who Uses ${node.name}`} tone="sand"><UseCases items={copy.uses} /></Block>
      <Block title="How to Choose"><Why items={copy.choose} /></Block>
      <Block title="Why Buy From BeigeLeads" tone="sand"><Why items={WHY_BEIGE} /></Block>
      <Block title="How It Works"><Steps items={SHOP_STEPS} /></Block>

      {child && (
        <Block title={`More in ${group.name}`} tone="sand">
          <ul className="flex flex-wrap gap-2">{kids.filter((c) => c.slug !== child.slug).map((c) => <li key={c.slug}><Link href={childHref(group, c)} className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-1.5 text-sm font-semibold text-forest-900 hover:border-forest-900">{c.name}</Link></li>)}</ul>
        </Block>
      )}

      {others.length > 0 && (
        <Block title="Explore Other List Types" tone={child ? undefined : "sand"}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{others.map((g) => <li key={g.slug} className="min-w-0"><Link href={`/lists/${g.slug}`} className="flex items-center gap-3 rounded-2xl border border-sand-300 bg-white p-4 hover:border-forest-900"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-900 text-forest-300"><TaxIconSvg name={g.icon} className="size-4" /></span><span className="min-w-0"><span className="block font-bold text-forest-900">{g.menuName || g.name}</span><span className="block truncate text-sm">{g.short}</span></span></Link></li>)}</ul>
        </Block>
      )}

      <SolutionFaq name={title} items={faqs} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description: child ? child.blurb : group.blurb, url: `https://beigeleads.com${path}`, ...(products.length ? { mainEntity: { "@type": "ItemList", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `https://beigeleads.com/lists/${p.slug}`, name: p.name })) } } : {}) }} />
    </>
  );
}
