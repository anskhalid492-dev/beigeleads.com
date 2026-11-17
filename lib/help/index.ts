import { helpCategories } from "./categories";
import { articlesA } from "./articles-a";
import { articlesB } from "./articles-b";
import { articlesC } from "./articles-c";
import type { Block, HelpArticle } from "./types";

export { helpCategories };
export type { Block, HelpArticle };

/** Date the article text was last reviewed. Update it when an answer changes. */
export const HELP_UPDATED = "2026-11-17";

export const helpArticles: readonly HelpArticle[] = [...articlesA, ...articlesB, ...articlesC];

export const articleId = (a: HelpArticle) => `${a.category}/${a.slug}`;
export const articleHref = (a: HelpArticle) => `/help/${a.category}/${a.slug}`;
export const getCategory = (slug: string) => helpCategories.find((c) => c.slug === slug);
export const getArticle = (category: string, slug: string) => helpArticles.find((a) => a.category === category && a.slug === slug);
export const articlesIn = (category: string) => helpArticles.filter((a) => a.category === category);
export const relatedOf = (a: HelpArticle) => a.related.map((id) => helpArticles.find((x) => articleId(x) === id)).filter((x): x is HelpArticle => !!x);

/** "Helpful starting points": editorial picks. No popularity data exists, so none is claimed. */
export const startingPoints = [
  "getting-started/how-beigeleads-works",
  "getting-started/preview-data-before-purchase",
  "pricing/no-subscription",
  "delivery/how-you-receive-your-list",
  "data-quality/email-verification",
  "custom-list/request-a-custom-list",
];

export const plainText = (a: HelpArticle) =>
  a.body.map((b) => (b[0] === "ul" || b[0] === "ol" ? b[1].join(" ") : b[1])).join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
