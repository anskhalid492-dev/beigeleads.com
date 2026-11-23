import { describe, expect, it } from "vitest";
import { FAQ_LINK_RULES, MAX_LINKS, linkFaqAnswer } from "@/lib/faq-links";

describe("faq links", () => {
  it("keeps the text intact", () => {
    const t = "See the Help Center and our replacement policy. Or request a free sample.";
    expect(linkFaqAnswer(t).map((s) => s.text).join("")).toBe(t);
  });
  it("links known phrases, max two, first match per target", () => {
    const segs = linkFaqAnswer("The replacement policy applies. Ask the Help Center or request a free sample. The Help Center helps.");
    const links = segs.filter((s) => s.href);
    expect(links.length).toBeLessThanOrEqual(MAX_LINKS);
    expect(new Set(links.map((l) => l.href)).size).toBe(links.length);
  });
  it("skips a destination on request and handles no match", () => {
    expect(linkFaqAnswer("Visit the Help Center.", ["/help-center"]).some((s) => s.href)).toBe(false);
    expect(linkFaqAnswer("Nothing to link here.")).toEqual([{ text: "Nothing to link here." }]);
  });
  it("only points at site paths", () => {
    for (const r of FAQ_LINK_RULES) expect(r.href.startsWith("/")).toBe(true);
  });
});
