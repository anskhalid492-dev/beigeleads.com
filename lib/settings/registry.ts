import { z } from "zod";

/**
 * Every editable setting is declared here: type, default, validation, who may change it and where it is really used.
 * A setting without a real consumer is not added. Secrets and wallet data never belong here.
 */
export type SettingType = "text" | "longtext" | "boolean" | "url" | "email" | "emails";
export type SettingDef = {
  key: string; category: CategoryId; label: string; description: string; type: SettingType;
  default: string; max: number; /** Where this value changes something real. */ usedBy: string;
};

export const CATEGORIES = [
  { id: "general", label: "General Settings", text: "Website name and announcement banner.", live: true },
  { id: "branding", label: "Branding & Appearance", text: "Logos, favicon and social image.", live: false },
  { id: "navigation", label: "Website & Navigation", text: "Header and footer links, CTAs.", live: false },
  { id: "business", label: "Business Information", text: "Public business profile.", live: false },
  { id: "email", label: "Email & Notifications", text: "Sender name, reply-to, alerts and test email.", live: true },
  { id: "forms", label: "Forms & Lead Management", text: "Sample, custom list, contact and category forms.", live: false },
  { id: "blog", label: "Blog & Content", text: "Blog display defaults.", live: false },
  { id: "seo", label: "SEO Defaults", text: "Managed in the SEO Manager.", live: true, href: "/admin/seo/settings" },
  { id: "payments", label: "Payments & Checkout", text: "Status only. Wallets stay in their protected screen.", live: false },
  { id: "orders", label: "Orders & Delivery", text: "Delivery messaging and alerts.", live: false },
  { id: "integrations", label: "Integrations", text: "Verified status of connected services.", live: true },
  { id: "security", label: "Security & Access", text: "Your session, access policy and recent changes.", live: true },
  { id: "privacy", label: "Privacy & Compliance", text: "Policies and opt-out handling.", live: false },
  { id: "maintenance", label: "Maintenance & Performance", text: "Health checks and cache actions.", live: true },
  { id: "audit", label: "System Logs & Audit History", text: "Every settings change, newest first.", live: true },
  { id: "backup", label: "Backup & Data Management", text: "Backup capabilities and guidance.", live: true },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const SETTINGS: SettingDef[] = [
  { key: "siteName", category: "general", label: "Website name", description: "Shown as the site name on blog share cards (Open Graph).", type: "text", default: "BeigeLeads", max: 60, usedBy: "Blog article social cards" },
  { key: "bannerEnabled", category: "general", label: "Show announcement banner", description: "Shows a one-line banner above the header on public pages.", type: "boolean", default: "false", max: 5, usedBy: "Public banner" },
  { key: "bannerText", category: "general", label: "Banner text", description: "One short sentence. Plain text only.", type: "text", default: "", max: 140, usedBy: "Public banner" },
  { key: "bannerLink", category: "general", label: "Banner link (optional)", description: "A path like /sample or an https:// address. Leave empty for no link.", type: "url", default: "", max: 300, usedBy: "Public banner" },
  { key: "senderName", category: "email", label: "Sender display name", description: "The name buyers see on emails from the site. The sending address itself is set by the email service and cannot be changed here.", type: "text", default: "BeigeLeads", max: 60, usedBy: "Every transactional email (delivery, confirmations, alerts)" },
  { key: "replyTo", category: "email", label: "Reply-to email", description: "Where a buyer's reply goes. Leave empty to use the sending address.", type: "email", default: "", max: 120, usedBy: "Every transactional email" },
  { key: "extraRecipients", category: "email", label: "Extra recipients for request alerts", description: "Up to 5 addresses, separated by commas. They also receive alerts for new sample, custom list, contact and category requests. Payment and security alerts never go to them.", type: "emails", default: "", max: 400, usedBy: "Owner alerts for form requests" },
  { key: "notifySample", category: "email", label: "Alert: free sample requested", description: "Email the owner for every new sample request.", type: "boolean", default: "true", max: 5, usedBy: "Sample request alert" },
  { key: "notifyContact", category: "email", label: "Alert: contact form submitted", description: "Email the owner for every new contact message.", type: "boolean", default: "true", max: 5, usedBy: "Contact form alert" },
  { key: "notifyCategory", category: "email", label: "Alert: category requested", description: "Email the owner for every new category request.", type: "boolean", default: "true", max: 5, usedBy: "Category request alert" },
  { key: "notifyDelivered", category: "email", label: "Alert: list delivered", description: "Email the owner each time a list link is sent to a buyer.", type: "boolean", default: "true", max: 5, usedBy: "Delivery completed alert" },
];

export const defOf = (key: string) => SETTINGS.find((s) => s.key === key);

const url = z.string().trim().refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !/[\s<>"\\]/.test(v)) || /^https:\/\/[^\s<>"\\]+$/i.test(v), "Use a path starting with / or an https:// address.");

/** Validates one value for its definition. Returns the cleaned string or throws a ZodError with a readable message. */
export function parseValue(def: SettingDef, raw: unknown): string {
  const label = def.label;
  if (def.type === "boolean") return z.enum(["true", "false"], { message: `${label} must be on or off.` }).parse(String(raw));
  if (def.type === "email") { const v = z.string().trim().toLowerCase().max(def.max).parse(raw); if (v && !z.string().email().safeParse(v).success) throw new z.ZodError([{ code: "custom", path: [def.key], message: `${label} is not a valid email address.` }]); return v; }
  if (def.type === "emails") {
    const list = z.string().max(def.max).parse(raw).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (list.length > 5) throw new z.ZodError([{ code: "custom", path: [def.key], message: `${label}: use at most 5 addresses.` }]);
    for (const a of list) if (!z.string().email().safeParse(a).success) throw new z.ZodError([{ code: "custom", path: [def.key], message: `"${a}" is not a valid email address.` }]);
    return [...new Set(list)].join(", ");
  }
  if (def.key === "senderName" && /[<>",;\r\n]/.test(String(raw))) throw new z.ZodError([{ code: "custom", path: [def.key], message: `${label} cannot contain < > " , ; or line breaks.` }]);
  const base = z.string({ message: `${label} must be text.` }).trim().max(def.max, `${label} is longer than ${def.max} characters.`);
  const v = def.type === "url" ? base.pipe(url).parse(raw) : base.parse(raw);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw new z.ZodError([{ code: "custom", path: [def.key], message: `${label} contains invalid characters.` }]);
  return v;
}

export const settingsIn = (category: CategoryId) => SETTINGS.filter((s) => s.category === category);
