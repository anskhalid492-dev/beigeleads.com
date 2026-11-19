import { describe, expect, it } from "vitest";
import { articleId, articlesIn, commonQuestions, faqsOf, getArticle, helpArticles, helpCategories, plainText, readingMinutes, startingPoints } from "@/lib/help";
import { HELP_GROUPS, groupedArticles } from "@/lib/help/groups";

describe("help structure", () => {
  it("every group slug exists and every article lands in exactly one group", () => {
    for (const c of helpCategories) {
      const list = [...articlesIn(c.slug)];
      for (const g of HELP_GROUPS[c.slug] ?? []) for (const s of g.slugs) expect(list.some((a) => a.slug === s), `${c.slug}/${s}`).toBe(true);
      const grouped = groupedArticles(c.slug, list).flatMap((g) => g.items.map((a) => a.slug));
      expect(grouped.sort()).toEqual(list.map((a) => a.slug).sort());
      expect(new Set(grouped).size).toBe(grouped.length);
    }
  });
  it("editorial picks and related links resolve", () => {
    for (const id of [...startingPoints, ...commonQuestions]) { const [c, s] = id.split("/"); expect(getArticle(c, s), id).toBeTruthy(); }
    const ids = new Set(helpArticles.map(articleId));
    for (const a of helpArticles) for (const r of a.related) expect(ids.has(r), `${articleId(a)} -> ${r}`).toBe(true);
  });
  it("reading time, plain text and FAQs include the new block types", () => {
    const a = getArticle("getting-started", "what-is-beigeleads")!;
    expect(faqsOf(a).length).toBe(3);
    expect(plainText(a)).toContain("masked sample");
    expect(readingMinutes(a)).toBeGreaterThanOrEqual(1);
  });
});
