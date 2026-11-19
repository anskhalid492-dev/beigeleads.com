import { describe, expect, it } from "vitest";
import { DEFAULT_POPUPS } from "@/lib/popups/defaults";
import { pageTypeOf, pickCampaign, visitorStage, whyNot, type Ctx } from "@/lib/popups/engine";
import { contentSchema, emptyVisitor, type Campaign } from "@/lib/popups/types";

const live = (id: string): Campaign => ({ ...DEFAULT_POPUPS.find((c) => c.id === id)!, status: "live" });
const ctx = (o: Partial<Ctx> = {}): Ctx => ({ pageType: "home", path: "/", seconds: 60, scrollPct: 60, exitIntent: false, signals: new Set(), visitor: { ...emptyVisitor(), visits: 1 }, now: 1_000_000_000_000, ...o });

describe("defaults", () => {
  it("has the 12 campaigns, all drafts, all valid, unique ids", () => {
    expect(DEFAULT_POPUPS).toHaveLength(12);
    expect(DEFAULT_POPUPS.every((c) => c.status === "draft")).toBe(true);
    expect(new Set(DEFAULT_POPUPS.map((c) => c.id)).size).toBe(12);
    for (const c of DEFAULT_POPUPS) { const { id: _i, name: _n, stage: _s, status: _st, priority: _p, version: _v, ...content } = c; void [_i, _n, _s, _st, _p, _v]; expect(() => contentSchema.parse(content)).not.toThrow(); }
  });
  it("makes no invented claims (no digits as counts, prices or urgency words)", () => {
    for (const c of DEFAULT_POPUPS) expect(`${c.headline} ${c.body}`.replace("up to 12 hours", "")).not.toMatch(/\d|only \w+ left|hurry|last chance|% off|limited time/i);
  });
  it("rejects unsafe links", () => {
    const base = { format: "modal", headline: "h", body: "", cta: { label: "x", href: "javascript:alert(1)" }, rules: {} };
    expect(() => contentSchema.parse(base)).toThrow();
    expect(() => contentSchema.parse({ ...base, cta: { label: "x", href: "//evil.com" } })).toThrow();
    expect(() => contentSchema.parse({ ...base, cta: { label: "x", href: "/ok" } })).not.toThrow();
  });
});

describe("eligibility", () => {
  it("draft campaigns never show", () => {
    expect(pickCampaign(DEFAULT_POPUPS, ctx())).toBeNull();
  });
  it("needs real engagement: not at page load, only after time and scroll", () => {
    const c = live("audience-discovery");
    expect(whyNot(c, ctx({ seconds: 2, scrollPct: 0 }))).toBe("time");
    expect(whyNot(c, ctx({ seconds: 25, scrollPct: 5 }))).toBe("scroll");
    expect(whyNot(c, ctx())).toBeNull();
  });
  it("only on its page and only for new visitors where configured", () => {
    const c = live("audience-discovery");
    expect(whyNot(c, ctx({ pageType: "blog" }))).toBe("page");
    expect(whyNot(c, ctx({ visitor: { ...emptyVisitor(), visits: 3 } }))).toBe("not new");
  });
  it("custom-audience waits for a real no-result search, even on the home page", () => {
    const c = live("custom-audience");
    expect(whyNot(c, ctx())).toBe("signal");
    expect(whyNot(c, ctx({ seconds: 0, scrollPct: 0, signals: new Set(["search_noresults"]) }))).toBeNull();
  });
  it("exit intent campaign needs the exit signal", () => {
    const c = live("product-exit");
    expect(whyNot(c, ctx({ pageType: "product", exitIntent: false }))).toBe("exit intent");
    expect(whyNot(c, ctx({ pageType: "product", exitIntent: true }))).toBeNull();
  });
  it("never on checkout pages, except the post-purchase one after a confirmed purchase", () => {
    expect(whyNot(live("sample-preview"), ctx({ pageType: "checkout" }))).toBe("checkout page");
    const post = live("download-assistance");
    expect(whyNot(post, ctx({ pageType: "checkout" }))).toBe("signal");
    expect(whyNot(post, ctx({ pageType: "checkout", signals: new Set(["purchased"]), visitor: { ...emptyVisitor(), visits: 2, purchased: true } }))).toBeNull();
  });
});

describe("funnel progress", () => {
  it("derives the stage from real actions", () => {
    expect(visitorStage(emptyVisitor())).toBe("tofu");
    expect(visitorStage({ ...emptyVisitor(), productViews: 1 })).toBe("mofu");
    expect(visitorStage({ ...emptyVisitor(), sampleRequested: true })).toBe("mofu");
    expect(visitorStage({ ...emptyVisitor(), checkoutStarted: true })).toBe("bofu");
    expect(visitorStage({ ...emptyVisitor(), purchased: true })).toBe("post");
  });
  it("stops earlier-stage popups once the visitor has moved on", () => {
    const tofu = live("audience-discovery");
    expect(whyNot(tofu, ctx({ visitor: { ...emptyVisitor(), visits: 1, productViews: 2 } }))).toBe("stage passed");
    expect(whyNot(live("checkout-reassurance"), ctx({ pageType: "product", visitor: { ...emptyVisitor(), visits: 1, productViews: 1, purchased: true } }))).toBe("stage passed");
  });
  it("does not offer a sample again after one was requested", () => {
    expect(whyNot(live("sample-preview"), ctx({ pageType: "product", visitor: { ...emptyVisitor(), visits: 1, productViews: 1, sampleRequested: true } }))).toBe("already requested sample");
  });
  it("post-purchase popups need a real purchase", () => {
    expect(whyNot(live("getting-started"), ctx())).toBe("no purchase");
    expect(whyNot(live("getting-started"), ctx({ visitor: { ...emptyVisitor(), visits: 2, purchased: true } }))).toBeNull();
  });
});

describe("frequency and dismissal", () => {
  const c = live("audience-discovery");
  const now = 1_000_000_000_000;
  it("respects the impression cap, cooldown, dismissal and conversion", () => {
    const v = (p: Record<string, object>) => ({ ...emptyVisitor(), visits: 1, popups: p as never });
    expect(whyNot(c, ctx({ visitor: v({ [c.id]: { n: 1, last: now - 1000 * 3600 * 50 } }) }))).toBe("cap");
    expect(whyNot({ ...c, rules: { ...c.rules, maxImpressions: 3 } }, ctx({ visitor: v({ [c.id]: { n: 1, last: now - 3600_000 } }) }))).toBe("cooldown");
    expect(whyNot({ ...c, rules: { ...c.rules, maxImpressions: 3 } }, ctx({ visitor: v({ [c.id]: { n: 1, last: now - 1, dismissedAt: now - 86400_000 } }) }))).toBe("dismissed");
    expect(whyNot(c, ctx({ visitor: v({ [c.id]: { n: 0, last: 0, converted: true } }) }))).toBe("converted");
  });
  it("keeps a gap between any two popups", () => {
    expect(whyNot(c, ctx({ visitor: { ...emptyVisitor(), visits: 1, lastAnyShown: 1_000_000_000_000 - 10_000 } }))).toBe("global gap");
  });
});

describe("selection", () => {
  it("picks exactly one: the highest priority eligible campaign", () => {
    const a = { ...live("audience-discovery"), priority: 10 };
    const b = { ...live("first-time-help"), priority: 70 };
    expect(pickCampaign([a, b], ctx())?.id).toBe("first-time-help");
  });
  it("maps paths to page types", () => {
    expect(pageTypeOf("/")).toBe("home");
    expect(pageTypeOf("/product/dentists")).toBe("product");
    expect(pageTypeOf("/checkout/abc")).toBe("checkout");
    expect(pageTypeOf("/help/payments/x")).toBe("help");
    expect(pageTypeOf("/admin")).toBe("other");
  });
});
