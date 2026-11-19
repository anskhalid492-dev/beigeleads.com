import { describe, expect, it } from "vitest";
import { customListHref, parseQuery, searchCatalog } from "@/lib/search";

describe("parseQuery", () => {
  it("extracts quantity, category and place", () => {
    const p = parseQuery("10,000 dentists in California");
    expect(p.quantity).toBe(10000);
    expect(p.category?.slug).toBe("dentists");
    expect(p.region).toBe("california");
    expect(p.countrySlug).toBeNull();
  });
  it("understands k and country", () => {
    const p = parseQuery("5k restaurants in usa");
    expect(p.quantity).toBe(5000);
    expect(p.category?.slug).toBe("restaurants");
    expect(p.countrySlug).toBe("united-states");
  });
});

describe("searchCatalog", () => {
  it("finds a catalog list as exact", () => {
    expect(searchCatalog("ski shops in Denver").exact.map((p) => p.slug)).toEqual(["ski-shops-us"]);
  });
  it("puts a nationwide list under close when the place is unknown", () => {
    const r = searchCatalog("dentists in California");
    expect(r.exact).toHaveLength(0);
    expect(r.close).toHaveLength(1);
  });
  it("returns nothing for unknown categories or countries", () => {
    expect(searchCatalog("veterinarians in Canada").exact).toHaveLength(0);
    expect(searchCatalog("dentists in Germany").exact).toHaveLength(0);
  });
  it('treats "in the US" like "in US"', () => {
    const r = searchCatalog("dentists in the US");
    expect(r.parsed.countrySlug).toBe("united-states");
    expect(r.parsed.region).toBe("");
    expect(r.exact).toHaveLength(1);
  });
  it("builds a prefilled custom-list link", () => {
    const h = customListHref("2000 veterinarians in Texas");
    expect(h).toContain("/custom-list?");
    expect(h).toContain("quantity=2000");
    expect(h).toContain("region=Texas");
  });
});
