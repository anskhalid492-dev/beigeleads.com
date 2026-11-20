import { z } from "zod";

export const BUSINESS_TYPES = [
  { value: "agency", label: "Marketing or lead generation agency" },
  { value: "sales-team", label: "Sales or outsourced SDR team" },
  { value: "consultant", label: "Consultant or freelancer" },
  { value: "data-reseller", label: "Data reseller or broker" },
  { value: "software", label: "Software or SaaS company" },
  { value: "recruiter", label: "Recruitment or staffing firm" },
  { value: "other", label: "Other" },
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];
export const businessTypeLabel = (v: string) => BUSINESS_TYPES.find((t) => t.value === v)?.label ?? v;

export const PARTNER_STATUSES = ["pending", "under_review", "approved", "declined"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];
export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = { pending: "Pending", under_review: "Under review", approved: "Approved", declined: "Declined" };

/** Percent off for an approved partner. One fixed value on purpose: no tiers, no editable rate. */
export const PARTNER_PERCENT = 50;

const typeValues = BUSINESS_TYPES.map((t) => t.value) as [BusinessType, ...BusinessType[]];
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid business email address.").max(254));

/** Website must be a real http(s) address. A bare "example.com" is accepted and stored as https://example.com. */
export function cleanWebsite(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > 300) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || /\s/.test(u.hostname)) return null;
    return u.toString().replace(/\/$/, "");
  } catch { return null; }
}

export const partnerApplicationSchema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(), // honeypot (named like the contact form's)
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  businessName: z.string().trim().min(2, "Enter your business name.").max(160),
  email,
  websiteUrl: z.string().trim().min(3, "Enter your website address.").max(300).refine((v) => cleanWebsite(v) !== null, "Enter a valid website address, like example.com."),
  country: z.string().trim().min(2, "Enter your country.").max(80),
  businessType: z.enum(typeValues, { error: "Choose your business type." }),
  resalePlan: z.string().trim().min(20, "Tell us a little more (at least a sentence) about how you plan to resell.").max(2000),
  monthlyVolume: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  terms: z.literal(true, { error: "Accept the Partner Program Terms to apply." }),
});
export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

/** True for the personal codes created at approval (PARTNER-XXXX-XXXX). Other codes are public promotion codes. */
export const isPartnerCode = (raw: string) => /^PARTNER-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(raw.trim().toUpperCase().replace(/\s+/g, ""));
