import type { Block, Style } from "@/lib/system-emails/types";

export type LibItem = { id: string; label: string; hint: string; make: (allowed: Set<string>) => Block };

const rows = (allowed: Set<string>, all: [string, string][]) => {
  const r = all.filter(([k]) => allowed.has(k)).map(([k, label]) => ({ label, value: `{{${k}}}` }));
  return r.length ? r : [{ label: "Label:", value: "" }];
};

/** The block library. "Order summary", "Product details" and "Download button" are presets that only use variables this email can supply. */
export const LIBRARY: LibItem[] = [
  { id: "logo", label: "Official logo", hint: "BeigeLeads logo", make: () => ({ t: "logo", size: "md", style: { align: "left" } }) },
  { id: "heading", label: "Heading", hint: "Section title", make: () => ({ t: "heading", text: "New heading" }) },
  { id: "p", label: "Paragraph", hint: "Body text", make: () => ({ t: "p", text: "Write your message here." }) },
  { id: "image", label: "Image", hint: "Needs an https or /media address", make: () => ({ t: "image", src: "", alt: "", width: "md", style: { align: "left" } }) },
  { id: "button", label: "CTA button", hint: "Link button", make: () => ({ t: "button", label: "Open", url: "/", variant: "primary" }) },
  { id: "order", label: "Order summary", hint: "Order details table", make: (a) => ({ t: "kv", rows: rows(a, [["order_number", "Order number:"], ["product_name", "Product:"], ["package_name", "Package:"], ["order_total", "Total:"], ["payment_status", "Payment status:"]]) }) },
  { id: "product", label: "Product details", hint: "List details table", make: (a) => ({ t: "kv", rows: rows(a, [["product_name", "List:"], ["package_name", "Package:"], ["records", "Records:"], ["industry", "Industry:"], ["country", "Location:"], ["quantity", "Quantity:"]]) }) },
  { id: "download", label: "Download button", hint: "Links to the delivery link", make: (a) => ({ t: "button", label: "Download My List", url: a.has("download_url") ? "{{download_url}}" : "/", variant: "primary" }) },
  { id: "list", label: "Bullet list", hint: "Short points", make: () => ({ t: "list", items: ["First point", "Second point"] }) },
  { id: "note", label: "Highlighted note", hint: "Green callout", make: () => ({ t: "note", text: "A short note worth noticing." }) },
  { id: "divider", label: "Divider", hint: "Thin line", make: () => ({ t: "divider" }) },
  { id: "spacer", label: "Spacer", hint: "Empty space", make: () => ({ t: "spacer", size: "md" }) },
  { id: "columns", label: "Columns", hint: "Two columns, stack on phones", make: () => ({ t: "columns", left: "Left column", right: "Right column" }) },
  { id: "social", label: "Social links", hint: "Only links you add", make: () => ({ t: "social", links: [] }) },
  { id: "support", label: "Support information", hint: "Contact lines", make: () => ({ t: "support", text: "Questions? Reply to this email or use our contact page." }) },
  { id: "footnote", label: "Footer note", hint: "Small print", make: () => ({ t: "footnote", text: "You are receiving this because of an action you took on beigeleads.com." }) },
];

export const BLOCK_NAME: Record<Block["t"], string> = {
  p: "Paragraph", list: "Bullet list", kv: "Details table", note: "Highlighted note", heading: "Heading", image: "Image", button: "Button", divider: "Divider",
  spacer: "Spacer", columns: "Columns", social: "Social links", support: "Support information", logo: "Logo", footnote: "Footer note",
};

/** Which style controls make sense per block (only these are shown in the properties panel). */
export const STYLE_CONTROLS: Record<Block["t"], (keyof Style)[]> = {
  p: ["align", "size", "bold", "tone", "radius", "pad"], list: ["size", "bold", "tone", "radius", "pad"], kv: ["radius"], note: ["align", "size", "bold", "tone", "radius", "pad"],
  heading: ["align", "size", "bold", "tone", "radius", "pad"], image: ["align", "radius"], button: ["align", "radius"], divider: [], spacer: [],
  columns: ["size", "tone", "radius", "pad"], social: ["align", "tone", "radius", "pad"], support: ["align", "size", "tone", "radius", "pad"], logo: ["align"], footnote: ["align"],
};
