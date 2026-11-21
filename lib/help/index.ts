import { helpCategories } from "./categories";
import { articlesA } from "./articles-a";
import { articlesB } from "./articles-b";
import { articlesC } from "./articles-c";
import { newA } from "./new/a";
import { newB } from "./new/b";
import { newC } from "./new/c";
import { withExtraFaqs } from "./faqs";
import type { Block, HelpArticle } from "./types";

export { helpCategories };
export type { Block, HelpArticle };

/** Date the article text was last reviewed. Update it when an answer changes. */
export const HELP_UPDATED = "2026-11-21";

/** Nov 2026 expansion: articles that mention details the application cannot confirm are imported as DRAFTS with the reason below. */
export const HELP_REVIEW_NOTES: Record<string, string> = {
  "custom-list/how-custom-database-pricing-and-delivery-are-determined": "Custom pricing rules and turnaround are set by staff case by case; confirm the wording about quote drivers.",
  "custom-list/what-happens-if-custom-requirements-change": "No automatic change process exists in the application; confirm how staff handle changes after a quote or payment.",
  "account-support/how-beigeleads-protects-customer-downloads": "The delivery file host and its access controls are managed outside the application; confirm what can be said about them.",
  "account-support/how-customer-information-is-used-and-protected": "Summary of the privacy policy; confirm retention periods and sharing wording against the final legal text.",
  "account-support/how-refunds-cancellations-and-disputes-are-handled": "The policy text does not set separate refund rules for verification or DFY orders; confirm what to promise.",
  "dfy-outbound/what-is-the-optional-infrastructure-ownership-fee": "The ownership transfer agreement text is not written yet; confirm scope and what may be promised.",
};
const NEW: readonly HelpArticle[] = [...newA, ...newB, ...newC].map((a) => (HELP_REVIEW_NOTES[`${a.category}/${a.slug}`] ? { ...a, status: "draft" as const } : a));
export const helpArticles: readonly HelpArticle[] = [...articlesA, ...articlesB, ...articlesC, ...NEW].map(withExtraFaqs);

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

const blockText = (b: Block): string => {
  switch (b[0]) {
    case "ul": case "ol": return b[1].join(" ");
    case "callout": return b[2];
    case "table": return [...b[1], ...b[2].flat()].join(" ");
    case "img": return b[2];
    case "faq": return b[1].map(([q, a]) => `${q} ${a}`).join(" ");
    default: return b[1];
  }
};
export const plainText = (a: HelpArticle) => a.body.map(blockText).join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
/** About 220 words a minute, never less than one minute. */
export const readingMinutes = (a: HelpArticle) => Math.max(1, Math.ceil(plainText(a).split(/\s+/).filter(Boolean).length / 220));
export const faqsOf = (a: HelpArticle) => a.body.flatMap((b) => (b[0] === "faq" ? b[1] : []));

/** Common questions on the Help Center home: an editorial pick. No search or read data exists yet, so none is claimed. */
export const commonQuestions = [
  "pricing/no-subscription",
  "getting-started/do-i-need-an-account",
  "payments/accepted-payment-methods",
  "delivery/file-formats",
  "data-quality/emails-become-outdated",
  "custom-list/how-quotes-work",
  "payments/refunds-and-replacements",
  "privacy-compliance/data-removal",
];
