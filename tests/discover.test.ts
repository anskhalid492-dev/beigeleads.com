import { describe, expect, it } from "vitest";
import { discover, queryTokens, suggest } from "@/lib/discover";
import type { Product } from "@/lib/catalog";

const mk = (slug: string, name: string, cat: string, country: string, region = "", status: "live" | "draft" = "live"): Product => ({ slug, categorySlug: cat, countrySlug: country, title: name, name, description: "", recordCount: 100, lastVerified: null, accuracyPct: null, status, fields: ["Email"], placeholderData: true, packages: [], region } as unknown as Product);
const P = [
  mk("a", "Dentists Email List in USA", "dentists", "united-states"),
  mk("b", "Dentists Email List in Germany", "dentists", "germany"),
  mk("c", "Plumbers Email List in Texas, USA", "plumbers", "united-states", "Texas"),
  mk("d", "Phone Number List UK", "phone-number-lists", "united-kingdom", "", "draft"),
];
const names = { cat: (s: string) => s, country: (s: string) => s };

describe("discover", () => {
  it("drops filler words, quantities and maps aliases", () => { expect(queryTokens("I need 5k dentists in the USA")).toEqual(["dentist", "united", "stat"]); });
  it("finds every matching product, not only the built-ins", () => {
    expect(discover(P, "dentists in usa", names).exact.map((x) => x.slug)).toEqual(["a"]);
    expect(discover(P, "dentists", names).exact.map((x) => x.slug).sort()).toEqual(["a", "b"]);
    expect(discover(P, "plumbers texas", names).exact.map((x) => x.slug)).toEqual(["c"]);
    expect(discover(P, "mobile numbers uk", names).exact.map((x) => x.slug)).toEqual(["d"]);
  });
  it("offers close matches when only part of the search matches, nothing when nothing does, and hides placeholder counts", () => {
    const r = discover(P, "dentists in france", names);
    expect(r.exact).toEqual([]); expect(r.close.length).toBeGreaterThan(0);
    expect(discover(P, "zzzz", names).total).toBe(0);
    expect(discover(P, "dentists usa", names).exact[0].records).toBeNull();
  });
  it("suggests names and categories", () => { expect(suggest(P, "plum", names)).toContain("Plumbers Email List in Texas, USA"); });
});
