import { describe, expect, it } from "vitest";
import { maskAddress, maskEmail, maskPhone, maskRows, siteDomain } from "@/lib/product-samples";

describe("sample masking", () => {
  it("masks emails but keeps the domain, and refuses junk", () => {
    expect(maskEmail("John.Smith@Acme.com")).toBe("j***@acme.com");
    expect(maskEmail("not an email")).toBe(""); expect(maskEmail("@x.com")).toBe("");
  });
  it("hides the last four digits of a phone number and keeps the shape", () => {
    expect(maskPhone("(205) 555-0142")).toBe("(205) 555-****");
    expect(maskPhone("+49 30 1234567")).toBe("+49 30 123****");
    expect(maskPhone("12")).toBe("");
    expect(maskPhone("(205) 555-0142")).not.toMatch(/0142/);
  });
  it("hides the house number only", () => {
    expect(maskAddress("123 Main St")).toBe("*** Main St");
    expect(maskAddress("Main St 5")).toBe("Main St 5");
  });
  it("keeps only the domain of a website", () => { expect(siteDomain("https://www.Acme.com/about?x=1")).toBe("acme.com"); expect(siteDomain("javascript:alert(1)")).toBe(""); });
  it("builds at most 10 masked, de-duplicated rows and never keeps the raw email or phone", () => {
    const raw = Array.from({ length: 15 }, (_, i) => ({ "Business Name": `Biz ${i % 12}`, Email: `owner${i}@biz${i}.com`, Phone: "(205) 555-0142", Address: "9 Oak Ave", City: "Mobile", Website: "https://biz.com/x" }));
    const rows = maskRows(raw);
    expect(rows).toHaveLength(10);
    const json = JSON.stringify(rows);
    expect(json).not.toContain("owner1@"); expect(json).not.toContain("0142"); expect(json).not.toContain('"9 Oak');
    expect(rows[0]).toMatchObject({ business: "Biz 0", email: "o***@biz0.com", city: "Mobile", website: "biz.com" });
  });
});
