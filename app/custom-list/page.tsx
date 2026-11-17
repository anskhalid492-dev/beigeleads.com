import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomListBuilder } from "@/components/custom-list/builder";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FIELDS, getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Custom list builder",
  description: "Tell us which businesses, where and how many. We check whether we can build the list and reply by email.",
  robots: { index: false, follow: true },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CustomListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams;
  const initial = {
    q: one(sp.q).slice(0, 300),
    category: one(sp.category).slice(0, 80),
    categoryText: one(sp.categoryText).slice(0, 120),
    quantity: one(sp.quantity).replace(/[^\d]/g, "").slice(0, 9),
    country: one(sp.country).slice(0, 40),
    region: one(sp.region).slice(0, 120),
  };
  return (
    <>
      <Breadcrumbs items={[{ name: "Custom list", href: "/custom-list" }]} />
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">Build a custom list</h1>
        <p className="mt-4 max-w-2xl text-lg">
          Cannot find the list you need? Describe it. We check whether we can source it and reply by email with what is possible. If you came from a search, we filled in what we understood. Check it and correct anything.
        </p>
        <div className="mt-10">
          <Suspense>
            <CustomListBuilder categories={getCategories().map((c) => ({ slug: c.slug, name: c.name }))} fields={FIELDS} initial={initial} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
