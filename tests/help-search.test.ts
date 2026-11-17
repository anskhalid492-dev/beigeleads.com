import { describe, expect, it } from "vitest";
import { helpArticles, helpCategories, plainText } from "@/lib/help";
import { highlight, searchDocs, toDoc } from "@/lib/help/search";

const docs = helpArticles.map((a) => toDoc(a, helpCategories.find((c) => c.slug === a.category)!.name, plainText(a)));
const top = (q: string, c?: string) => searchDocs(docs, q, c)[0]?.id;

describe("help search", () => {
  it("finds by title words", () => expect(top("subscription fees")).toBe("pricing/no-subscription"));
  it("finds by keyword", () => expect(top("opt out")).toBe("privacy-compliance/data-removal"));
  it("tolerates typos", () => expect(top("verifcation")).toContain("verif"));
  it("tolerates a typo in a longer query", () => expect(top("downlaod link")).toMatch(/delivery|troubleshooting/));
  it("returns nothing for nonsense", () => expect(searchDocs(docs, "zzzxqv")).toHaveLength(0));
  it("filters by category", () => { for (const d of searchDocs(docs, "email", "delivery")) expect(d.category).toBe("delivery"); });
  it("highlights matches", () => expect(highlight("Email verification", "verification").some((p) => p.hit)).toBe(true));
});
