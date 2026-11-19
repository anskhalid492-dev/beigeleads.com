import { z } from "zod";

/** Inquiry types shown in the form. `order` types show the optional order-number field. */
export const INQUIRY_TYPES = [
  { value: "general", label: "General Question", order: false },
  { value: "product", label: "Product Inquiry", order: false },
  { value: "order", label: "Order Support", order: true },
  { value: "payment", label: "Payment Issue", order: true },
  { value: "custom", label: "Custom Data", order: false },
  { value: "other", label: "Other", order: false },
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];
export const inquiryLabel = (v: string) => INQUIRY_TYPES.find((t) => t.value === v)?.label ?? v;
export const isOrderType = (v: string) => INQUIRY_TYPES.find((t) => t.value === v)?.order ?? false;

export const STATUSES = ["new", "in_progress", "resolved", "closed"] as const;
export const STATUS_LABEL = { new: "New", in_progress: "In progress", resolved: "Resolved", closed: "Closed" } as const;

const typeValues = INQUIRY_TYPES.map((t) => t.value) as [InquiryType, ...InquiryType[]];
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const contactInquirySchema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email,
  inquiryType: z.enum(typeValues, { error: "Choose what your message is about." }),
  orderNumber: z.string().trim().max(60).regex(/^[A-Za-z0-9#\-_ ]*$/, "Use letters, numbers and dashes only.").optional(),
  subject: z.string().trim().min(3, "Add a short subject.").max(150),
  message: z.string().trim().min(10, "Write at least a sentence so we can help.").max(3000),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
