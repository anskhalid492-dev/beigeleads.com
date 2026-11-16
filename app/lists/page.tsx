import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CategoryIndex } from "@/components/lists/category-index";
import { getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All list categories",
  description: "Browse business contact list categories. Pick a category, check the sample, pay once.",
  alternates: { canonical: "/lists" },
};

export default function ListsPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }]} />
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">All lists</h1>
        <p className="mt-4 max-w-xl">
          More categories are added over time.{" "}
          <Link href="/request-category" className="font-semibold underline underline-offset-4">
            Can’t find yours? Ask for it.
          </Link>
        </p>
        <div className="mt-10">
          <CategoryIndex categories={getCategories()} />
        </div>
      </section>
    </>
  );
}
