import type { HelpArticle } from "./types";
import { faqsA } from "./faqs-a";
import { faqsB } from "./faqs-b";

export type FaqPairs = readonly (readonly [string, string])[];

/** Minimum number of FAQs every Help article ends with. */
export const MIN_FAQS = 5;
/** Review date stamped on articles that received extra FAQs, so "Apply reviewed updates" replaces older copies in the database. */
const FAQ_REVIEWED = "2026-11-21";

const EXTRA: Record<string, FaqPairs> = { ...faqsA, ...faqsB };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/**
 * Adds the extra FAQs (./faqs-a.ts, ./faqs-b.ts) to an article's own FAQ block, skipping questions it already has.
 * The result has one faq block at the end of the article. Pure and idempotent.
 */
export function withExtraFaqs(a: HelpArticle): HelpArticle {
  const id = `${a.category}/${a.slug}`;
  const extra = EXTRA[id] ?? [];
  const body = [...a.body];
  const have: [string, string][] = [];
  const kept = body.filter((b) => {
    if (b[0] !== "faq") return true;
    have.push(...b[1].map(([q, ans]) => [q, ans] as [string, string]));
    return false;
  });
  const seen = new Set(have.map(([q]) => norm(q)));
  for (const [q, ans] of extra) {
    if (seen.has(norm(q))) continue;
    seen.add(norm(q));
    have.push([q, ans]);
  }
  if (have.length === 0) return a;
  // Keep the faq block where the article's first one was, otherwise at the end.
  const firstFaq = a.body.findIndex((b) => b[0] === "faq");
  const faq = ["faq", have] as const;
  const upd = extra.length && (a.updated ?? "") < FAQ_REVIEWED ? FAQ_REVIEWED : a.updated;
  if (firstFaq < 0) return { ...a, updated: upd, body: [...kept, faq] };
  const before = a.body.slice(0, firstFaq).filter((b) => b[0] !== "faq");
  const after = a.body.slice(firstFaq).filter((b) => b[0] !== "faq");
  return { ...a, updated: upd, body: [...before, faq, ...after] };
}

export const hasExtraFaqs = (id: string) => id in EXTRA;
