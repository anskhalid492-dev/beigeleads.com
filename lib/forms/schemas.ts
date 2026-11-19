import { z } from "zod";

export { customListSchema, type CustomListInput } from "@/lib/custom-list/schema";

// Every public form carries a Turnstile token and a honeypot field ("website", must stay empty).
const base = {
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
};

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const sampleSchema = z
  .object({
    ...base,
    email,
    product: z.string().trim().max(80).optional(),
    /** Free text for "can't find your list" (also receives a category name from ?category=). */
    custom: z.string().trim().max(300).optional(),
    category: z.string().trim().max(80).optional(),
  })
  .refine((d) => !!(d.product || d.custom || d.category), { message: "Choose a list or tell us what you need.", path: ["product"] });

export const categoryRequestSchema = z.object({
  ...base,
  email,
  requestedCategory: z.string().trim().min(2, "Tell us the category.").max(120),
  details: z.string().trim().max(1000).optional(),
});

export const optOutSchema = z.object({
  ...base,
  email,
});

export type SampleInput = z.infer<typeof sampleSchema>;
export type CategoryRequestInput = z.infer<typeof categoryRequestSchema>;
export type OptOutInput = z.infer<typeof optOutSchema>;

export const newsletterSchema = z.object({ ...base, email });
