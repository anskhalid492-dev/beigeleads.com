import { describe, expect, it } from "vitest";
import { applyPageSeo } from "@/lib/seo/page-rewrite";

const page = `<html><head><title>Old | BeigeLeads</title><meta name="description" content="old desc"/><meta name="robots" content="noindex, nofollow"/><link rel="canonical" href="https://beigeleads.com/x"/><meta property="og:title" content="Old"/></head><body><h1>Hi</h1></body></html>`;
const empty = { t: "", d: "", ot: "", od: "", oi: "", c: "" };

describe("applyPageSeo", () => {
  it("replaces title and description, keeps robots untouched", () => {
    const out = applyPageSeo(page, { ...empty, t: "New title", d: 'A "quoted" <desc>' }, "https://beigeleads.com");
    expect(out).toContain("<title>New title</title>");
    expect(out).toContain('content="A &quot;quoted&quot; &lt;desc&gt;"');
    expect(out).toContain('<meta name="robots" content="noindex, nofollow"/>');
    expect(out).not.toContain("old desc");
    expect(out.match(/<title/g)).toHaveLength(1);
  });
  it("social tags follow the SEO title unless set; missing tags are inserted", () => {
    const out = applyPageSeo(page, { ...empty, t: "T", d: "D", oi: "/media/a.png" }, "https://beigeleads.com");
    expect(out).toContain('<meta property="og:title" content="T"/>');
    expect(out).toContain('<meta name="twitter:title" content="T"/>');
    expect(out).toContain('<meta property="og:description" content="D"/>');
    expect(out).toContain('<meta property="og:image" content="https://beigeleads.com/media/a.png"/>');
    expect(out.indexOf("og:image")).toBeLessThan(out.indexOf("</head>"));
    expect(applyPageSeo(page, { ...empty, t: "T", ot: "Social" }, "x")).toContain('og:title" content="Social"');
  });
  it("changes only non-empty fields and canonical when given", () => {
    expect(applyPageSeo(page, empty, "https://beigeleads.com")).toBe(page);
    expect(applyPageSeo(page, { ...empty, c: "/y" }, "https://beigeleads.com")).toContain('<link rel="canonical" href="https://beigeleads.com/y"/>');
    expect(applyPageSeo("<p>no head</p>", { ...empty, t: "T" }, "x")).toBe("<p>no head</p>");
  });
});
