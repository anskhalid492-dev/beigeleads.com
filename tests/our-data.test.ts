import { describe, expect, it } from "vitest";
import { DEFAULT_FAQS, DEFAULT_OUR_DATA, approvedValue, ourDataSchema } from "@/lib/our-data/settings";
import { regionOf } from "@/lib/our-data/facts";

describe("our-data settings", () => {
  it("default SEO fits the limits and there are at least 8 FAQs", () => {
    expect(DEFAULT_OUR_DATA.seoTitle.length).toBeLessThanOrEqual(59);
    expect(DEFAULT_OUR_DATA.seoDescription.length).toBeLessThanOrEqual(149);
    expect(DEFAULT_FAQS.length).toBeGreaterThanOrEqual(8);
    expect(ourDataSchema.safeParse(DEFAULT_OUR_DATA).success).toBe(true);
  });
  it("no claim is public by default", () => {
    for (const k of ["records", "accuracy", "largest"] as const) expect(approvedValue(DEFAULT_OUR_DATA, k)).toBeNull();
  });
  it("cannot approve a claim without wording and evidence", () => {
    const c = { ...DEFAULT_OUR_DATA.claims.records, status: "approved" as const };
    expect(ourDataSchema.safeParse({ ...DEFAULT_OUR_DATA, claims: { ...DEFAULT_OUR_DATA.claims, records: c } }).success).toBe(false);
    const ok = { ...c, value: "8B+", evidence: "Internal count of all records across every database on 2026-11-20, export attached." };
    const s = { ...DEFAULT_OUR_DATA, claims: { ...DEFAULT_OUR_DATA.claims, records: ok } };
    expect(ourDataSchema.safeParse(s).success).toBe(true);
    expect(approvedValue(s, "records")).toBe("8B+");
  });
  it("a rejected or pending claim never shows even with text", () => {
    const c = { ...DEFAULT_OUR_DATA.claims.accuracy, status: "rejected" as const, value: "95%", evidence: "x".repeat(60) };
    expect(approvedValue({ ...DEFAULT_OUR_DATA, claims: { ...DEFAULT_OUR_DATA.claims, accuracy: c } }, "accuracy")).toBeNull();
  });
  it("rejects bad evidence links and too-long SEO", () => {
    const c = { ...DEFAULT_OUR_DATA.claims.largest, status: "approved" as const, value: "x", evidence: "y".repeat(50), evidenceUrl: "http://a.com" };
    expect(ourDataSchema.safeParse({ ...DEFAULT_OUR_DATA, claims: { ...DEFAULT_OUR_DATA.claims, largest: c } }).success).toBe(false);
    expect(ourDataSchema.safeParse({ ...DEFAULT_OUR_DATA, seoTitle: "x".repeat(60) }).success).toBe(false);
  });
  it("default copy has no invented numbers beyond policy facts", () => {
    const t = DEFAULT_FAQS.map((f) => f.a).join(" ");
    expect(t).not.toMatch(/\b\d+(\.\d+)?\s?(billion|million|B\+|M\+)/i);
    expect(t).not.toMatch(/world'?s largest|real-time|daily/i);
  });
});
describe("regions", () => {
  it("groups countries", () => { expect(regionOf("US")).toBe("North America"); expect(regionOf("DE")).toBe("Europe"); expect(regionOf("AE")).toBe("Middle East"); expect(regionOf("BR")).toBe("Other regions"); });
});
