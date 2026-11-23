import { z } from "zod";
import { FOLLOWER_RANGES, PLATFORMS } from "./config";
import { parseQuantity } from "./pricing";

const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max);
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));
const ranges = FOLLOWER_RANGES.map((r) => r.value) as [string, ...string[]];

export const creatorInquirySchema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
  platforms: z.array(z.enum(PLATFORMS)).min(1, "Choose at least one platform.").max(PLATFORMS.length).transform((a) => [...new Set(a)]),
  niche: text(2, 120, "Tell us the creator niche."),
  country: text(2, 120, "Enter a country or region."),
  followerRange: z.enum(ranges, { error: "Choose a follower range." }),
  quantity: z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = parseQuantity(v);
    if (n === null) { ctx.addIssue({ code: "custom", message: "Enter a whole number of contacts, from 1 to 10,000,000." }); return z.NEVER; }
    return n;
  }),
  name: text(2, 120, "Enter your full name."),
  email,
  company: opt(120),
  language: opt(80),
  audienceGeo: opt(200),
  engagement: opt(300),
  notes: opt(2000),
});
export type CreatorInquiryInput = z.infer<typeof creatorInquirySchema>;
