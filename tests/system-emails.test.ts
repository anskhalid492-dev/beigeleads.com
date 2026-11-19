import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate } from "@/lib/system-emails/defaults";
import { renderEmail, safeUrl } from "@/lib/system-emails/render";
import { checkContent, exampleVars } from "@/lib/system-emails/store";
import { suggestSubjects } from "@/lib/system-emails/subjects";
import { systemVars } from "@/lib/system-emails/mail";
import { BRAND } from "@/lib/system-emails/brand";

const sys = systemVars();
const ALLOWED_COLORS = new Set(["#FBF8F1", "#F4EEDF", "#E8DEC6", "#D8EADF", "#2D6A4F", "#1B4332", "#0F2A1D", "#7C3AED", "#FFFFFF"]);

describe("templates", () => {
  it("has every required template with complete copy", () => {
    const keys = TEMPLATES.map((t) => t.key);
    for (const k of ["order_confirmation", "payment_received", "product_delivery", "payment_pending", "payment_failed", "sample_request_received", "sample_delivery", "custom_request_received", "custom_quote", "contact_received", "category_request_received", "delivery_issue", "refund_update"]) expect(keys).toContain(k);
    expect(TEMPLATES.filter((t) => t.audience === "admin")).toHaveLength(8);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of TEMPLATES) {
      expect(t.content.subject.length).toBeGreaterThan(5);
      expect(t.content.preheader.length).toBeGreaterThan(5);
      expect(t.content.heading.length).toBeGreaterThan(3);
      expect(t.content.blocks.length).toBeGreaterThan(0);
      expect(JSON.stringify(t.content)).not.toMatch(/lorem|placeholder|TODO/i);
    }
  });
  it("uses the brief's exact subjects", () => {
    expect(getTemplate("order_confirmation")!.content.subject).toBe("{{first_name}}, your BeigeLeads order #{{order_number}} is confirmed");
    expect(getTemplate("product_delivery")!.content.subject).toBe("{{first_name}}, your {{product_name}} is ready to download");
    expect(getTemplate("custom_request_received")!.content.subject).toBe("{{first_name}}, we're reviewing your custom list request");
    expect(getTemplate("category_request_received")!.content.subject).toBe("Your requested business category is under review");
  });
  it("every template passes publish checks and renders with example data and no issues", () => {
    for (const t of TEMPLATES) {
      const c = checkContent(t, t.content);
      expect(c.errors, t.key).toEqual([]);
      const r = renderEmail(t.content, { ...sys, ...exampleVars(t) });
      expect(r.issues.unknown, t.key).toEqual([]);
      expect(r.issues.badUrl, t.key).toBe(false);
      expect(r.issues.missing, t.key).toEqual([]);
      expect(r.html).toContain(BRAND.logoLight);
      expect(r.text).toContain("BeigeLeads");
    }
  });
  it("uses only brand colours", () => {
    const html = renderEmail(TEMPLATES[0].content, { ...sys, ...exampleVars(TEMPLATES[0]) }).html;
    for (const m of html.matchAll(/#[0-9A-Fa-f]{6}\b/g)) expect(ALLOWED_COLORS.has(m[0].toUpperCase()), m[0]).toBe(true);
  });
});

describe("personalisation", () => {
  const sample = getTemplate("sample_request_received")!;
  it("drops a missing first name instead of inventing one", () => {
    const r = renderEmail(sample.content, { ...sys, product_name: "Dentists in the US" });
    expect(r.subject).toBe("We've received your sample request");
    expect(r.subject).not.toMatch(/there|undefined|\{\{/);
  });
  it("uses the name when given", () => {
    expect(renderEmail(sample.content, { ...sys, first_name: "Ada", product_name: "X" }).subject).toBe("Ada, we've received your sample request");
    const order = getTemplate("order_confirmation")!;
    expect(renderEmail(order.content, { ...sys, order_number: "1", product_name: "X" }).html).toContain("Thanks for your order!");
    expect(renderEmail(order.content, { ...sys, first_name: "Ada", order_number: "1", product_name: "X" }).html).toContain("Thanks for your order, Ada!");
  });
  it("uses a friendly fallback inside a sentence and drops empty detail rows", () => {
    const d = getTemplate("product_delivery")!;
    const r = renderEmail(d.content, { ...sys, order_number: "BL-1", product_name: "Dentists", download_url: "https://example.com/x" });
    expect(r.html).toContain("Hi there,");
    expect(r.html).not.toContain("Package:");
    expect(r.text).not.toContain("Package:");
  });
  it("reports missing variables without inventing values", () => {
    const r = renderEmail(getTemplate("order_confirmation")!.content, { ...sys, first_name: "Ada" });
    expect(r.issues.missing).toContain("order_number");
  });
});

describe("safety", () => {
  it("escapes HTML and neutralises bold/markup in values", () => {
    const d = getTemplate("contact_received")!;
    const r = renderEmail(d.content, { ...sys, first_name: "<script>alert(1)</script>", request_reference: "CT-1", inquiry_topic: "**x**", inquiry_subject: '"><img src=x onerror=1>' });
    expect(r.html).not.toContain("<script>");
    expect(r.html).not.toContain("<img src=x");
    expect(r.html).toContain("&lt;script&gt;");
    expect(r.html).not.toContain("<strong>x</strong>");
    expect(r.subject).not.toMatch(/[\r\n]/);
  });
  it("keeps newlines out of subjects", () => {
    const c = { ...getTemplate("contact_received")!.content, subject: "Hello {{first_name}}" };
    expect(renderEmail(c, { ...sys, first_name: "A\r\nBcc: x@y.z" }).subject).toBe("Hello A Bcc: x@y.z");
  });
  it("only accepts https links or site paths", () => {
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeUrl("/contact")).toBe("https://beigeleads.com/contact");
    for (const bad of ["javascript:alert(1)", "http://example.com", "//evil.com", "data:text/html,x", "https://", "ftp://a.b", "https://a b.com"]) expect(safeUrl(bad), bad).toBeNull();
  });
  it("blocks a download button with an unsafe link", () => {
    const d = getTemplate("product_delivery")!;
    const r = renderEmail(d.content, { ...sys, order_number: "1", product_name: "X", download_url: "javascript:alert(1)" });
    expect(r.issues.badUrl).toBe(true);
    expect(r.html).not.toContain("javascript:");
  });
  it("only links our own site inside text", () => {
    const r = renderEmail(getTemplate("product_delivery")!.content, { ...sys, order_number: "1", product_name: "X", download_url: "https://example.com/x" });
    expect(r.html).toContain('<a href="https://beigeleads.com/legal/lawful-use"');
    const c = renderEmail(getTemplate("custom_request_received")!.content, { ...sys, request_reference: "CL-1", requirements: "see https://evil.example/phish" });
    expect(c.html).not.toContain('href="https://evil.example');
  });
});

describe("publish checks", () => {
  const d = getTemplate("product_delivery")!;
  it("rejects unknown and unavailable variables", () => {
    expect(checkContent(d, { ...d.content, heading: "Hi {{nope}}" }).errors.join()).toMatch(/not a known variable/);
    expect(checkContent(d, { ...d.content, heading: "{{quote_summary}}" }).errors.join()).toMatch(/not available for this email/);
  });
  it("requires the download link in the delivery email", () => {
    expect(checkContent(d, { ...d.content, cta: undefined }).errors.length).toBeGreaterThan(0);
    expect(checkContent(d, { ...d.content, cta: { label: "Go", url: "https://example.com" } }).errors.join()).toMatch(/download_url/);
  });
  it("rejects bad button links", () => {
    expect(checkContent(d, { ...d.content, cta: { label: "Go", url: "javascript:x" } }).errors.length).toBeGreaterThan(0);
  });
  it("validates shape", () => {
    expect(checkContent(d, { subject: "" }).errors.length).toBeGreaterThan(0);
  });
});

describe("subject suggestions", () => {
  it("gives three deterministic, non-empty options built from the event's own variables", () => {
    for (const t of TEMPLATES) {
      const s = suggestSubjects(t, t.content);
      expect(s).toHaveLength(3);
      expect(s.map((x) => x.style)).toEqual(["Professional and direct", "Friendly and personalized", "Concise and action-oriented"]);
      for (const x of s) {
        expect(x.subject.length).toBeGreaterThan(3);
        const c = checkContent(t, { ...t.content, subject: x.subject });
        expect(c.errors, `${t.key}: ${x.subject}`).toEqual([]);
        expect(x.subject).not.toMatch(/guarantee|open rate|!!/i);
      }
      expect(suggestSubjects(t, t.content)).toEqual(s);
    }
  });
});
