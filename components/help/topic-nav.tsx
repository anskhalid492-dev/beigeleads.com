import Link from "next/link";
import { CategoryIcon } from "@/components/help/icons";
import { articleHref, articlesIn, getCategory, groupedArticles, type HelpData } from "@/lib/help/data";

/** Left navigation of the article page: this topic's articles in groups, then the other topics. */
export function TopicNav({ data, category, current }: { data: HelpData; category: string; current?: string }) {
  const c = getCategory(data, category);
  if (!c) return null;
  const groups = groupedArticles(articlesIn(data, category));
  return (
    <nav aria-label="Help topics" className="text-sm">
      <Link href={`/help/${c.slug}`} className="flex items-center gap-2 font-bold text-forest-900 hover:underline">
        <span className="grid size-8 place-items-center rounded-lg bg-forest-100 text-forest-700"><CategoryIcon name={c.icon} className="size-4" /></span>{c.name}
      </Link>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 text-xs font-bold text-forest-500">{g.title}</p>
            <ul className="mt-1">
              {g.items.map((a) => (
                <li key={a.slug}>
                  <Link href={articleHref(a)} aria-current={a.slug === current ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 leading-snug ${a.slug === current ? "bg-forest-100 font-semibold text-forest-900" : "hover:bg-sand-100"}`}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 px-3 text-xs font-bold text-forest-500">Other topics</p>
      <ul className="mt-1">
        {data.categories.filter((x) => x.slug !== category).map((x) => <li key={x.slug}><Link href={`/help/${x.slug}`} className="block rounded-lg px-3 py-1.5 hover:bg-sand-100">{x.name}</Link></li>)}
      </ul>
    </nav>
  );
}
