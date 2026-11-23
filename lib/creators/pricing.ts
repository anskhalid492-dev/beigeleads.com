import { MAX_QUANTITY, PRICE_PER_CONTACT_CENTS } from "./config";

/** Whole-number quantity or null. Rejects 0, negatives, decimals, text and anything above the database size. */
export function parseQuantity(v: unknown): number | null {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.replace(/[,\s]/g, "") : "";
  if (!/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX_QUANTITY ? n : null;
}
/** Integer cents: no floating-point drift. No discounts, no minimum charge. */
export const estimateCents = (quantity: number) => quantity * PRICE_PER_CONTACT_CENTS;
export const formatEstimate = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
