import { z } from "zod";

/** Brand-safe style presets. No free colours or sizes exist: every value maps to the existing palette/scale in render.ts. */
export type Style = {
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  bold?: boolean;
  /** none = plain; soft = sand card; highlight = green note; dark = forest panel with light text. */
  tone?: "none" | "soft" | "highlight" | "dark";
  radius?: 0 | 8 | 12 | 20;
  pad?: "none" | "sm" | "md" | "lg";
};

/** Body blocks. Text may contain {{variables}} and **bold**; no HTML is accepted anywhere. */
export type Block = (
  | { t: "p"; text: string }
  | { t: "list"; items: string[] }
  | { t: "kv"; rows: { label: string; value: string }[] }
  | { t: "note"; text: string }
  | { t: "heading"; text: string }
  | { t: "image"; src: string; alt: string; width: "sm" | "md" | "full"; link?: string }
  | { t: "button"; label: string; url: string; variant: "primary" | "dark" | "outline" }
  | { t: "divider" }
  | { t: "spacer"; size: "sm" | "md" | "lg" }
  | { t: "columns"; left: string; right: string }
  | { t: "social"; links: { label: string; url: string }[] }
  | { t: "support"; text: string }
  | { t: "logo"; size: "sm" | "md" | "lg" }
  | { t: "footnote"; text: string }
) & { style?: Style };

export type Content = {
  subject: string;
  preheader: string;
  heading: string;
  blocks: Block[];
  cta?: { label: string; url: string };
  signoff: string;
};

const txt = (n: number) => z.string().max(n);
export const styleSchema = z.object({
  align: z.enum(["left", "center", "right"]).optional(),
  size: z.enum(["sm", "md", "lg", "xl"]).optional(),
  bold: z.boolean().optional(),
  tone: z.enum(["none", "soft", "highlight", "dark"]).optional(),
  radius: z.union([z.literal(0), z.literal(8), z.literal(12), z.literal(20)]).optional(),
  pad: z.enum(["none", "sm", "md", "lg"]).optional(),
}).optional();
const st = { style: styleSchema };
export const blockSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("p"), text: txt(2000), ...st }),
  z.object({ t: z.literal("list"), items: z.array(txt(400)).max(20), ...st }),
  z.object({ t: z.literal("kv"), rows: z.array(z.object({ label: txt(80), value: txt(300) })).max(20), ...st }),
  z.object({ t: z.literal("note"), text: txt(1000), ...st }),
  z.object({ t: z.literal("heading"), text: txt(200), ...st }),
  z.object({ t: z.literal("image"), src: txt(500), alt: txt(200), width: z.enum(["sm", "md", "full"]), link: txt(500).optional(), ...st }),
  z.object({ t: z.literal("button"), label: txt(60), url: txt(500), variant: z.enum(["primary", "dark", "outline"]), ...st }),
  z.object({ t: z.literal("divider"), ...st }),
  z.object({ t: z.literal("spacer"), size: z.enum(["sm", "md", "lg"]), ...st }),
  z.object({ t: z.literal("columns"), left: txt(800), right: txt(800), ...st }),
  z.object({ t: z.literal("social"), links: z.array(z.object({ label: txt(40), url: txt(300) })).max(8), ...st }),
  z.object({ t: z.literal("support"), text: txt(600), ...st }),
  z.object({ t: z.literal("logo"), size: z.enum(["sm", "md", "lg"]), ...st }),
  z.object({ t: z.literal("footnote"), text: txt(600), ...st }),
]);
export const contentSchema = z.object({
  subject: txt(200).min(1),
  preheader: txt(200),
  heading: txt(200).min(1),
  blocks: z.array(blockSchema).max(40),
  cta: z.object({ label: txt(60).min(1), url: txt(500).min(1) }).optional(),
  signoff: txt(200),
});

export type Audience = "customer" | "admin";

/** Founder-led Customer Success metadata (section 173). Present only on the Founder-Led Customer Success templates. */
export type FounderGroup = "Customer Onboarding" | "Relationship Building" | "Founder Insights" | "Product Discovery" | "Customer Experience" | "Long-Term Retention";
export type FounderLayout = "A" | "B" | "C" | "D" | "E";
export type SenderId = "A" | "B" | "C";
/** service = about the order they placed; support = answers a request they made; lifecycle/promotional = optional, unsubscribable. */
export type CommClass = "service" | "support" | "lifecycle" | "promotional";
export type PrefKey = "recs" | "products" | "founder" | "education" | "offers";
export type Anchor = "first_paid" | "first_fulfilled" | "event" | "manual";
export type FounderMeta = {
  /** CS-01 .. CS-36. */
  id: string;
  group: FounderGroup;
  layout: FounderLayout;
  sender: SenderId;
  klass: CommClass;
  /** Which preference switch controls this email (null = not optional). */
  pref: PrefKey | null;
  anchor: Anchor;
  /** Default sending delay after the anchor, in hours. Editable in the journey builder. */
  delayHours: number;
  /** After this many hours past the due time the email is no longer relevant and is skipped. */
  expireHours: number;
  /** Lower number = more important when several are due. */
  priority: number;
  trigger: string;
  eligibility: string;
  /** Subject and prefilled text of the reply-based CTA. */
  reply?: { subject: string; body?: string };
  /** CTA falls back to "Reply to Anus" when no published resource exists. */
  resourceCta?: boolean;
  /** Counts as a reactivation attempt. */
  reactivation?: boolean;
  /** Skips the spacing caps (a thank-you for a purchase just made). */
  exemptFromCaps?: boolean;
};
/** connected = a real backend event sends this email today. */
export type Connection = "connected" | "not_connected";

export type TemplateDef = {
  key: string;
  name: string;
  audience: Audience;
  /** Optional group shown as a badge and filter in the admin (for example "Data Reseller Partners"). */
  category?: string;
  /** True = the admin may switch this template off. Only emails that have no plain-text twin (nothing else sends for the same event). */
  canDisable?: boolean;
  /** Plain-words description of the event that sends it. */
  event: string;
  connection: Connection;
  /** What is missing for a "not connected" template. */
  connectionNote?: string;
  /** Variables the event can supply (system variables are always allowed). */
  vars: string[];
  /** The email must not be sent when one of these is empty. */
  required: string[];
  content: Content;
  /** Set on Founder-Led Customer Success templates: layout, sender, timing, eligibility. */
  founder?: FounderMeta;
};
