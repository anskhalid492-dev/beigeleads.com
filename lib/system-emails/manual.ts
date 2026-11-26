import { z } from "zod";
import type { Block, Content } from "./types";
import { renderEmail, type Rendered, type Vars } from "./render";
import type { Branding } from "./branding";

/** Manual send: the owner fulfils an order by hand and sends ONE branded email to ONE person, with his own links/buttons. */
export const manualSchema = z.object({
  templateKey: z.string().min(1).max(60),
  to: z.string().trim().toLowerCase().email("That email address has a typo (check for a comma instead of a dot, spaces, or a missing @).").max(200),
  firstName: z.string().trim().max(60).default(""),
  orderId: z.string().trim().max(60).default(""),
  productName: z.string().trim().max(120).default(""),
  packageName: z.string().trim().max(60).default(""),
  records: z.string().trim().max(30).default(""),
  subject: z.string().trim().min(1).max(150),
  heading: z.string().trim().min(1).max(150),
  note: z.string().trim().max(1500).default(""),
  buttons: z.array(z.object({
    label: z.string().trim().min(1, "Every button needs a label.").max(60),
    url: z.string().trim().max(500).refine((u) => /^https:\/\/[^\s<>"']+$/i.test(u), "Every button link must start with https://"),
    variant: z.enum(["primary", "dark", "outline"]),
  })).min(1, "Add at least one button with a link.").max(5),
});
export type ManualInput = z.infer<typeof manualSchema>;

export function manualVars(m: ManualInput): Vars {
  return {
    ...(m.firstName ? { first_name: m.firstName } : {}),
    ...(m.orderId ? { order_number: m.orderId.slice(0, 8).toUpperCase() } : {}),
    ...(m.productName ? { product_name: m.productName } : {}),
    ...(m.packageName ? { package_name: m.packageName } : {}),
    ...(m.records ? { records: m.records } : {}),
    download_url: m.buttons[0]?.url ?? "",
  };
}

/** Takes the template's live content, swaps its buttons for the manual ones and applies the typed subject/heading/note. */
export function buildManualContent(base: Content, m: ManualInput): Content {
  const keep = base.blocks.filter((b) => b.t !== "button");
  const note: Block[] = m.note ? [{ t: "p", text: m.note.replace(/[<>]/g, "") }] : [];
  const buttons: Block[] = m.buttons.map((b) => ({ t: "button", label: b.label, url: b.url, variant: b.variant }));
  // Personal note first, then the template's own text, then the buttons.
  return { ...base, subject: m.subject, heading: m.heading, cta: undefined, blocks: [...note, ...keep, ...buttons] };
}

export function renderManual(base: Content, m: ManualInput, branding: Branding | undefined, system: Vars): { r?: Rendered; error?: string } {
  const content = buildManualContent(base, m);
  const r = renderEmail(content, { ...system, ...manualVars(m) }, { branding });
  if (r.issues.badUrl) return { error: "A button link is not safe. Use a full https:// address." };
  if (r.issues.unknown.length) return { error: `Unknown value in the text: {{${r.issues.unknown[0]}}}.` };
  if (r.issues.missing.length) return { error: `Fill in a value for: ${r.issues.missing.join(", ")}.` };
  return { r };
}
