import { describe, expect, it } from "vitest";
import { analyzeSeo, onPageScore, suggestMeta, suggestSeoTitle, suggestSlug } from "@/lib/blog/seo";

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Building a B2B email list starts with a clear customer profile. " + "More words here to pad the opening paragraph for the check. ".repeat(3) }] }] };
const base = { title: "How to build a B2B email list", slug: "how-to-build-a-b2b-email-list", seoTitle: "", metaDescription: "", focusKeyword: "b2b email list", excerpt: "", doc, targets: [] };

describe("blog SEO helpers", () => {
  it("scores 0-100 from the checks and rewards fixing warnings", () => {
    const before = analyzeSeo({ ...base, featuredImage: "/media/x.webp", featuredAlt: "" });
    expect(before.some((c) => c.text.includes("alt text to your featured image"))).toBe(true);
    const after = analyzeSeo({ ...base, featuredImage: "/media/x.webp", featuredAlt: "Funnel diagram" });
    expect(onPageScore(after)).toBeGreaterThan(onPageScore(before));
    expect(onPageScore([])).toBe(0);
    expect(onPageScore(after)).toBeLessThanOrEqual(100);
  });
  it("flags a bad canonical and missing secondary keywords", () => {
    const c = analyzeSeo({ ...base, canonicalUrl: "not a url", secondaryKeywords: "zebra crossing" });
    expect(c.some((x) => x.level === "warn" && x.text.includes("canonical"))).toBe(true);
    expect(c.some((x) => x.text.includes("zebra crossing"))).toBe(true);
  });
  it("suggests editable titles, descriptions and slugs from the article only", () => {
    expect(suggestSeoTitle("A".repeat(10) + " " + "word ".repeat(30)).length).toBeLessThanOrEqual(60);
    expect(suggestSlug("How to Build a Targeted B2B Email List for Cold Outreach")).toBe("build-targeted-b2b-email-list-cold-outreach");
    const m = suggestMeta("", doc);
    expect(m.length).toBeGreaterThan(40);
    expect(m.length).toBeLessThanOrEqual(161);
    expect(suggestMeta("", { type: "doc", content: [] })).toBe("");
  });
});
