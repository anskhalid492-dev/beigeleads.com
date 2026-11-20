// Types only. The site shows REAL masked sample rows entered by the owner (per product, or the one site-wide default sample).
// No fictional rows exist in the code any more (section 99).
export type SampleRow = readonly [business: string, location: string, email: string, phone: string];
export const sampleColumns = ["Business", "Location", "Email", "Phone"] as const;
export type ProductSampleRow = { business: string; address: string; city: string; phone: string; email: string; website: string };
