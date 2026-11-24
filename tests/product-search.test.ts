import { describe, expect, it } from "vitest";
import { searchTokens } from "@/lib/import/store";

describe("admin product search words", () => {
  it("splits into words that can match in any order", () => {
    expect(searchTokens("Aprima Centricity")).toEqual(["%aprima%", "%centricity%"]);
    expect(searchTokens("dentists-us")).toEqual(["%dentists%", "%us%"]);
  });
  it("keeps every LIKE pattern under D1's 50-byte limit, even for a pasted long name", () => {
    const enc = new TextEncoder();
    for (const t of searchTokens("A".repeat(200) + " ééééééééééééééééééééééééééééééééééééééé 2,200 Aprima Centricity Email Database")) expect(enc.encode(t).length).toBeLessThanOrEqual(50);
  });
  it("never lets % _ or \\ act as wildcards, and ignores empty input", () => {
    expect(searchTokens("100%_off\\x")).toEqual(["%100%", "%off%", "%x%"]);
    expect(searchTokens("   ")).toEqual([]);
    expect(searchTokens(undefined)).toEqual([]);
  });
});
