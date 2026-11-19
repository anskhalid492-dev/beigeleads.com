import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate } from "@/lib/system-emails/defaults";
import { DEFAULT_BRANDING, brandingSchema } from "@/lib/system-emails/branding";
import { renderEmail } from "@/lib/system-emails/render";
import { checkContent, exampleVars } from "@/lib/system-emails/store";
import { systemVars } from "@/lib/system-emails/mail";
import { contentSchema, type Block, type Content } from "@/lib/system-emails/types";
import { LIBRARY } from "@/app/admin/system-emails/[key]/design/blocks";
import { BRAND } from "@/lib/system-emails/brand";

const def = getTemplate("custom_request_received")!;
const v = { ...systemVars(), ...exampleVars(def) };
const withBlocks = (blocks: Block[]): Content => ({ ...def.content, blocks });
const ALLOWED = new Set(["#FBF8F1", "#F4EEDF", "#E8DEC6", "#D8EADF", "#2D6A4F", "#1B4332", "#0F2A1D", "#7C3AED", "#FFFFFF", "#FFF"]);

describe("designer blocks", () => {
  it("every library block validates, renders and passes publish checks for a template that supplies its variables", () => {
    const allowed = new Set([...def.vars, ...["company_name", "website_url", "contact_url", "help_url", "lists_url", "support_email"]]);
    for (const item of LIBRARY) {
      const b = item.make(allowed);
      const content = withBlocks([...def.content.blocks, b]);
      expect(contentSchema.safeParse(content).success, item.id).toBe(true);
      const r = renderEmail(content, v);
      expect(r.html.length, item.id).toBeGreaterThan(500);
      if (item.id !== "image") expect(r.issues.badUrl, item.id).toBe(false);
    }
  });
  it("order summary and product details only use variables the event supplies", () => {
    const sample = getTemplate("sample_request_received")!;
    const a = new Set([...sample.vars]);
    for (const id of ["order", "product"]) {
      const b = LIBRARY.find((l) => l.id === id)!.make(a);
      const c = { ...sample.content, blocks: [b] };
      expect(checkContent(sample, c).errors, id).toEqual([]);
    }
  });
  it("renders each new block type", () => {
    const html = renderEmail(withBlocks([
      { t: "heading", text: "Big title", style: { size: "xl", align: "center" } },
      { t: "image", src: "/media/2026/a.png", alt: "Chart", width: "md", link: "https://example.com" },
      { t: "button", label: "Go", url: "https://example.com/x", variant: "dark" },
      { t: "button", label: "Outline", url: "/contact", variant: "outline" },
      { t: "divider" }, { t: "spacer", size: "lg" },
      { t: "columns", left: "Left text", right: "Right text" },
      { t: "social", links: [{ label: "LinkedIn", url: "https://example.com/in" }, { label: "Bad", url: "javascript:x" }] },
      { t: "support", text: "Need help?" }, { t: "logo", size: "lg" }, { t: "footnote", text: "Small print" },
      { t: "p", text: "Soft panel", style: { tone: "soft", pad: "lg", radius: 20 } },
      { t: "p", text: "Dark panel", style: { tone: "dark" } },
    ]), v).html;
    for (const t of ["Big title", 'src="https://beigeleads.com/media/2026/a.png"', 'alt="Chart"', "Go", "Outline", "Left text", "Right text", "LinkedIn", "Need help?", "Small print", "Soft panel", "Dark panel", 'class="col t"']) expect(html, t).toContain(t);
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain(">Bad<");
  });
  it("keeps every colour inside the brand palette", () => {
    const html = renderEmail(withBlocks([
      { t: "p", text: "a", style: { tone: "soft" } }, { t: "p", text: "b", style: { tone: "highlight" } }, { t: "p", text: "c", style: { tone: "dark" } },
      { t: "button", label: "x", url: "/", variant: "primary" }, { t: "button", label: "y", url: "/", variant: "dark" }, { t: "button", label: "z", url: "/", variant: "outline" },
    ]), v, { forceDark: true }).html;
    for (const m of html.matchAll(/#[0-9A-Fa-f]{3,6}\b/g)) expect(ALLOWED.has(m[0].toUpperCase()), m[0]).toBe(true);
  });
  it("rejects unsafe or empty links in buttons and images, and non-https social links", () => {
    expect(checkContent(def, withBlocks([{ t: "button", label: "x", url: "javascript:alert(1)", variant: "primary" }])).errors.join()).toMatch(/unsafe/);
    expect(checkContent(def, withBlocks([{ t: "image", src: "", alt: "", width: "md" }])).errors.join()).toMatch(/unsafe/);
    expect(checkContent(def, withBlocks([{ t: "image", src: "http://x.com/a.png", alt: "a", width: "md" }])).errors.length).toBeGreaterThan(0);
    expect(checkContent(def, withBlocks([{ t: "social", links: [{ label: "X", url: "http://x.com" }] }])).errors.join()).toMatch(/https/);
    expect(checkContent(def, withBlocks([{ t: "image", src: "/media/a.png", alt: "", width: "md" }])).warnings.join()).toMatch(/alt text/);
  });
  it("rejects variables the event cannot supply inside new blocks", () => {
    expect(checkContent(def, withBlocks([{ t: "columns", left: "{{download_url}}", right: "" }])).errors.join()).toMatch(/not available/);
  });
  it("delivery email still needs its download link when a block button is used", () => {
    const d = getTemplate("product_delivery")!;
    expect(checkContent(d, { ...d.content, cta: undefined }).errors.join()).toMatch(/download_url/);
    const ok = { ...d.content, cta: undefined, blocks: [...d.content.blocks, { t: "button" as const, label: "Download", url: "{{download_url}}", variant: "primary" as const }] };
    expect(checkContent(d, ok).errors).toEqual([]);
  });
  it("escapes values placed in new blocks", () => {
    const html = renderEmail(withBlocks([{ t: "columns", left: "{{requirements}}", right: "{{industry}}" }, { t: "image", src: "/media/a.png", alt: "{{industry}}", width: "sm" }]), { ...v, requirements: "<img src=x onerror=1>", industry: '"><script>1</script>' }).html;
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
  });
});

describe("branding", () => {
  it("validates and applies", () => {
    expect(brandingSchema.safeParse(DEFAULT_BRANDING).success).toBe(true);
    expect(brandingSchema.safeParse({ ...DEFAULT_BRANDING, supportEmail: "not an email" }).success).toBe(false);
    expect(brandingSchema.safeParse({ ...DEFAULT_BRANDING, social: [{ label: "X", url: "http://x.com" }] }).success).toBe(false);
    expect(brandingSchema.safeParse({ ...DEFAULT_BRANDING, logoHeight: 99 }).success).toBe(false);
    const br = { ...DEFAULT_BRANDING, logoHeight: 42 as const, cardRadius: 8 as const, buttonColor: "dark" as const, buttonRadius: 0 as const, footerNote: "Extra line", social: [{ label: "LinkedIn", url: "https://example.com/in" }] };
    const html = renderEmail(def.content, { ...v, support_email: "help@example.com" }, { branding: br }).html;
    expect(html).toContain('height="42"');
    expect(html).toContain("border-radius:8px;padding:36px");
    expect(html).toContain(`background:${BRAND.forest900};border-radius:0px`);
    expect(html).toContain("Extra line");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("help@example.com");
    expect(html).not.toContain(`bgcolor="${BRAND.purple600}"`);
  });
  it("every built-in template still passes publish checks with the new rules", () => {
    for (const t of TEMPLATES) expect(checkContent(t, t.content).errors, t.key).toEqual([]);
  });
});
