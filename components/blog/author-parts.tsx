import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LINK_KEYS, LINK_LABELS, type AuthorLinks } from "@/lib/blog/authors";
import { AuthorAvatar } from "./avatar";
import { fmtDate } from "./cards";

/** The slice of a profile an article needs. Never includes an email. */
export type ArticleAuthor = { slug: string; name: string; title: string; photo: string | null; shortBio: string; links: AuthorLinks };

/** Hides anything that looks like an email: old posts defaulted the byline to the editor's login. */
export const publicName = (s: string) => (s.includes("@") ? "" : s.trim());

export function AuthorLinksList({ links, className = "" }: { links: AuthorLinks; className?: string }) {
  const items = LINK_KEYS.filter((k) => links[k]);
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Author links">
      {items.map((k) => (
        <li key={k}><a href={links[k]} target="_blank" rel="noopener noreferrer me" className="inline-block rounded-full border border-sand-300 px-3 py-1 text-sm font-semibold text-forest-900 hover:bg-sand-100">{LINK_LABELS[k]}</a></li>
      ))}
    </ul>
  );
}

export function Byline({ author, plainName, date }: { author: ArticleAuthor | null; plainName: string; date: Date }) {
  const name = author?.name ?? publicName(plainName);
  return (
    <div className="mt-5 flex items-center gap-3 border-y border-sand-200 py-4" data-testid="byline">
      {name ? <AuthorAvatar photo={author?.photo} name={name} size={52} /> : <img src="/brand/svg/beigeleads-symbol-light.svg" alt="" width={52} height={52} className="size-[52px] rounded-xl" />}
      <div className="min-w-0 text-sm leading-snug">
        <p>{name ? "Written by " : "By "}{author ? <Link href={`/blog/author/${author.slug}`} rel="author" className="text-base font-bold text-forest-900 hover:underline">{name}</Link> : <span className="text-base font-bold text-forest-900">{name || "BeigeLeads"}</span>}</p>
        <p className="mt-0.5">{author?.title ? `${author.title} · ` : ""}<time dateTime={date.toISOString()}>{fmtDate(date)}</time></p>
      </div>
    </div>
  );
}

export function AboutAuthor({ author }: { author: ArticleAuthor }) {
  return (
    <aside aria-labelledby="about-author" className="mt-10 rounded-2xl border border-sand-200 bg-sand-100 p-6" data-testid="about-author">
      <h2 id="about-author" className="text-sm font-bold text-forest-500">About the author</h2>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <AuthorAvatar photo={author.photo} name={author.name} size={80} />
        <div className="min-w-0">
          <p className="text-lg font-bold text-forest-900">{author.name}</p>
          {author.title && <p className="text-sm">{author.title}</p>}
          {author.shortBio && <p className="mt-2 text-sm">{author.shortBio}</p>}
          <AuthorLinksList links={author.links} className="mt-3" />
          <Button asChild size="sm" className="mt-4"><Link href={`/blog/author/${author.slug}`}>View all articles by {author.name}</Link></Button>
        </div>
      </div>
    </aside>
  );
}
