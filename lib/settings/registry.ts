import { z } from "zod";

/**
 * Every editable setting is declared here: type, default, validation, who may change it and where it is really used.
 * A setting without a real consumer is not added. Secrets and wallet data never belong here.
 */
export type SettingType = "text" | "longtext" | "boolean" | "url";
export type SettingDef = {
  key: string; category: CategoryId; label: string; description: string; type: SettingType;
  default: string; max: number; /** Where this value changes something real. */ usedBy: string;
};

export const CATEGORIES = [
  { id: "general", label: "General Settings", text: "Website name and announcement banner.", live: true },
  { id: "branding", label: "Branding & Appearance", text: "Logos, favicon and social image.", live: false },
  { id: "navigation", label: "Website & Navigation", text: "Header and footer links, CTAs.", live: false },
  { id: "business", label: "Business Information", text: "Public business profile.", live: false },
  { id: "email", label: "Email & Notifications", text: "Senders, recipients and test email.", live: false },
  { id: "forms", label: "Forms & Lead Management", text: "Sample, custom list, contact and category forms.", live: false },
  { id: "blog", label: "Blog & Content", text: "Blog display defaults.", live: false },
  { id: "seo", label: "SEO Defaults", text: "Managed in the SEO Manager.", live: true, href: "/admin/seo/settings" },
  { id: "payments", label: "Payments & Checkout", text: "Status only. Wallets stay in their protected screen.", live: false },
  { id: "orders", label: "Orders & Delivery", text: "Delivery messaging and alerts.", live: false },
  { id: "integrations", label: "Integrations", text: "Verified status of connected services.", live: false },
  { id: "security", label: "Security & Access", text: "Your session, access policy and recent changes.", live: false },
  { id: "privacy", label: "Privacy & Compliance", text: "Policies and opt-out handling.", live: false },
  { id: "maintenance", label: "Maintenance & Performance", text: "Health checks and cache actions.", live: false },
  { id: "audit", label: "System Logs & Audit History", text: "Every settings change, newest first.", live: true },
  { id: "backup", label: "Backup & Data Management", text: "Backup capabilities and guidance.", live: false },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const SETTINGS: SettingDef[] = [
  { key: "siteName", category: "general", label: "Website name", description: "Shown as the site name on blog share cards (Open Graph).", type: "text", default: "BeigeLeads", max: 60, usedBy: "Blog article social cards" },
  { key: "bannerEnabled", category: "general", label: "Show announcement banner", description: "Shows a one-line banner above the header on public pages.", type: "boolean", default: "false", max: 5, usedBy: "Public banner" },
  { key: "bannerText", category: "general", label: "Banner text", description: "One short sentence. Plain text only.", type: "text", default: "", max: 140, usedBy: "Public banner" },
  { key: "bannerLink", category: "general", label: "Banner link (optional)", description: "A path like /sample or an https:// address. Leave empty for no link.", type: "url", default: "", max: 300, usedBy: "Public banner" },
];

export const defOf = (key: string) => SETTINGS.find((s) => s.key === key);

const url = z.string().trim().refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !/[\s<>"\\]/.test(v)) || /^https:\/\/[^\s<>"\\]+$/i.test(v), "Use a path starting with / or an https:// address.");

/** Validates one value for its definition. Returns the cleaned string or throws a ZodError with a readable message. */
export function parseValue(def: SettingDef, raw: unknown): string {
  const label = def.label;
  if (def.type === "boolean") return z.enum(["true", "false"], { message: `${label} must be on or off.` }).parse(String(raw));
  const base = z.string({ message: `${label} must be text.` }).trim().max(def.max, `${label} is longer than ${def.max} characters.`);
  const v = def.type === "url" ? base.pipe(url).parse(raw) : base.parse(raw);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw new z.ZodError([{ code: "custom", path: [def.key], message: `${label} contains invalid characters.` }]);
  return v;
}

export const settingsIn = (category: CategoryId) => SETTINGS.filter((s) => s.category === category);
