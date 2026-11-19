import Link from "next/link";
import type { PublicCard } from "@/lib/blog/posts";
import { AuthorAvatar } from "./avatar";

export const fmtDate = (d: Date | number) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Small author line used on cards: photo (or initials), name, date and reading time. */
export function CardMeta({ p, size = 28 }: { p: PublicCard; size?: number }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      {p.author && <AuthorAvatar photo={p.authorPhoto} name={p.author} size={size} />}
      <p className="min-w-0 leading-snug">
        {p.author && <span className="block truncate font-semibold text-forest-900">{p.author}</span>}
        <span className="block">{fmtDate(p.at)} · {p.readingMinutes} min read</span>
      </p>
    </div>
  );
}

export function PostCard({ p, priority = false }: { p: PublicCard; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/blog/${p.slug}`} tabIndex={-1} aria-hidden className="block overflow-hidden">
        {p.featuredImage ? (
          <img src={p.featuredImage} alt="" loading={priority ? "eager" : "lazy"} decoding="async" style={{ objectPosition: `${p.focalX}% ${p.focalY}%` }} className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : <div className="aspect-[16/9] w-full bg-gradient-to-br from-forest-100 to-sand-200" />}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {p.categoryName && p.categorySlug && <Link href={`/blog/category/${p.categorySlug}`} className="self-start text-xs font-bold text-forest-500 hover:underline">{p.categoryName}</Link>}
        <h3 className="mt-1.5 text-xl font-bold leading-snug text-forest-900"><Link href={`/blog/${p.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{p.title}</Link></h3>
        {p.excerpt && <p className="mt-2 line-clamp-3 text-sm">{p.excerpt}</p>}
        <div className="mt-auto pt-5"><CardMeta p={p} /></div>
      </div>
    </article>
  );
}
