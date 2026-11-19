import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/lists/list-card";
import { RelatedGuides } from "@/components/lists/related-guides";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { COMPLIANCE_NOTE, STATUS_LABEL, childHref, industryChildren, nodeFaqs, type TaxChild, type TaxGroup } from "@/lib/taxonomy";
import type { ShopProduct } from "@/lib/shop";

const badge = (s: "available" | "upcoming") => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s === "available" ? "bg-forest-100 text-forest-900" : "bg-purple-100 text-forest-900"}`}>{STATUS_LABEL[s]}</span>
);

type Props = { group: TaxGroup; child?: TaxChild; country?: { slug: string; name: string }; products: ShopProduct[]; industries: { slug: string; name: string }[] };

/** One template for a list-type group (/lists/<group>), a subcategory and a subcategory scoped to a country. */
export function TaxonomyPage({ group, child, country, products, industries }: Props) {
  const node = child ?? group;
  const status = node.status;
  const compliance = child?.compliance ?? group.compliance;
  const kids = group.slug === "industry-databases" ? industryChildren(industries) : group.children;
  const base = `/lists/${group.slug}`;
  const crumbs = [{ name: "Lists", href: "/lists" }, { name: group.name, href: base }, ...(child ? [{ name: child.name, href: `${base}/${child.slug}` }] : []), ...(country ? [{ name: country.name, href: `${base}/${child!.slug}/${country.slug}` }] : [])];
  const title = country ? `${child!.name} in ${country.name}` : node.name;
  const custom = `/custom-list?categoryText=${encodeURIComponent(title)}`;
  const geoLinks = group.slug === "geographic-databases" || child?.slug === "geographic-email-lists"
    ? products.map((p) => ({ key: p.slug, name: `${p.categoryName} in ${p.countryName}`, href: `/lists/${p.categorySlug}/${p.countrySlug}` }))
    : [];
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><TaxIconSvg name={group.icon} className="size-7" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-3">{badge(status)}{country && <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-bold text-forest-900">View for {country.name}</span>}</div>
            <h1 className="display mt-2 text-5xl text-forest-900 sm:text-7xl">{title}</h1>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-lg">{child ? child.blurb : group.blurb}</p>
        {status === "upcoming" && <p className="mt-3 max-w-3xl font-semibold text-forest-900">This category is not on sale yet. Nothing here can be bought; you can ask for a custom list.</p>}
        {country && <p className="mt-3 max-w-3xl">This is a view of the category for {country.name}. We sell national lists, and no inventory is recorded for this combination yet.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {status === "available" && <Button asChild size="lg"><Link href="/lists#databases">Browse ready-made lists</Link></Button>}
          <Button asChild size="lg" variant={status === "available" ? "secondary" : "primary"}><Link href={custom}>Build my list</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/sample">Request a free sample</Link></Button>
        </div>
      </section>

      {compliance && (
        <section className="mx-auto max-w-6xl px-4 pb-10"><div role="note" className="rounded-2xl border border-sand-300 bg-sand-100 p-5">
          <p className="font-bold text-forest-900">{COMPLIANCE_NOTE[compliance].title}</p>
          <p className="mt-1 text-sm">{COMPLIANCE_NOTE[compliance].text}</p>
        </div></section>
      )}

      {status === "available" && products.length > 0 && !country && (
        <section className="border-t border-sand-200 bg-sand-100 py-12"><div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl text-forest-900 sm:text-4xl">Ready-made lists</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ListCard key={p.slug} p={p} />)}</ul>
          {geoLinks.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">{geoLinks.map((g) => <li key={g.key}><Link href={g.href} className="inline-flex rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{g.name}</Link></li>)}</ul>
          )}
        </div></section>
      )}

      {!child && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="display text-3xl text-forest-900 sm:text-4xl">In {group.name}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kids.map((c) => (
              <li key={c.slug}><Link href={childHref(group, c)} className="flex h-full flex-col rounded-2xl border border-sand-300 bg-white p-5 transition hover:border-forest-900">
                <span className="flex items-center justify-between gap-2"><span className="display text-xl text-forest-900">{c.name}</span>{badge(c.status)}</span>
                <span className="mt-2 text-sm">{c.short}</span>
              </Link></li>
            ))}
          </ul>
        </section>
      )}
      {child && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="display text-3xl text-forest-900 sm:text-4xl">More in {group.name}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">{kids.filter((c) => c.slug !== child.slug).map((c) => <li key={c.slug}><Link href={childHref(group, c)} className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-1.5 text-sm font-semibold text-forest-900 hover:border-forest-900">{c.name}</Link></li>)}</ul>
        </section>
      )}

      <RelatedGuides terms={[node.name, group.name, "email list"]} />
      <Faq heading={`${title}: questions`} items={nodeFaqs(title, status, compliance)} />
    </>
  );
}
