import { describe, expect, it } from "vitest";
import { checkRow, type LinkTarget } from "@/lib/delivery/bulk-check";

const t = new Map<string, LinkTarget>([["a-list", { slug: "a-list", name: "A List", status: "draft", packages: ["Starter", "Complete"] }]]);
describe("bulk delivery link rules", () => {
  it("accepts https links for a product-wide or named package", () => {
    expect(checkRow({ slug: "a-list", pkg: "", url: "https://files.example.com/a" }, t)).toMatchObject({ ok: true });
    expect(checkRow({ slug: "a-list", pkg: "Complete", url: " https://files.example.com/b " }, t)).toMatchObject({ ok: true, url: "https://files.example.com/b" });
  });
  it("refuses unknown products, packages and non-https links", () => {
    expect(checkRow({ slug: "nope", pkg: "", url: "https://x.com" }, t)).toEqual({ ok: false, reason: "unknown product" });
    expect(checkRow({ slug: "a-list", pkg: "Pro", url: "https://x.com" }, t)).toMatchObject({ ok: false });
    expect(checkRow({ slug: "a-list", pkg: "", url: "http://x.com" }, t)).toMatchObject({ ok: false });
    expect(checkRow({ slug: "a-list", pkg: "", url: "javascript:alert(1)" }, t)).toMatchObject({ ok: false });
  });
});
