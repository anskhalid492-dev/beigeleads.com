import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { manualSchema, renderManual } from "@/lib/system-emails/manual";
import { systemVars } from "@/lib/system-emails/mail";

const base = { templateKey: "product_delivery", to: "Buyer@Example.com", firstName: "Sam", orderId: "abcdef1234", productName: "US Dentists", packageName: "Pro", records: "50,000", subject: "Your list", heading: "Here it is", note: "Thanks <b>Sam</b>", buttons: [{ label: "Download", url: "https://files.example.com/x?a=1", variant: "primary" as const }, { label: "Guide", url: "https://example.com/g", variant: "outline" as const }] };
const def = TEMPLATES.find((t) => t.key === "product_delivery")!;

describe("manual send", () => {
  it("renders custom buttons and drops the template's own", () => {
    const m = manualSchema.parse(base);
    expect(m.to).toBe("buyer@example.com");
    const { r, error } = renderManual(def.content, m, undefined, systemVars());
    expect(error).toBeUndefined();
    expect(r!.html).toContain("https://files.example.com/x?a=1");
    expect(r!.html).toContain("https://example.com/g");
    expect(r!.subject).toBe("Your list");
    expect(r!.html).not.toContain("<b>Sam</b>");
  });
  it("rejects non-https and empty links", () => {
    expect(manualSchema.safeParse({ ...base, buttons: [{ label: "x", url: "javascript:alert(1)", variant: "primary" }] }).success).toBe(false);
    expect(manualSchema.safeParse({ ...base, buttons: [] }).success).toBe(false);
    expect(manualSchema.safeParse({ ...base, to: "nope" }).success).toBe(false);
  });
  it("asks for missing required values", () => {
    const m = manualSchema.parse({ ...base, productName: "" });
    expect(renderManual(def.content, m, undefined, systemVars()).error).toBeTruthy();
  });
});
