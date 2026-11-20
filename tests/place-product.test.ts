import { describe, expect, it } from "vitest";
import { registerImported, getProducts, type Product } from "@/lib/catalog";
import { productForPlace } from "@/lib/place-product";

const base = { title: "t", description: "d", lastVerified: null, accuracyPct: null, status: "live" as const, fields: [], placeholderData: false, imported: true, packages: [{ name: "Starter", records: 10, priceUsdCents: 900 }] };
const mk = (slug: string, categorySlug: string, countrySlug: string, region?: string): Product => ({ ...base, slug, name: slug, categorySlug, countrySlug, recordCount: 10, region });

describe("productForPlace", () => {
  it("uses the static national product for a place view and the same product page for the country", () => {
    const country = productForPlace("dentists", "united-states");
    expect(country?.product.slug).toBe("dentists-us"); expect(country?.exact).toBe(true);
    const state = productForPlace("dentists", "united-states", ["alabama"]);
    expect(state?.product.slug).toBe("dentists-us"); expect(state?.exact).toBe(false); expect(state?.placeName).toBe("Alabama");
  });
  it("finds an exact imported state product and never invents one", () => {
    registerImported({ products: [mk("tx-lawyers", "lawyers", "united-states", "Texas"), mk("ca-lawyers", "lawyers", "united-states", "California")], categories: [], countries: [] });
    expect(getProducts().some((p) => p.slug === "tx-lawyers")).toBe(true);
    expect(productForPlace("lawyers", "united-states", ["texas"])).toMatchObject({ exact: true });
    expect(productForPlace("lawyers", "united-states", ["texas"])?.product.slug).toBe("tx-lawyers");
    expect(productForPlace("lawyers", "united-states")).toBeNull(); // only regional lists: no national product to show
    expect(productForPlace("lawyers", "united-states", ["ohio"])).toBeNull();
    expect(productForPlace("nothing", "united-states")).toBeNull();
    registerImported({ products: [], categories: [], countries: [] });
  });
});
