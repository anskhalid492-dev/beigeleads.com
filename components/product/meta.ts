import { Building2, Clock, Globe, Link2, Mail, MapPin, MapPinned, Phone, Share2, type LucideIcon } from "lucide-react";
import { ALL_FIELD_GROUPS, FIELD_CATALOG, LOCAL_FIELD_CATALOG, type FieldGroup } from "@/lib/product-fields";

/** Icon, group and one-line meaning for each field a list can contain. Unknown fields still render. */
const GROUP_ICON: Record<FieldGroup, LucideIcon> = { Business: Building2, Location: MapPin, Contact: Phone, "Online presence": Share2, Operations: Clock, "Google listing": MapPinned };
const SPECIAL: Record<string, LucideIcon> = { City: MapPinned, Country: Globe, Email: Mail, Website: Link2 };
export const fieldMeta: Record<string, { icon: LucideIcon; group: FieldGroup; text: string }> = Object.fromEntries(
  [...LOCAL_FIELD_CATALOG, ...FIELD_CATALOG].map((f) => [f.name, { icon: SPECIAL[f.name] ?? GROUP_ICON[f.group], group: f.group, text: f.text }]).reverse(),
);

export const groupOrder = ALL_FIELD_GROUPS;

export function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Whole numbers up to 999,999; from one million up: 1M+, 10M+ (rounded down). */
export const fmtNum = (n: number | null) => (n === null ? null : n >= 1_000_000 ? `${Math.floor(n / 1_000_000)}M+` : n.toLocaleString("en-US"));
