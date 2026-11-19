import { z } from "zod";

export const STAGES = ["tofu", "mofu", "bofu", "post"] as const;
export const FORMATS = ["modal", "card", "slide", "sheet", "nudge", "bar"] as const;
export const BLOCKS = ["none", "audience", "steps", "sample", "matcher", "custom", "checkout", "help", "after", "guides", "related"] as const;
export const PAGE_TYPES = ["home", "lists", "product", "blog", "help", "checkout", "custom-list", "sample", "other"] as const;
export const SIGNALS = ["search_noresults", "purchased"] as const;
export type Stage = (typeof STAGES)[number];
export type PageType = (typeof PAGE_TYPES)[number];
export const STATUSES = ["draft", "live", "paused", "archived"] as const;
export type Status = (typeof STATUSES)[number];

/** Links must be a site path or https; `{product_url}` and `{custom_href}` are filled in by the browser. */
const link = z.string().trim().max(300).refine((u) => /^\/(?!\/)/.test(u) || /^https:\/\//i.test(u) || /^\{(product_url|custom_href)\}/.test(u), "Link must be a site path or https");
const text = (n: number) => z.string().trim().max(n);

export const rulesSchema = z.object({
  pages: z.array(z.enum(PAGE_TYPES)).max(9).default([]), // empty = any page
  visitor: z.enum(["any", "new", "returning"]).default("any"),
  minSeconds: z.number().int().min(0).max(600).default(0),
  minScrollPct: z.number().int().min(0).max(100).default(0),
  exitIntent: z.boolean().default(false),
  signal: z.enum(SIGNALS).nullable().default(null),
  minPages: z.number().int().min(0).max(50).default(0),
  minProductViews: z.number().int().min(0).max(50).default(0),
  maxImpressions: z.number().int().min(1).max(20).default(2),
  cooldownHours: z.number().int().min(0).max(24 * 90).default(24),
  dismissCooldownDays: z.number().int().min(0).max(365).default(14),
});

export const contentSchema = z.object({
  format: z.enum(FORMATS),
  block: z.enum(BLOCKS).default("none"),
  headline: text(120),
  body: text(500),
  cta: z.object({ label: text(40), href: link }),
  secondary: z.object({ label: text(40), href: link }).nullable().default(null),
  rules: rulesSchema,
});
export type Rules = z.infer<typeof rulesSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Campaign = Content & { id: string; name: string; stage: Stage; status: Status; priority: number; version: number };

export type Visitor = {
  visits: number;
  pages: number;
  productViews: number;
  sampleRequested: boolean;
  checkoutStarted: boolean;
  purchased: boolean;
  lastAnyShown: number; // ms
  popups: Record<string, { n: number; last: number; dismissedAt?: number; converted?: boolean }>;
};
export const emptyVisitor = (): Visitor => ({ visits: 0, pages: 0, productViews: 0, sampleRequested: false, checkoutStarted: false, purchased: false, lastAnyShown: 0, popups: {} });
