import { z } from "zod";

// Every public form carries a Turnstile token and a honeypot field ("website", must stay empty).
const base = {
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
};

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const sampleSchema = z.object({
  ...base,
  email,
  product: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
});

export const categoryRequestSchema = z.object({
  ...base,
  email,
  requestedCategory: z.string().trim().min(2, "Tell us the category.").max(120),
  details: z.string().trim().max(1000).optional(),
});

export const customListSchema = z.object({
  ...base,
  email,
  category: z.string().trim().min(2, "Tell us which businesses you need.").max(120),
  country: z.string().trim().min(2, "Choose a country.").max(80),
  region: z.string().trim().max(120).optional(),
  quantity: z.number().int().min(1, "Enter how many contacts you need.").max(100_000_000).optional(),
  jobTitles: z.string().trim().max(300).optional(),
  fields: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  notes: z.string().trim().max(2000).optional(),
  originalQuery: z.string().trim().max(300).optional(),
});

export const contactSchema = z.object({
  ...base,
  name: z.string().trim().max(120).optional(),
  email,
  message: z.string().trim().min(5, "Write a short message.").max(3000),
});

export const optOutSchema = z.object({
  ...base,
  email,
});

export type SampleInput = z.infer<typeof sampleSchema>;
export type CategoryRequestInput = z.infer<typeof categoryRequestSchema>;
export type CustomListInput = z.infer<typeof customListSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type OptOutInput = z.infer<typeof optOutSchema>;

export const newsletterSchema = z.object({ ...base, email });
