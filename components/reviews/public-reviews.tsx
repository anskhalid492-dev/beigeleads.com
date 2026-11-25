import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { publicReviews } from "@/lib/followups/reviews";

/**
 * Real buyer reviews. Renders NOTHING until the admin has approved at least the configured minimum (default 3) for the scope,
 * so a page never shows a single review as "proof" and nothing is ever invented. No rating structured data is emitted.
 */
export async function PublicReviews({ slug, className = "" }: { slug?: string; className?: string }) {
  let r = null;
  try { r = await publicReviews(getCloudflareContext().env, slug); } catch { r = null; }
  if (!r || r.items.length === 0) return null;
  return (
    <section aria-labelledby="reviews-h" className={`mx-auto max-w-[1200px] px-4 py-12 sm:px-6 ${className}`}>
      <h2 id="reviews-h" className="display text-3xl text-forest-900 sm:text-4xl">What buyers say after delivery</h2>
      <p className="mt-2 text-sm text-forest-700">{r.count} approved review{r.count === 1 ? "" : "s"}{r.average ? `, average ${r.average} out of 5` : ""}. Each came from a buyer who received a list, and is shown as written. <Link className="underline" href="/legal/refund-replacement">Replacement policy</Link>.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {r.items.slice(0, 3).map((x, i) => (
          <li key={i} className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="font-semibold text-forest-900" aria-label={`${x.rating} out of 5`}>{"★".repeat(x.rating)}<span className="text-sand-300">{"★".repeat(5 - x.rating)}</span></p>
            <p className="mt-2 whitespace-pre-wrap text-forest-900">&ldquo;{x.comment}&rdquo;</p>
            <p className="mt-3 text-xs text-forest-500">{x.name} · {x.product}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
