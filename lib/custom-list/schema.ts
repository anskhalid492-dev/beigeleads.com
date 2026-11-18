import { z } from "zod";

export const AUDIENCES = ["Businesses", "Business owners", "Decision makers", "Professionals", "Other"] as const;
export const QUANTITY_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000] as const;

export const FIELD_GROUPS = [
  { title: "Contact information", fields: ["Business email", "Business phone", "Business website", "Contact name", "Job title"] },
  { title: "Company information", fields: ["Company name", "Industry", "Company size", "Company address"] },
  { title: "Location information", fields: ["Country", "State", "City", "Postal code"] },
  { title: "Additional information", fields: ["LinkedIn URL", "Company description"] },
] as const;

const item = (max: number) => z.string().trim().min(1).max(max);
const list = (max: number, itemMax: number) => z.array(item(itemMax)).max(max).default([]);
const optional = (max: number) => z.string().trim().max(max).default("");

export const locationSchema = z.object({
  country: item(80),
  whole: z.boolean().default(false),
  regions: list(20, 80),
  cities: list(30, 80),
});

export const customListSchema = z.object({
  turnstileToken: z.string().min(1, "Please complete the spam check."),
  website: z.string().max(0).optional(),
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  company: optional(120),
  message: optional(1500),
  audience: z.array(z.enum(AUDIENCES)).max(5).default([]),
  industries: z.array(item(80)).min(1, "Choose at least one industry.").max(15),
  jobTitles: list(20, 80),
  targeting: z.object({ companySize: optional(120), specialization: optional(200), businessType: optional(120), revenue: optional(120), other: optional(400) }).default({ companySize: "", specialization: "", businessType: "", revenue: "", other: "" }),
  locations: z.array(locationSchema).min(1, "Choose at least one location.").max(10),
  exclusions: list(15, 80),
  fields: list(20, 40),
  customFields: list(10, 60),
  quantity: z.number().int().min(1, "Enter a quantity of at least 1.").max(100_000_000).optional(),
  quantityPlus: z.boolean().default(false),
  instructions: optional(2000),
  originalQuery: optional(300),
});

export type CustomListInput = z.infer<typeof customListSchema>;
export type LocationInput = z.infer<typeof locationSchema>;

/** One line per location, for emails and summaries: "United States > California > Los Angeles, San Diego". */
export function describeLocation(l: LocationInput): string {
  const parts = [l.country];
  if (l.whole || (!l.regions.length && !l.cities.length)) parts.push(l.whole ? "entire country" : "");
  if (l.regions.length) parts.push(l.regions.join(", "));
  if (l.cities.length) parts.push(l.cities.join(", "));
  return parts.filter(Boolean).join(" > ");
}

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"; // no 0/O/1/I/L/U: easy to read out loud
/** Request reference such as CL-7K2M9QX4. Random, not a counter, so it reveals nothing about volume. */
export function newReference(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(8))): string {
  return "CL-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Same requirement from the same email = same request (double click, retry, back button). */
export async function dedupeKey(d: Pick<CustomListInput, "email" | "industries" | "locations" | "quantity" | "fields" | "jobTitles" | "instructions" | "audience">): Promise<string> {
  const norm = (a: string[]) => [...a].map((x) => x.toLowerCase()).sort().join("|");
  const text = [d.email, norm(d.industries), norm(d.locations.map((l) => describeLocation(l))), d.quantity ?? "", norm(d.fields), norm(d.jobTitles), norm(d.audience), d.instructions.toLowerCase()].join("\n");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
