import Link from "next/link";
import { BENCH_CATEGORIES, benchAlt, benchImage, type BenchRecord } from "@/lib/benchmarks";

/** Blog-style card: featured image, category, title and the first sentence of the summary. */
export function BenchCard({ b, priority = false }: { b: BenchRecord; priority?: boolean }) {
  const cat = BENCH_CATEGORIES.find((c) => c.slug === b.category)?.name;
  const first = b.report?.summary.split(". ")[0].replace(/\.$/, "");
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white transition-shadow hover:shadow-lg">
      <Link href={`/benchmarks/${b.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600" aria-label={b.title}>
        <img src={benchImage(b.slug)} alt={benchAlt(b)} width={1600} height={900} loading={priority ? "eager" : "lazy"} decoding="async" className="aspect-[16/9] w-full object-cover" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {cat ? <p className="text-sm font-bold text-forest-500">{cat}</p> : null}
        <h3 className="display mt-1 text-[1.5rem] leading-[1.05] text-forest-900"><Link href={`/benchmarks/${b.slug}`} className="hover:underline">{b.title}</Link></h3>
        {first ? <p className="mt-2 text-sm leading-relaxed text-forest-700">{first}.</p> : null}
        <p className="mt-auto pt-4 text-sm font-semibold text-forest-900">Read the benchmark <span aria-hidden>&rarr;</span></p>
      </div>
    </article>
  );
}
