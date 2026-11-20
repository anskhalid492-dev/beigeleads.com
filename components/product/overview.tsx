import Link from "next/link";
import type { Category, Country, Product } from "@/lib/catalog";
import { productOverview } from "@/lib/product-seo";

const link = "font-semibold text-forest-900 underline underline-offset-4";

/** Keyword-rich overview: real sentences about what the list is, who it is for and how it is made. */
export function ProductOverview({ product, category, country }: { product: Product; category: Category; country: Country }) {
  const o = productOverview(product, category, country);
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <h2 className="display text-5xl text-forest-900 sm:text-6xl lg:sticky lg:top-24 lg:self-start lg:text-7xl">{o.heading}</h2>
        <div className="max-w-2xl space-y-5 text-lg leading-relaxed">
          {o.paragraphs.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p>
            Our team collects data from public listings, company websites, registries and directories, checks emails with SMTP checks and re-verifies every list every 60 days. Read how we{" "}
            <Link href="/verification" className={link}>verify data</Link> and{" "}
            <Link href="/data-sources" className={link}>where it comes from</Link>.
          </p>
          <p>
            Looking for a different place or size? Browse all{" "}
            <Link href={`/lists/${category.slug}`} className={link}>{category.name.toLowerCase()} lists</Link> or{" "}
            <Link href="/custom-list" className={link}>build a custom {o.s} list</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
