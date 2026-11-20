import { describe, expect, it } from "vitest";
import { FIXTURE } from "./import-fixture";
import { buildProduct, detectMapping, parseQty, parseWoo, publishBlockers } from "@/lib/import/woo";

describe("WooCommerce import (pure rules)", () => {
  const parsed = parseWoo(FIXTURE);
  const by = (id: string) => buildProduct(parsed.products.find((p) => p.wpId === id)!);
  it("detects the columns and joins variations to their parent", () => {
    expect(parsed.missingRequired).toEqual([]);
    expect(detectMapping(parsed.headers).salePrice).toBe("Sale price");
    expect(parsed.products).toHaveLength(4);
    expect(parsed.products[0].variations).toHaveLength(4);
  });
  it("reports missing required columns instead of guessing", () => {
    expect(parseWoo("A,B\n1,2").missingRequired.length).toBeGreaterThan(0);
  });
  it("keeps at most 3 packages: smallest / middle / largest, sale price wins", () => {
    const p = by("10");
    expect(p.packages.map((k) => k.name)).toEqual(["Starter", "Professional", "Complete"]);
    expect(p.packages.map((k) => k.records)).toEqual([1000, 5000, 50000]);
    expect(p.packages.map((k) => k.priceUsdCents)).toEqual([2900, 5900, 19900]);
    expect(p.droppedVariations).toBe(1);
    expect(p.recordCount).toBe(50000);
    expect(p.region).toBe("Texas");
    expect(p.countryCode).toBe("US");
  });
  it("reads records from a simple product title and flags it", () => {
    const p = by("20");
    expect(p.packages).toHaveLength(1);
    expect(p.packages[0]).toMatchObject({ name: "Complete", records: 100000, priceUsdCents: 9900 });
    expect(p.countryCode).toBe("DE");
    expect(p.flags.some((f) => /read from the product title/.test(f))).toBe(true);
  });
  it("marks consumer data and missing links as restricted / blocked", () => {
    const p = by("30");
    expect(p.restricted).toContain("consumer data");
    expect(p.flags.some((f) => /download link missing/.test(f))).toBe(true);
    expect(publishBlockers(p).length).toBeGreaterThan(1);
  });
  it("never publishes a clean product's blockers away: complete product has none", () => {
    expect(publishBlockers(by("20"))).toEqual([]);
  });
  it("does not copy marketing text; the generated description states facts only", () => {
    expect(by("20").description).not.toMatch(/100% verified|guarantee/i);
  });
  it("parses contact counts", () => {
    expect(parseQty("5,000 Contacts")).toBe(5000);
    expect(parseQty("2 Million Contacts")).toBe(2_000_000);
  });
  it("uses a suffix slug when it collides with a reserved one", () => {
    const src = parsed.products.find((p) => p.wpId === "40")!;
    const s = buildProduct(src).slug;
    expect(buildProduct(src, new Set([s])).slug).toBe(`${s}-40`);
  });
});
