import { describe, expect, it } from "vitest";
import { classifyGeneral } from "@/lib/import/reorganize";

const c = (name: string, extra = {}) => classifyGeneral({ name, categoryName: "General Targeted Lists", channel: "business-email", countryName: "United States", region: "", ...extra });
describe("classifyGeneral", () => {
  it("webmail", () => { expect(c("Gmail Users Email List")).toMatchObject({ dest: "webmail", confidence: "high" }); expect(c("Yahoo Business Owners Email List").confidence).toBe("review"); });
  it("crypto", () => { expect(c("Bitcoin Investors Email List")).toMatchObject({ dest: "crypto", confidence: "high" }); expect(c("Blockchain Companies Email List").dest).toBe("crypto"); });
  it("healthcare before local", () => { expect(c("Dentists Email List")).toMatchObject({ dest: "healthcare", confidence: "high" }); expect(c("Veterinarians Email List").dest).toBe("healthcare"); expect(c("Medical Billing Software Email List").confidence).toBe("review"); });
  it("local", () => { expect(c("Plumbers Email List")).toMatchObject({ dest: "local", confidence: "high" }); expect(c("Hair Salons Email List").dest).toBe("local"); });
  it("keeps general lists", () => { expect(c("Software Companies Email List")).toMatchObject({ dest: null, confidence: "none" }); expect(c("Fintech Startups Email List").dest).toBeNull(); expect(c("Manufacturers Email List").dest).toBeNull(); });
});
