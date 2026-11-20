import { describe, expect, it } from "vitest";
import { seoText, subjectOf } from "@/lib/import/seo-text";

const base = { channel: "business-email", countryName: "United States", region: "" as string | null, recordCount: null as number | null };
describe("SEO text for products", () => {
  it("keeps the audience from the product name and drops country and channel words", () => {
    expect(subjectOf({ ...base, name: "USA CEO & CFO Emails List", categoryName: "Founders Email Lists" })).toBe("CEO & CFO");
    expect(subjectOf({ ...base, countryName: "Canada", name: "Canada Food Industry Email List", categoryName: "Food Industry" })).toBe("Food Industry");
    expect(subjectOf({ ...base, countryName: "Argentina", name: "Argentina Phone Number List Database", categoryName: "Phone Number Lists" })).toBe("Business");
  });
  it("builds name, slug, title and description from real fields only", () => {
    const t = seoText({ ...base, name: "Alabama B2B Email List, Mailing B2B Sales Leads Database", categoryName: "Founders", region: "Alabama", recordCount: 12345 });
    expect(t.name).toBe("Founders Email List in Alabama, USA".replace("Founders", t.subject));
    expect(t.slugBase).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); expect(t.slugBase).toContain("alabama-usa");
    expect(t.seoTitle.length).toBeLessThanOrEqual(62); expect(t.metaDescription.length).toBeLessThanOrEqual(160);
    expect(t.metaDescription).toContain("12,345 records");
    expect(t.metaDescription).not.toMatch(/verified|accurate|best|guarantee/i);
  });
  it("uses phone and consumer wording, Worldwide, and never claims records for placeholders", () => {
    expect(seoText({ ...base, name: "Argentina Phone Numbers", countryName: "Argentina", channel: "phone", categoryName: "Phone" }).name).toBe("Business Phone Number List in Argentina");
    expect(seoText({ ...base, name: "Mexico Consumer Email List", countryName: "Mexico", channel: "consumer-email", categoryName: "Consumer" }).name).toBe("Consumer Email List in Mexico");
    expect(seoText({ ...base, name: "Cryptocurrency Processed Email List", countryName: "Worldwide", categoryName: "General" }).name).toBe("Cryptocurrency Processed Email List Worldwide");
    expect(seoText({ ...base, name: "X List", categoryName: "X", recordCount: 100, placeholder: true }).metaDescription).not.toContain("100 records");
  });
});
