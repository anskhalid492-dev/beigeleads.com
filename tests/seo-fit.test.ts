import { describe, expect, it } from "vitest";
import { fitDescription, fitMeta, fitTitle } from "@/lib/seo/fit";

describe("seo fit", () => {
  it("keeps the template suffix when it fits", () => {
    expect(fitTitle("Pricing")).toBe("Pricing");
    expect(fitTitle("Pricing | BeigeLeads")).toBe("Pricing");
  });
  it("drops the suffix, then trims at a word, when too long", () => {
    const a = fitTitle("Business contact lists by industry, country and city");
    expect(a).toEqual({ absolute: "Business contact lists by industry, country and city" });
    const long = "A very long page title that keeps going and going well past the limit of fifty-nine characters";
    const b = fitTitle(long) as { absolute: string };
    expect(b.absolute.length).toBeLessThanOrEqual(59);
    expect(long.startsWith(b.absolute)).toBe(true);
  });
  it("fits descriptions to 149, preferring a sentence end", () => {
    const d = "First sentence is here and reasonably long so that it passes the seventy character floor. " + "Second sentence goes on and on for a while longer than the limit allows for sure.";
    const f = fitDescription(d);
    expect(f.length).toBeLessThanOrEqual(149);
    expect(f.endsWith(".")).toBe(true);
    expect(fitDescription("x ".repeat(200)).length).toBeLessThanOrEqual(149);
    expect(fitDescription("Short one.")).toBe("Short one.");
  });
  it("fits metadata fields together", () => {
    const m = fitMeta({ title: "T ".repeat(60), description: "d ".repeat(100), openGraph: { title: "T ".repeat(60), description: "d ".repeat(100) } });
    expect((m.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(59);
    expect((m.description as string).length).toBeLessThanOrEqual(149);
    expect(((m.openGraph as { description: string }).description).length).toBeLessThanOrEqual(149);
  });
});
