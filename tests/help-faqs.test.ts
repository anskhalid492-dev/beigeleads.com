import { describe, expect, it } from "vitest";
import { helpArticles, faqsOf, articleId } from "@/lib/help";
import { MIN_FAQS } from "@/lib/help/faqs";

describe("help FAQs", () => {
  it("every article has at least five FAQs", () => {
    const short = helpArticles.filter((a) => faqsOf(a).length < MIN_FAQS).map(articleId);
    expect(short).toEqual([]);
  });
  it("no article repeats a question and has one faq block", () => {
    for (const a of helpArticles) {
      const qs = faqsOf(a).map(([q]) => q.toLowerCase());
      expect(new Set(qs).size, articleId(a)).toBe(qs.length);
      expect(a.body.filter((b) => b[0] === "faq").length, articleId(a)).toBe(1);
    }
  });
  it("FAQ text avoids the word audience and invented figures", () => {
    for (const a of helpArticles) for (const [q, ans] of faqsOf(a)) {
      const t = `${q} ${ans}`;
      expect(/audience/i.test(t), `${articleId(a)}: ${q}`).toBe(false);
      expect(/\$\s?\d/.test(t), `${articleId(a)}: ${q}`).toBe(false);
    }
  });
});
