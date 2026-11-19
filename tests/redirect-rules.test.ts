import { describe, expect, it } from "vitest";
import { checkRule, findRedirect, normalizePath } from "@/lib/seo/redirect-rules";

describe("redirect rules", () => {
  it("normalizes paths", () => {
    expect(normalizePath("/a/b/?x=1#h")).toBe("/a/b");
    expect(normalizePath("/")).toBe("/");
  });
  it("accepts a valid rule and normalizes it", () => {
    expect(checkRule("/blog/old/", "/blog/new", 301, [])).toEqual({ ok: true, from: "/blog/old", to: "/blog/new" });
    expect(checkRule("/x", "https://beigeleads.com/blog/y/", 302, [])).toMatchObject({ ok: true, to: "/blog/y" });
  });
  it("rejects protected, bad and same-address rules", () => {
    for (const from of ["/admin/x", "/api/a", "/checkout/1", "/", "blog/x", "//evil.com"]) expect(checkRule(from, "/ok", 301, []).ok).toBe(false);
    expect(checkRule("/a", "javascript:alert(1)", 301, []).ok).toBe(false);
    expect(checkRule("/a", "http://x.test", 301, []).ok).toBe(false);
    expect(checkRule("/a", "/a/", 301, []).ok).toBe(false);
    expect(checkRule("/a", "/b", 307, []).ok).toBe(false);
  });
  it("detects loops through existing rules", () => {
    expect(checkRule("/b", "/a", 301, [{ from: "/a", to: "/b" }])).toEqual({ ok: false, error: "This would create a redirect loop." });
    expect(checkRule("/c", "/a", 301, [{ from: "/a", to: "/b" }]).ok).toBe(true);
  });
  it("finds redirects and keeps the query string", () => {
    const m = { "/old": ["/new", 301] as [string, number], "/ext": ["https://x.test/p", 302] as [string, number] };
    expect(findRedirect(m, "/old/", "?a=1")).toEqual({ location: "/new?a=1", status: 301 });
    expect(findRedirect(m, "/ext", "?a=1")).toEqual({ location: "https://x.test/p", status: 302 });
    expect(findRedirect(m, "/none", "")).toBeNull();
    expect(findRedirect(null, "/old", "")).toBeNull();
  });
});
