import type { WizardState } from "./state";
import { COUNTRIES, REGIONS } from "@/lib/custom-list/data";

type Initial = { q: string; category: string; categoryText: string; quantity: string; country: string; countryText: string; region: string };
const titleCase = (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase());
const COUNTRY_ALIASES: Record<string, string> = { us: "United States", usa: "United States", america: "United States", uk: "United Kingdom", england: "United Kingdom", uae: "United Arab Emirates" };

/** What we understood from the Co-Pilot search. Only reliable parts; the customer can remove or change all of it. */
export function prefillFromSearch(p: Initial, categories: readonly { slug: string; name: string }[]): Partial<WizardState> {
  const out: Partial<WizardState> = {};
  const cat = categories.find((c) => c.slug === p.category)?.name ?? (p.categoryText ? titleCase(p.categoryText) : "");
  if (cat) out.industries = [cat];
  const raw = (p.countryText || (p.country === "united-states" || p.country === "us" ? "us" : "")).trim().toLowerCase().replace(/-/g, " ");
  const country = COUNTRY_ALIASES[raw] ?? COUNTRIES.find((c) => c.toLowerCase() === raw) ?? "";
  if (country) out.locations = [{ country, whole: !p.region, regions: p.region && (REGIONS[country] ?? []).some((r) => r.toLowerCase() === p.region.toLowerCase()) ? [titleCase(p.region)] : [], cities: p.region && !(REGIONS[country] ?? []).some((r) => r.toLowerCase() === p.region.toLowerCase()) ? [p.region] : [] }];
  else if (p.region) out.locations = [];
  const q = Number(p.quantity);
  if (Number.isInteger(q) && q > 0) out.quantity = String(q);
  return out;
}

