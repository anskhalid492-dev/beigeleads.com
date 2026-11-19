import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { relatedGuides } from "@/lib/lists-guides";

/** Guides and articles that match the page topic. Renders nothing when none are published. */
export async function RelatedGuides({ terms, heading = "Guides for this list" }: { terms: string[]; heading?: string }) {
  const { env } = getCloudflareContext();
  const guides = await relatedGuides(env, terms, 3);
  if (guides.length === 0) return null;
  return (
    <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4">
      <h2 className="display text-3xl text-forest-900 sm:text-4xl">{heading}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {guides.map((g) => (
          <li key={`${g.kind}-${g.slug}`}><Link href={`/${g.kind === "guide" ? "guides" : "blog"}/${g.slug}`} className="flex h-full flex-col rounded-[1.3rem] border border-sand-300 bg-white p-5 hover:border-forest-500">
            <span className="text-xs font-bold text-forest-500">{g.kind === "guide" ? "Guide" : "Article"}</span>
            <span className="display mt-1 text-2xl leading-tight text-forest-900">{g.title}</span>
            <span className="mt-2 line-clamp-3 text-sm">{g.excerpt}</span>
          </Link></li>
        ))}
      </ul>
    </div></section>
  );
}
