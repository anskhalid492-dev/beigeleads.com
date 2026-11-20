import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { fmtDate } from "@/components/blog/cards";
import { isIllustrative } from "@/lib/case-studies";
import type { PublicCard } from "@/lib/blog/posts";

const IMG = "aspect-[16/9] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

function Img({ p, priority = false }: { p: PublicCard; priority?: boolean }) {
  return p.featuredImage ? (
    // eslint-disable-next-line @next/next/no-img-element -- plain static images on Workers (no optimizer)
    <img src={p.featuredImage} alt={p.featuredAlt} width={1600} height={900} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" style={{ objectPosition: `${p.focalX}% ${p.focalY}%` }} className={IMG} />
  ) : <div className="aspect-[16/9] w-full bg-gradient-to-br from-forest-700 to-forest-900" />;
}

function Tags({ p, dark = false }: { p: PublicCard; dark?: boolean }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs font-bold">
      {isIllustrative(p.slug) && <span className={`rounded-full px-3 py-1 ${dark ? "bg-purple-100 text-forest-900" : "bg-purple-100 text-forest-900"}`}>Illustrative use case</span>}
      {p.categoryName && <span className={dark ? "text-forest-300" : "text-forest-500"}>{p.categoryName}</span>}
    </p>
  );
}

/** The one big story at the top: the cover fills the width and the title sits on it from md up. */
export function FeaturedStory({ p }: { p: PublicCard }) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] bg-forest-900">
      <Link href={`/case-studies/${p.slug}`} tabIndex={-1} aria-hidden className="block overflow-hidden"><Img p={p} priority /></Link>
      <div className="p-6 sm:p-8 md:absolute md:inset-x-0 md:bottom-0 md:bg-gradient-to-t md:from-forest-900 md:via-forest-900/85 md:to-transparent md:px-10 md:pb-10 md:pt-24">
        <div className="max-w-3xl space-y-3">
          <Tags p={p} dark />
          <h2 className="display text-4xl text-sand-50 sm:text-5xl lg:text-6xl"><Link href={`/case-studies/${p.slug}`} className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-purple-600">{p.title}</Link></h2>
          {p.excerpt && <p className="line-clamp-3 text-lg text-sand-200">{p.excerpt}</p>}
          <p className="flex items-center gap-4 pt-1 text-sm text-sand-200"><span>{fmtDate(p.at)} · {p.readingMinutes} min read</span><span className="inline-flex items-center gap-1 font-bold text-sand-50">Read the case study <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden /></span></p>
        </div>
      </div>
    </article>
  );
}

/** Asymmetric rows: image and text swap sides each row, so the list reads like a magazine contents page, not a card grid. */
export function StoryRow({ p, flip }: { p: PublicCard; flip: boolean }) {
  return (
    <article className="group grid items-center gap-6 md:grid-cols-12 md:gap-10">
      <Link href={`/case-studies/${p.slug}`} tabIndex={-1} aria-hidden className={`block overflow-hidden rounded-3xl md:col-span-7 ${flip ? "md:order-2" : ""}`}><Img p={p} /></Link>
      <div className={`space-y-3 md:col-span-5 ${flip ? "md:order-1" : ""}`}>
        <Tags p={p} />
        <h3 className="display text-3xl text-forest-900 sm:text-4xl"><Link href={`/case-studies/${p.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{p.title}</Link></h3>
        {p.excerpt && <p className="line-clamp-4">{p.excerpt}</p>}
        <p className="text-sm">{fmtDate(p.at)} · {p.readingMinutes} min read</p>
        <Link href={`/case-studies/${p.slug}`} className="inline-flex items-center gap-1.5 font-bold text-forest-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">Read the case study <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden /></Link>
      </div>
    </article>
  );
}
