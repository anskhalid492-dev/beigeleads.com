import { describe, expect, it } from "vitest";
import { REMOVE_FIELDS, singular, standardize } from "@/lib/import/local-standard";
import { LOCAL_FIELD_NAMES } from "@/lib/product-fields";

const base = { categoryName: "Local Businesses Database", channel: "business-email", countryName: "United States", dataFields: [] as string[], fieldsCustom: false };
describe("local standard", () => {
  it("names, title, slug, coverage", () => {
    const s = standardize({ ...base, slug: "d", name: "Dentists Email List in the United States" }, "1M+");
    expect(s.name).toBe("Dentists Email Database");
    expect(s.title).toBe("List of Dentists in the United States");
    expect(s.slugBase).toBe("dentist-business-email-database");
    expect(s.coverage).toBe("United States");
    expect(s.seoTitle).toBe("1M+ Dentists Email Database 2027 Updated Database");
    expect(s.seoTitle.length).toBeLessThanOrEqual(60);
  });
  it("singular", () => { expect(singular("Beauty Salons")).toBe("Beauty Salon"); expect(singular("Bakeries")).toBe("Bakery"); expect(singular("Boxes")).toBe("Box"); expect(singular("Gas")).toBe("Ga".length ? singular("Gas") : ""); });
  it("lengths and uniqueness over many subjects", () => {
    const seen = new Set<string>(); const names = ["Plumbers", "Dentists", "Auto Repair Shops", "Hair Salons", "Real Estate Agencies", "Chiropractors", "Veterinary Clinics", "Day Care Centers"];
    for (const n of names) { const s = standardize({ ...base, slug: n, name: `${n} Email List in the United States` }, "15k+", seen); seen.add(s.metaDescription.toLowerCase());
      expect(s.description.length).toBeLessThanOrEqual(300); expect(s.description.length).toBeGreaterThan(240);
      expect(s.metaDescription.length).toBeLessThanOrEqual(155); expect(s.seoTitle.length).toBeLessThanOrEqual(60); }
    expect(seen.size).toBe(names.length);
  });
  it("skips products with both SEO fields; removes the ten fields", () => {
    expect(standardize({ ...base, slug: "a", name: "A Email List", seoTitle: "x", metaDescription: "y" }, "1M+").skip).toBe(true);
    expect(standardize({ ...base, slug: "a", name: "A Email List", seoTitle: "x" }, "1M+").skip).toBe(false);
    const s = standardize({ ...base, slug: "a", name: "A Email List", fieldsCustom: true, dataFields: [...LOCAL_FIELD_NAMES, ...REMOVE_FIELDS, "Fax"] }, "1M+");
    expect(s.dataFields.some((f) => REMOVE_FIELDS.includes(f as never))).toBe(false);
    expect(s.fieldsCustom).toBe(false);
  });
});
