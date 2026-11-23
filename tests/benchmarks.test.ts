import { describe, expect, it } from "vitest";
import { BENCHMARKS, publishedBenchmarks } from "@/lib/benchmarks";
describe("benchmarks", () => {
  it("has the 20 planned records with unique slugs", () => {
    expect(BENCHMARKS).toHaveLength(20);
    expect(new Set(BENCHMARKS.map((b) => b.slug)).size).toBe(20);
    for (const b of BENCHMARKS) expect(b.need.length).toBeGreaterThan(20);
  });
  it("publishes only records with a cited source, period, limits and valid SEO lengths", () => {
    const live = publishedBenchmarks();
    expect(live.length).toBeGreaterThan(0);
    const slugs = new Set(live.map((b) => b.slug));
    for (const b of live) {
      const r = b.report!;
      expect(r.source.url).toMatch(/^https:\/\//);
      expect(r.source.period.length).toBeGreaterThan(5);
      expect(r.source.population.length).toBeGreaterThan(10);
      expect(r.limits.length).toBeGreaterThanOrEqual(3);
      expect(r.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.seoTitle.length).toBeLessThanOrEqual(59);
      expect(r.seoDesc.length).toBeLessThanOrEqual(149);
      for (const row of r.table.rows) expect(row).toHaveLength(r.table.head.length);
      for (const rel of r.related.filter((s) => BENCHMARKS.some((x) => x.slug === s))) expect(typeof rel).toBe("string");
      expect(r.cta.href.startsWith("/")).toBe(true);
    }
    for (const b of BENCHMARKS) if (!slugs.has(b.slug)) expect(b.report).toBeUndefined();
  });
});

import { existsSync } from "node:fs";
import { benchAlt, benchImage, publishedBenchmarks as pubs } from "@/lib/benchmarks";
describe("benchmark featured images", () => {
  it("every published benchmark has an image file and a specific alt text", () => {
    for (const b of pubs()) {
      expect(existsSync(`public${benchImage(b.slug)}`), b.slug).toBe(true);
      expect(benchAlt(b)).toMatch(/^BeigeLeads symbol beside/);
    }
  });
});

import { benchWords } from "@/lib/benchmarks";
describe("benchmark long-form", () => {
  it("every published benchmark has at least 2,500 visible words and a FAQ", () => {
    for (const b of pubs()) {
      expect(benchWords(b.report!), b.slug).toBeGreaterThanOrEqual(2500);
      expect(b.report!.long?.faq.length, b.slug).toBeGreaterThanOrEqual(5);
    }
  });
  it("long-form text uses only safe links and unique section ids", () => {
    for (const b of pubs()) {
      const ids = b.report!.long!.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      const text = b.report!.long!.sections.map((s) => s.body).join("\n");
      for (const m of text.matchAll(/\]\(([^)]+)\)/g)) expect(/^(\/|https:\/\/)/.test(m[1]), m[1]).toBe(true);
    }
  });
});
