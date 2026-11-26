import { describe, it, expect } from "vitest";
import { countryIn, COUNTRIES } from "@/lib/import/geo";
import { FLAG_FILES } from "@/lib/flag-codes";

describe("country detection", () => {
  it("finds countries that were missing", () => {
    for (const [t, c] of [["Uzbekistan Business Email Database", "UZ"], ["Niger Business Email Database", "NE"], ["Laos Business Email Database", "LA"], ["Tajikistan Business Email Database", "TJ"], ["Nigeria Business Email List", "NG"], ["Ivory Coast Email List", "CI"]] as const) expect(countryIn(t)?.code).toBe(c);
  });
  it("new countries have flag files", () => {
    const known = new Set(COUNTRIES.map((c) => c.code));
    for (const f of ["uz", "ne", "la", "tj", "gn", "ml"]) expect(known.has(f.toUpperCase()) && FLAG_FILES.has(f)).toBe(true);
  });
});
