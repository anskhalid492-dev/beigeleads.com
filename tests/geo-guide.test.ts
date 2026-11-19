import { describe, expect, it } from "vitest";
import { GUIDE_STARTERS } from "@/lib/blog/guide-starters";
import { headingsOf, linksOf, plainText } from "@/lib/blog/doc";
import { faqOf } from "@/lib/blog/faq";
import { mdToDoc } from "@/lib/blog/markdown";
import { getCategories } from "@/lib/catalog";
import { legalDocs } from "@/lib/legal/docs";

const G = GUIDE_STARTERS.find((g) => g.slug === "build-b2b-email-list-by-country-state-city")!;
const doc = mdToDoc(G.markdown);

describe("geography guide", () => {
  it("exists as a guide with SEO fields in range", () => {
    expect(G.kind).toBe("guide");
    expect(G.seoTitle.length).toBeLessThanOrEqual(60);
    expect(G.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(G.metaDescription.length).toBeLessThanOrEqual(160);
    expect(G.title).toBe("How to Build a Targeted B2B Email List by Country, State, and City");
  });
  it("is long enough, ends with an FAQ and has 6-8 questions", () => {
    const words = plainText(doc).split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(2200);
    expect(words).toBeLessThanOrEqual(3500);
    const h2 = headingsOf(doc).filter((h) => h.level === 2).map((h) => h.text);
    expect(h2[h2.length - 1]).toMatch(/Frequently Asked Questions/i);
    const faq = faqOf(doc);
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.length).toBeLessThanOrEqual(8);
  });
  it("only links to pages that exist", () => {
    const cats = getCategories().map((c) => `/lists/${c.slug}`);
    const known = new Set(["/lists", "/custom-list", "/sample", "/verification", "/data-sources", "/guides/b2b-lead-generation-guide", "/lists/dentists/united-states", ...cats, ...legalDocs.map((d) => `/legal/${d.slug}`)]);
    for (const l of linksOf(doc).filter((x) => x.startsWith("/"))) expect(known.has(l), l).toBe(true);
    expect(linksOf(doc)).toEqual(expect.arrayContaining(["/lists", "/custom-list", "/sample", "/lists/dentists"]));
  });
  it("makes no invented numbers or banned words", () => {
    const t = plainText(doc);
    expect(t).not.toMatch(/marketplace/i);
    expect(t).not.toMatch(/\d+%/);
    expect(t).not.toMatch(/\$\d/);
  });
});
