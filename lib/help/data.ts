// Pure helpers over a loaded Help Center data set (from the database or the built-in code content).
import type { HelpArticle, HelpCategory } from "./types";

export type HelpData = { categories: HelpCategory[]; articles: HelpArticle[]; source: "database" | "code" };

export const articleId = (a: { category: string; slug: string }) => `${a.category}/${a.slug}`;
export const articleHref = (a: { category: string; slug: string }) => `/help/${a.category}/${a.slug}`;

export const getCategory = (d: HelpData, slug: string) => d.categories.find((c) => c.slug === slug);
export const getArticle = (d: HelpData, category: string, slug: string) => d.articles.find((a) => a.category === category && a.slug === slug);
export const articlesIn = (d: HelpData, category: string) => d.articles.filter((a) => a.category === category);
export const relatedOf = (d: HelpData, a: HelpArticle) => a.related.map((id) => d.articles.find((x) => articleId(x) === id)).filter((x): x is HelpArticle => !!x);
export const featuredArticles = (d: HelpData) => d.articles.filter((a) => (a.featured ?? 0) > 0).sort((a, b) => a.featured! - b.featured!);
export const commonArticles = (d: HelpData) => d.articles.filter((a) => (a.common ?? 0) > 0).sort((a, b) => a.common! - b.common!);

/** Groups in the order they first appear (articles are already sorted); articles without a group come last as "More". */
export function groupedArticles<T extends { group?: string }>(list: T[]): { title: string; items: T[] }[] {
  const out: { title: string; items: T[] }[] = [];
  const more: T[] = [];
  for (const a of list) {
    const g = (a.group ?? "").trim();
    if (!g) { more.push(a); continue; }
    const hit = out.find((x) => x.title === g);
    if (hit) hit.items.push(a); else out.push({ title: g, items: [a] });
  }
  if (more.length) out.push({ title: out.length ? "More" : "Articles", items: more });
  return out;
}
