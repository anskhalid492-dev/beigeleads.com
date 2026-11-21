// Onboarding form (pure validation). No credential fields exist; text that looks like a pasted password/key is refused.
import { z } from "zod";
const t = (max: number) => z.string().trim().max(max);
export const SECRET_LIKE = /(pass(word|wd|code)?|pwd|api[_ -]?key|secret|token|2fa|otp)\s*[:=]/i;
const safe = (max: number) => t(max).refine((v) => !SECRET_LIKE.test(v), "Please remove passwords or keys. We never need them in this form.");
export const onboardingSchema = z.object({
  contactName: safe(120).pipe(z.string().min(2, "Enter your name.")),
  businessName: safe(160).pipe(z.string().min(2, "Enter your business name.")),
  website: safe(200).pipe(z.string().min(3, "Enter your website.")),
  offer: safe(1500).pipe(z.string().min(10, "Describe what you sell.")),
  icp: safe(1500).pipe(z.string().min(10, "Describe who you want to reach (industries, roles, company size).")),
  countries: safe(300).pipe(z.string().min(2, "Name the countries you want to target.")),
  exclusions: safe(1000),
  goals: safe(1500),
  infrastructure: safe(1000),
  senderNames: safe(300),
  jurisdictions: safe(300).pipe(z.string().min(2, "State where you operate and where recipients are.")),
  lawfulBasis: safe(1000).pipe(z.string().min(10, "Describe your lawful basis or permission for B2B outreach.")),
  suppression: safe(1000),
  authorized: z.literal(true, { error: "You must confirm you are authorised to use this business and domain." }),
  lawful: z.literal(true, { error: "You must confirm the outreach will follow anti-spam laws (opt-out in every message, honest sender details)." }),
  website2: z.string().max(0).optional(),
});
export type Onboarding = z.infer<typeof onboardingSchema>;
