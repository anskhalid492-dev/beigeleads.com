import { describe, expect, it } from "vitest";
import { classifyLocal, LOCAL_SLUG } from "@/lib/import/local-business";

const c = (name: string, extra: Partial<Parameters<typeof classifyLocal>[0]> = {}) => classifyLocal({ name, categoryName: "General Targeted Lists", channel: "business-email", grp: "industry", countryName: "United States", region: "", ...extra });

describe("local business classification", () => {
  it("moves clear local-establishment lists", () => {
    for (const n of ["Restaurants Email List in USA", "Hair Salons Email List", "Dentists Email List", "Plumbers Email List", "Car Wash Email List in USA", "Real Estate Agents Email List", "Property Managers Email List", "Accountants Email List", "Hotels Email List in Germany", "Ski Shops Email List", "Pest Control Companies Email List", "Gyms Email List"]) expect(c(n).decision, n).toBe("move");
  });
  it("keeps broad, executive, consumer, technology and general industry lists", () => {
    for (const n of ["CEO Email List", "Business Email List in USA", "Software Companies Email List", "Marketing Agencies Email List", "Manufacturing Companies Email List", "Shopify Stores Email List", "Pharmaceutical Companies Email List", "Universities Email List"]) expect(c(n).decision, n).toBe("keep");
    expect(c("Homeowners Email List", { channel: "consumer-email" }).decision).toBe("keep");
    expect(c("Marketing Directors Email List", { grp: "job-title" }).decision).toBe("keep");
  });
  it("flags uncertain lists for manual review instead of guessing", () => {
    for (const n of ["Restaurant Owners Email List", "Doctors Email List", "Hospitals Email List", "Dental Professionals Email List", "Nurses Email List"]) expect(c(n).decision, n).toBe("review");
  });
  it("gives every moved product an industry label", () => { expect(c("Dentists Email List").industry).toMatch(/dentists/i); expect(LOCAL_SLUG).toBe("local-businesses-database"); });
});
