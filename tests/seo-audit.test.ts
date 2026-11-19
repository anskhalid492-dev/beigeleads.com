import { describe, expect, it } from "vitest";
import { analyzeHtml } from "@/lib/seo/audit";

const good = `<html><head><title>A good page title for search results</title><meta name="description" content="${"d".repeat(100)}"><link rel="canonical" href="https://beigeleads.com/x"></head><body><h1>Hi</h1><img src="a.png" alt="a"><script type="application/ld+json">{"@type":"Organization"}</script><p>${"word ".repeat(200)}</p></body></html>`;
describe("analyzeHtml", () => {
  it("passes a clean page", () => { expect(analyzeHtml("/x", 200, good).issues).toEqual([]); });
  it("reports verified issues", () => {
    const codes = analyzeHtml("/y", 200, `<html><head></head><body><h1>a</h1><h1>b</h1><img src="x"><script type="application/ld+json">{bad</script></body></html>`).issues.map((i) => i.code);
    for (const c of ["title-missing", "meta-missing", "canonical-missing", "h1-multiple", "img-alt", "jsonld-invalid"]) expect(codes).toContain(c);
  });
  it("flags duplicate JSON-LD and error statuses", () => {
    const dup = good.replace("</body>", `<script type="application/ld+json">{"@type":"Organization"}</script></body>`);
    expect(analyzeHtml("/z", 200, dup).issues.map((i) => i.code)).toContain("jsonld-duplicate");
    expect(analyzeHtml("/gone", 404, "").issues[0].code).toBe("status");
    expect(analyzeHtml("/r", 301, "").issues[0].code).toBe("redirect");
  });
  it("marks heuristics as tips, not verified", () => {
    const t = analyzeHtml("/t", 200, good.replace(/<p>.*<\/p>/, "<p>short</p>")).issues.find((i) => i.code === "thin");
    expect(t?.kind).toBe("tip");
  });
});
