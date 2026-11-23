import { describe, it, expect } from "vitest";
import { toCatalog, type PubProduct } from "@/lib/catalog-db";

const base: PubProduct = { slug: "usa-glass-shops", name: "USA Glass Shops Email Database", title: "t", description: "d", categorySlug: "local-businesses-database", categoryName: "Local Businesses Database", channel: "email", countrySlug: "united-states", countryCode: "US", countryName: "United States", region: "", recordCount: 5000, packages: [{ name: "Starter", records: 1000, priceUsdCents: 9900 }], placeholder: true, forSale: true };

describe("placeholder flag vs real figures", () => {
  it("is not a placeholder when for sale with a count and prices", () => {
    expect(toCatalog([base]).products[0].placeholderData).toBe(false);
    expect(toCatalog([base]).products[0].status).toBe("live");
  });
  it("stays a placeholder without a count, without prices or when not for sale", () => {
    expect(toCatalog([{ ...base, recordCount: null }]).products[0].placeholderData).toBe(true);
    expect(toCatalog([{ ...base, packages: [{ name: "Starter", records: 1, priceUsdCents: 0 }] }]).products[0].placeholderData).toBe(true);
    expect(toCatalog([{ ...base, forSale: false }]).products[0].placeholderData).toBe(true);
  });
});
