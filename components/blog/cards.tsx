import Link from "next/link";
import type { PublicCard } from "@/lib/blog/posts";

export const fmtDate = (d: Date | number) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export function PostCard({ p, priority = false }: { p: PublicCard; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/blog/${p.slug}`} className="block focus-visible:outline-2 focus-visible:outline-purple-600" aria-label={p.title}>
        {p.featuredImage ? (
           
          <img src={p.featuredImage} alt={p.featuredAlt} loading={priority ? "eager" : "lazy"} decoding="async" className="aspect-[16/9] w-full object-cover" />
        ) : <div className="aspect-[16/9] w-full bg-gradient-to-br from-forest-100 to-sand-200" aria-hidden />}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-forest-500">{p.categoryName ?? "Article"} · {p.readingMinutes} min read</p>
        <h3 className="mt-2 text-xl font-bold leading-snug text-forest-900"><Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link></h3>
        {p.excerpt && <p className="mt-2 line-clamp-3 text-sm">{p.excerpt}</p>}
        <p className="mt-auto pt-4 text-xs">{fmtDate(p.at)}{p.author ? ` · ${p.author}` : ""}</p>
      </div>
    </article>
  );
}
