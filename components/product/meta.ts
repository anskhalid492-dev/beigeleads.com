import { Building2, Globe, Link2, Mail, MapPin, MapPinned, Phone, type LucideIcon } from "lucide-react";

/** Icon, group and one-line meaning for each field a list can contain. Unknown fields still render. */
export const fieldMeta: Record<string, { icon: LucideIcon; group: "Business" | "Location" | "Contact"; text: string }> = {
  "Business name": { icon: Building2, group: "Business", text: "The registered or trading name of the business." },
  Address: { icon: MapPin, group: "Location", text: "Street address of the business." },
  City: { icon: MapPinned, group: "Location", text: "City, so you can buy or filter by place." },
  Country: { icon: Globe, group: "Location", text: "Country the business operates in." },
  Phone: { icon: Phone, group: "Contact", text: "Business phone number." },
  Email: { icon: Mail, group: "Contact", text: "Business email address, checked by our team." },
  Website: { icon: Link2, group: "Contact", text: "The business's own website." },
};

export const groupOrder = ["Business", "Location", "Contact"] as const;

export function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export const fmtNum = (n: number | null) => (n === null ? null : n.toLocaleString("en-US"));
