import { describe, expect, it } from "vitest";
import { getProducts } from "@/lib/catalog";
import { parseSlugList } from "@/lib/settings/service";
import { EMPTY, applyFilters, chips, facets, interpret, isFiltered, paginate, parseFilters, shopHref, type GeoTree, type ShopData, type ShopProduct } from "@/lib/shop";

const mk = (slug: string, cat: string, catName: string, k = "united-states", over: Partial<ShopProduct> = {}): ShopProduct => ({ slug, name: `${catName} Email List`, title: `${catName} in ${k}`, categorySlug: cat, categoryName: catName, countrySlug: k, countryName: k === "germany" ? "Germany" : "United States", countryCode: k === "germany" ? "DE" : "US", fields: ["Business name", "Email"], status: "draft", recordCount: null, fromCents: null, ...over });
const tree: GeoTree = [
  { slug: "united-states", name: "United States", code: "US", regions: [{ slug: "alabama", name: "Alabama", cats: ["dentists"] }], cities: [{ slug: "birmingham", name: "Birmingham", regionSlug: "alabama", cats: ["dentists"] }] },
  { slug: "germany", name: "Germany", code: "DE", regions: [], cities: [{ slug: "berlin", name: "Berlin", regionSlug: null, cats: ["restaurants"] }] },
];
const data: ShopData = {
  products: [mk("dentists-us", "dentists", "Dentists"), mk("restaurants-us", "restaurants", "Restaurants"), mk("restaurants-de", "restaurants", "Restaurants", "germany")],
  tree,
  industries: [{ slug: "dentists", name: "Dentists", hints: ["dentist", "dental"] }, { slug: "restaurants", name: "Restaurants", hints: ["restaurant"] }],
  countries: [{ slug: "united-states", name: "United States", code: "US" }, { slug: "germany", name: "Germany", code: "DE" }],
};
const f = (o: Partial<typeof EMPTY> = {}) => ({ ...EMPTY, ...o });
const slugs = (l: ShopProduct[]) => l.map((p) => p.slug);

describe("shop filters", () => {
  it("parses and sanitises the URL", () => {
    expect(parseFilters({ sort: "nonsense", page: "-4", industry: "Dentists,bad slug!,dentists" })).toMatchObject({ sort: "relevance", page: 1, industries: ["dentists"] });
    expect(parseFilters(new URLSearchParams("country=germany,united-states&minPrice=-3&avail=live")).countries).toEqual(["germany", "united-states"]);
    expect(parseFilters({ minPrice: "abc" }).minPrice).toBeNull();
  });
  it("one canonical URL per view, round-trips", () => {
    expect(shopHref({})).toBe("/shop");
    const x = f({ industries: ["dentists"], countries: ["united-states"], state: "alabama", sort: "name", page: 2 });
    expect(parseFilters(new URL(`http://x${shopHref(x)}`).searchParams)).toEqual(x);
  });
  it("multi-select industry and country", () => {
    expect(slugs(applyFilters(data, f({ industries: ["restaurants"] }))).sort()).toEqual(["restaurants-de", "restaurants-us"]);
    expect(slugs(applyFilters(data, f({ industries: ["restaurants"], countries: ["germany"] })))).toEqual(["restaurants-de"]);
    expect(applyFilters(data, f({ countries: ["france"] }))).toEqual([]);
  });
  it("dependent place filters only match recorded inventory", () => {
    expect(slugs(applyFilters(data, f({ state: "alabama" })))).toEqual(["dentists-us"]);
    expect(slugs(applyFilters(data, f({ city: "berlin" })))).toEqual(["restaurants-de"]);
    expect(applyFilters(data, f({ city: "birmingham", industries: ["restaurants"] }))).toEqual([]);
    const fa = facets(data, f({ countries: ["germany"] }));
    expect(fa.states).toEqual([]);
    expect(fa.cities.map((c) => c.slug)).toEqual(["berlin"]);
  });
  it("reads 'dentists in alabama' as industry + country + state", () => {
    const it = interpret("Dentists in Alabama", data.industries, tree);
    expect(it).toMatchObject({ industry: { slug: "dentists" }, country: { slug: "united-states" }, state: { slug: "alabama" } });
    expect(slugs(applyFilters(data, f({ q: "dentists in alabama" })))).toEqual(["dentists-us"]);
    expect(interpret("dentists in the US", data.industries, tree).country?.slug).toBe("united-states");
    // Unknown place: no invented match; word matching finds nothing for "texas".
    expect(applyFilters(data, f({ q: "dentists in texas" }))).toEqual([]);
  });
  it("tolerates typos and finds by words", () => {
    expect(slugs(applyFilters(data, f({ q: "restaraunts" })))).toContain("restaurants-us");
    expect(slugs(applyFilters(data, f({ q: "germany" })))).toEqual(["restaurants-de"]);
    expect(applyFilters(data, f({ q: "zzzzzz" }))).toEqual([]);
  });
  it("offers only facets the data supports; placeholder numbers never filter", () => {
    const fa = facets(data, EMPTY);
    expect(fa).toMatchObject({ fields: [], hasAvailability: false, records: null, price: null });
    const real: ShopData = { ...data, products: [mk("a", "dentists", "Dentists", "united-states", { status: "live", recordCount: 100, fromCents: 5000, fields: ["Email"] }), mk("b", "restaurants", "Restaurants", "united-states", { recordCount: 900, fromCents: 20000 })] };
    const fr = facets(real, EMPTY);
    expect(fr.hasAvailability).toBe(true);
    expect(fr.price).toEqual({ min: 50, max: 200 });
    expect(slugs(applyFilters(real, f({ maxPrice: 100 })))).toEqual(["a"]);
    expect(slugs(applyFilters(real, f({ minRecords: 500 })))).toEqual(["b"]);
    expect(slugs(applyFilters(real, f({ avail: "live" })))).toEqual(["a"]);
    expect(fr.fields.sort()).toEqual(["Business name", "Email"]);
    expect(slugs(applyFilters(real, f({ fields: ["Business name"] })))).toEqual(["b"]);
    expect(slugs(applyFilters(real, f({ sort: "price-high" })))).toEqual(["b", "a"]);
  });
  it("orders by the admin's featured industries, pages, and builds removable chips", () => {
    expect(applyFilters(data, f(), ["restaurants"])[0].categorySlug).toBe("restaurants");
    expect(paginate(Array.from({ length: 30 }, (_, i) => i), 9)).toMatchObject({ page: 3, pages: 3 });
    const c = chips(f({ industries: ["dentists"], countries: ["germany"], state: "x" }), data);
    expect(c.map((x) => x.label)).toEqual(["Dentists", "Germany", "x"]);
    expect(isFiltered(EMPTY)).toBe(false);
    expect(isFiltered(f({ type: "b2c" }))).toBe(true);
  });
  it("catalog products convert without leaking placeholders", () => {
    expect(getProducts().every((p) => p.placeholderData)).toBe(true);
  });
  it("cleans the featured slug list", () => {
    expect(parseSlugList("Dentists, restaurants,, dentists, bad slug!")).toEqual(["dentists", "restaurants"]);
  });
});
