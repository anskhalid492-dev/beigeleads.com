import { describe, expect, it } from "vitest";
import { COMPLIANCE_NOTE, TAXONOMY, childHref, getChild, getGroup, industryChildren, nodeFaqs, taxonomyPaths } from "@/lib/taxonomy";
import { getCategories } from "@/lib/catalog";

describe("list-type taxonomy", () => {
  it("has the seven groups with unique slugs that never collide with catalog industries", () => {
    expect(TAXONOMY.map((g) => g.slug)).toEqual(["email-lists", "phone-number-lists", "whatsapp-number-lists", "job-title-lists", "job-function-lists", "industry-databases", "geographic-databases"]);
    const slugs = new Set(TAXONOMY.map((g) => g.slug));
    expect(slugs.size).toBe(7);
    for (const c of getCategories()) expect(slugs.has(c.slug)).toBe(false);
    for (const g of TAXONOMY) expect(new Set(g.children.map((c) => c.slug)).size).toBe(g.children.length);
  });
  it("never offers consumer, WhatsApp or phone-only categories as available", () => {
    for (const g of TAXONOMY) for (const c of g.children) if (c.compliance || g.compliance) expect(c.status).toBe("upcoming");
    expect(getGroup("whatsapp-number-lists")!.status).toBe("upcoming");
    expect(getChild(getGroup("email-lists")!, "b2c-email-lists")!.status).toBe("upcoming");
  });
  it("whatsapp text says a number is not permission", () => {
    expect(COMPLIANCE_NOTE.whatsapp.title.toLowerCase()).toContain("not permission");
    expect(nodeFaqs("X", "upcoming", "whatsapp").some(([q]) => /message it on WhatsApp/.test(q))).toBe(true);
  });
  it("industry databases link real catalog industries straight to their page and keep upcoming ones separate", () => {
    const g = getGroup("industry-databases")!;
    const kids = industryChildren([{ slug: "dentists", name: "Dentists" }]);
    expect(childHref(g, kids[0])).toBe("/lists/dentists");
    expect(kids.some((k) => k.slug === "healthcare" && k.status === "upcoming")).toBe(true);
    expect(childHref(g, kids.find((k) => k.slug === "healthcare")!)).toBe("/lists/industry-databases/healthcare");
  });
  it("sitemap lists only categories with something real behind them", () => {
    const p = taxonomyPaths();
    expect(p).toContain("/lists/email-lists");
    expect(p).toContain("/lists/email-lists/b2b-email-lists");
    expect(p).not.toContain("/lists/whatsapp-number-lists");
    expect(p).not.toContain("/lists/job-title-lists/ceos");
  });
  it("copy states no counts or prices", () => {
    const text = JSON.stringify(TAXONOMY);
    expect(text).not.toMatch(/\$\d|\d{2,},\d{3}|\b\d+\s*(contacts|records)\b/i);
  });
});
