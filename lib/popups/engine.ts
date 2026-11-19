import type { Campaign, PageType, Stage, Visitor } from "./types";

export type Ctx = { pageType: PageType; path: string; seconds: number; scrollPct: number; exitIntent: boolean; signals: ReadonlySet<string>; visitor: Visitor; now: number };

const RANK: Record<Stage, number> = { tofu: 0, mofu: 1, bofu: 2, post: 3 };
/** Where the visitor is, from things they actually did (never guessed). */
export function visitorStage(v: Visitor): Stage {
  if (v.purchased) return "post";
  if (v.checkoutStarted) return "bofu";
  if (v.sampleRequested || v.productViews >= 1) return "mofu";
  return "tofu";
}

const GLOBAL_GAP_MS = 60_000; // never two popups back to back
const H = 3600_000;

/** Why a campaign is not eligible right now (null = eligible). Pure, so every rule can be tested. */
export function whyNot(c: Campaign, x: Ctx): string | null {
  if (c.status !== "live") return "not live";
  const r = c.rules, v = x.visitor;
  // Payment pages: only a campaign that waits for the confirmed purchase may appear there.
  if (x.pageType === "checkout" && c.rules.signal !== "purchased") return "checkout page";
  if (r.pages.length && !r.pages.includes(x.pageType)) return "page";
  if (r.visitor === "new" && v.visits > 1) return "not new";
  if (r.visitor === "returning" && v.visits <= 1) return "not returning";
  // Funnel progress: earlier-stage campaigns stop once the visitor moved past them.
  if (RANK[c.stage] < RANK[visitorStage(v)] && c.stage !== "post") return "stage passed";
  if (c.stage === "post" && !v.purchased && r.signal !== "purchased") return "no purchase";
  if (c.id === "sample-preview" && v.sampleRequested) return "already requested sample";
  const s = v.popups[c.id];
  if (s?.converted) return "converted";
  if (s && s.n >= r.maxImpressions) return "cap";
  if (s?.dismissedAt && x.now - s.dismissedAt < r.dismissCooldownDays * 24 * H) return "dismissed";
  if (s && s.last && x.now - s.last < r.cooldownHours * H) return "cooldown";
  if (v.lastAnyShown && x.now - v.lastAnyShown < GLOBAL_GAP_MS) return "global gap";
  if (v.pages < r.minPages) return "pages";
  if (v.productViews < r.minProductViews) return "product views";
  if (r.signal && !x.signals.has(r.signal)) return "signal";
  if (r.exitIntent && !x.exitIntent) return "exit intent";
  if (!r.exitIntent) {
    if (x.seconds < r.minSeconds) return "time";
    if (x.scrollPct < r.minScrollPct) return "scroll";
    // Never straight at page load unless an explicit signal (search, purchase) caused it.
    if (!r.signal && r.minSeconds < 5 && r.minScrollPct === 0) return "needs a trigger";
  }
  return null;
}

/** The single most relevant eligible campaign: higher priority first, later funnel stage next, then id for a stable order. */
export function pickCampaign(list: Campaign[], x: Ctx): Campaign | null {
  const ok = list.filter((c) => whyNot(c, x) === null);
  ok.sort((a, b) => b.priority - a.priority || RANK[b.stage] - RANK[a.stage] || a.id.localeCompare(b.id));
  return ok[0] ?? null;
}

export function pageTypeOf(path: string): PageType {
  if (path === "/") return "home";
  if (path === "/lists" || path.startsWith("/lists/")) return "lists";
  if (path.startsWith("/product/")) return "product";
  if (path === "/blog" || path.startsWith("/blog/")) return "blog";
  if (path.startsWith("/help")) return "help";
  if (path.startsWith("/checkout") || path === "/cart") return "checkout"; // no popups on the cart either
  if (path.startsWith("/custom-list")) return "custom-list";
  if (path.startsWith("/sample")) return "sample";
  return "other";
}
