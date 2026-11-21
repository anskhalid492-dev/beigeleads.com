import { describe, expect, it } from "vitest";
import { BENCHMARKS, publishedBenchmarks } from "@/lib/benchmarks";
describe("benchmarks", () => {
  it("has the 20 planned records, unique slugs, all drafts (no verified data yet)", () => {
    expect(BENCHMARKS).toHaveLength(20);
    expect(new Set(BENCHMARKS.map((b) => b.slug)).size).toBe(20);
    expect(publishedBenchmarks()).toHaveLength(0);
    for (const b of BENCHMARKS) expect(b.need.length).toBeGreaterThan(20);
  });
});
