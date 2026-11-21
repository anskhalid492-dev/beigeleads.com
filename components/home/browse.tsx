import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Flag, IndustryIcon } from "@/components/shared/db-icon";
import { listsHref } from "@/lib/shop";

type Cat = { slug: string; name: string; blurb: string };
type Place = { slug: string; code: string; name: string; cities: { slug: string; name: string }[] };

/**
 * Home: browse by industry and place. Industries are a ruled list (the long way to scan), places are a dark
 * panel grouped by country. Everything shown comes from the real catalog; nothing here states a count.
 */
export function BrowseSection({ categories, places }: { categories: Cat[]; places: Place[] }) {
  return (
    <section aria-labelledby="browse" className="border-y border-sand-200 bg-sand-100 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="browse" className="display max-w-2xl text-4xl text-forest-900 sm:text-6xl">Pick the trade. Then pick the place.</h2>
          <Link href="/lists" className="inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">All industries <ArrowRight className="size-4" aria-hidden /></Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="overflow-hidden rounded-[1.6rem] border border-sand-300 bg-white">
            <h3 className="border-b border-sand-200 px-6 py-4 text-sm font-bold text-forest-700">By industry</h3>
            <ul>
              {categories.map((c) => (
                <li key={c.slug} className="border-b border-sand-200 last:border-b-0">
                  <Link href={`/lists/${c.slug}`} className="group flex items-center gap-4 px-6 py-5 transition-colors hover:bg-forest-900 focus-visible:bg-forest-900 focus-visible:outline-none">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300 transition-colors group-hover:bg-forest-300 group-hover:text-forest-900 group-focus-visible:bg-forest-300 group-focus-visible:text-forest-900">
                      <IndustryIcon slug={c.slug} hint={c.name} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="display block text-3xl leading-none text-forest-900 transition-colors group-hover:text-sand-50 group-focus-visible:text-sand-50">{c.name}</span>
                      <span className="mt-1 block truncate text-sm transition-colors group-hover:text-sand-200 group-focus-visible:text-sand-200">{c.blurb}</span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-forest-500 transition-all group-hover:translate-x-1 group-hover:text-sand-50 group-focus-visible:text-sand-50" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-[1.6rem] bg-forest-900 p-6 text-sand-100 sm:p-7">
            <h3 className="text-sm font-bold text-sand-200">By place</h3>
            <div className="mt-4 space-y-6">
              {places.map((k) => (
                <div key={k.slug}>
                  <Link href={listsHref({ countries: [k.slug] })} className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                    <Flag code={k.code} className="h-5 w-7 rounded-[3px]" />
                    <span className="display text-3xl leading-none text-sand-50 group-hover:underline group-hover:underline-offset-4">{k.name}</span>
                  </Link>
                  {k.cities.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {k.cities.map((c) => (
                        <li key={c.slug}>
                          <Link href={listsHref({ countries: [k.slug], city: c.slug })} className="inline-block rounded-full border border-forest-500 px-3.5 py-1 text-sm font-medium text-sand-100 transition-colors hover:border-sand-50 hover:bg-sand-50 hover:text-forest-900">{c.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-auto pt-8 text-sm text-sand-200">
              Another industry or place? <Link href="/custom-list" className="font-semibold text-sand-50 underline underline-offset-4">We can source it for you</Link> or <Link href="/request-category" className="font-semibold text-sand-50 underline underline-offset-4">request a category</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
