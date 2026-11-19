import { describe, expect, it } from "vitest";
import { getProducts } from "@/lib/catalog";
import { parseSlugList } from "@/lib/settings/service";
import { parseShopQuery, shopHref, shopProducts } from "@/lib/shop";

const all = getProducts();
const q = (o: Record<string, string> = {}) => parseShopQuery(o);

describe("shop", () => {
  it("parses and sanitises the query", () => {
    expect(q({ sort: "nonsense", page: "-4" })).toMatchObject({ sort: "relevance", page: 1 });
    expect(q({ q: "  dentists  " }).q).toBe("dentists");
  });
  it("filters by industry, country and text", () => {
    expect(shopProducts(all, q({ category: "dentists" })).items.map((p) => p.categorySlug)).toEqual(["dentists"]);
    expect(shopProducts(all, q({ country: "germany" })).total).toBe(0);
    expect(shopProducts(all, q({ q: "ski" })).items[0].categorySlug).toBe("ski-shops");
  });
  it("orders by the admin's featured industries and pages results", () => {
    expect(shopProducts(all, q(), ["restaurants"]).items[0].categorySlug).toBe("restaurants");
    const r = shopProducts(all, q({ page: "9" }));
    expect(r.page).toBe(1);
    expect(r.pages).toBe(1);
  });
  it("builds one canonical URL per view", () => {
    expect(shopHref({})).toBe("/shop");
    expect(shopHref({ type: "b2c" })).toBe("/shop?type=b2c");
    expect(shopHref({ category: "dentists", sort: "price-low", page: 2 })).toBe("/shop?category=dentists&sort=price-low&page=2");
  });
  it("cleans the featured slug list", () => {
    expect(parseSlugList("Dentists, restaurants,, dentists, bad slug!")).toEqual(["dentists", "restaurants"]);
  });
});
