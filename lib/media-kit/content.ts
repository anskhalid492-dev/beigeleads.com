import { BRAND_FILES, BRAND_ZIPS } from "./manifest";

/** Page copy. Kept in one place so the admin editor (later) can override these fields. */
export const MEDIA_KIT = {
  title: "The BeigeLeads Brand, Ready to Share.",
  intro:
    "Download the official BeigeLeads logos, colors and guidelines. Use them when you write about us, link to us or list us. Everything here is free to use as described in the guidelines.",
  about: [
    "BeigeLeads is a B2B data provider. Buyers choose a ready-made contact list or request a custom one, pay once in crypto, and receive the file as CSV, Excel or TXT. There is no subscription and no account to create.",
    "The logo is a custom-drawn B in a rounded tile. Its top-left corner is cut like a card tag, and the counters are a dot above a bar: a lead above its record, so the letter reads as one row of a contact list.",
  ],
  contactNote: "Need a different size, format or a brand question answered? Send us a message and we will reply by email.",
};

export const fmt = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
export const fileSize = (path: string) => (BRAND_FILES[path] ? fmt(BRAND_FILES[path]) : "");

export type Variant = { id: string; label: string; bg: string; note: string };
export const VARIANTS: Variant[] = [
  { id: "light", label: "Full color", bg: "bg-white", note: "Default. For light backgrounds." },
  { id: "dark", label: "Reversed", bg: "bg-forest-900", note: "For dark green or dark backgrounds." },
  { id: "mono", label: "One color, dark", bg: "bg-white", note: "Single ink, for print or stamps." },
  { id: "mono-white", label: "One color, white", bg: "bg-forest-900", note: "Single white ink on dark." },
];
export const KINDS = [
  { id: "horizontal", label: "Horizontal logo" },
  { id: "stacked", label: "Stacked logo" },
  { id: "symbol", label: "Symbol" },
] as const;

export const COLORS = [
  { name: "Forest 900", hex: "#0f2a1d", use: "Headings, navigation, logo tile" },
  { name: "Forest 700", hex: "#1b4332", use: "Body text" },
  { name: "Forest 500", hex: "#2d6a4f", use: "Secondary accents, “Leads” in the wordmark" },
  { name: "Forest 300", hex: "#8fd0a9", use: "“Leads” on dark backgrounds" },
  { name: "Sand 50", hex: "#fbf8f1", use: "Page background" },
  { name: "Sand 200", hex: "#e8dec6", use: "Borders and dividers" },
  { name: "Purple 600", hex: "#7c3aed", use: "Primary action buttons only. Not part of the logo." },
];

export const ZIPS = [
  { file: "beigeleads-brand-kit.zip", name: "Brand Kit", desc: "Everything: logos, favicons, social images, email logo and the guidelines PDF." },
  { file: "beigeleads-logo-pack.zip", name: "Logo Pack", desc: "All logo variants as SVG and transparent PNG." },
  { file: "beigeleads-favicon-pack.zip", name: "Favicon Pack", desc: "favicon.ico, SVG, 16/32/48 px PNG, Apple touch and Android icons." },
  { file: "beigeleads-social-assets.zip", name: "Social Assets", desc: "Profile icon, social sharing image (1200×630) and email signature logo." },
].map((z) => ({ ...z, href: `/brand/zips/${z.file}`, size: fmt(BRAND_ZIPS[z.file]?.bytes ?? 0), count: BRAND_ZIPS[z.file]?.files ?? 0 }));

export const PDF = { href: "/brand/guidelines/beigeleads-brand-guidelines.pdf", size: fileSize("guidelines/beigeleads-brand-guidelines.pdf") };

export const DONTS = [
  { label: "Do not stretch or squash", style: { transform: "scaleX(1.5)" } },
  { label: "Do not rotate", style: { transform: "rotate(-12deg)" } },
  { label: "Do not recolor", style: { filter: "hue-rotate(200deg) saturate(3)" } },
  { label: "Do not add shadows or effects", style: { filter: "drop-shadow(6px 6px 4px rgba(0,0,0,.5))" } },
];
