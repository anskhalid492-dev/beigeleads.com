// Partner discount codes: created only when an admin approves an application, bound to the partner's email,
// deactivatable. The browser never decides a price; checkout and the cart price API call `resolveDiscount`.
import { and, eq, sql } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import { PARTNER_PERCENT } from "./types";

type Db = ReturnType<typeof getDbFromEnv>;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** PARTNER-XXXX-XXXX from 8 random characters (about 39 bits). */
export function newPartnerCode(bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(8))): string {
  const c = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `PARTNER-${c.slice(0, 4)}-${c.slice(4)}`;
}
export const normalizeCode = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, "");

export type Discount = { code: string; percent: number };
export type DiscountResult = { ok: true; discount: Discount } | { ok: false; reason: string };

/** One message for every failure, so a visitor cannot learn whether a code exists. */
export const DISCOUNT_REFUSED = "This code cannot be used with this email address. Use the code from your approval email with the email you applied with.";

/** Valid only when the code exists, is active, and the order email IS the approved partner's email. */
export async function resolveDiscount(db: Db, rawCode: string, orderEmail: string): Promise<DiscountResult> {
  const code = normalizeCode(rawCode);
  if (!/^PARTNER-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return { ok: false, reason: DISCOUNT_REFUSED };
  let row;
  try { [row] = await db.select().from(schema.partnerDiscounts).where(eq(schema.partnerDiscounts.code, code)).limit(1); } catch { return { ok: false, reason: DISCOUNT_REFUSED }; }
  if (!row || !row.active || row.email !== orderEmail.trim().toLowerCase()) return { ok: false, reason: DISCOUNT_REFUSED };
  // Defence in depth: the application must still be approved.
  const [app] = await db.select({ status: schema.partnerApplications.status }).from(schema.partnerApplications).where(eq(schema.partnerApplications.id, row.applicationId)).limit(1);
  if (app?.status !== "approved") return { ok: false, reason: DISCOUNT_REFUSED };
  return { ok: true, discount: { code: row.code, percent: row.percent } };
}

/** Creates the code for an approved application, or returns the existing one (re-approving never creates a second code). */
export async function ensureDiscount(db: Db, applicationId: number, email: string): Promise<{ code: string; reactivated: boolean }> {
  const [existing] = await db.select().from(schema.partnerDiscounts).where(eq(schema.partnerDiscounts.applicationId, applicationId)).limit(1);
  if (existing) {
    const reactivated = !existing.active;
    if (reactivated) await db.update(schema.partnerDiscounts).set({ active: 1, deactivatedAt: null, email: email.toLowerCase() }).where(eq(schema.partnerDiscounts.id, existing.id));
    return { code: existing.code, reactivated };
  }
  for (let i = 0; i < 5; i++) {
    const code = newPartnerCode();
    try {
      await db.insert(schema.partnerDiscounts).values({ applicationId, code, email: email.toLowerCase(), percent: PARTNER_PERCENT });
      return { code, reactivated: false };
    } catch {
      const [again] = await db.select().from(schema.partnerDiscounts).where(eq(schema.partnerDiscounts.applicationId, applicationId)).limit(1);
      if (again) return { code: again.code, reactivated: false }; // a parallel approval won
    }
  }
  throw new Error("could-not-create-code");
}

export async function setDiscountActive(db: Db, applicationId: number, active: boolean): Promise<void> {
  await db.update(schema.partnerDiscounts).set({ active: active ? 1 : 0, deactivatedAt: active ? null : Math.floor(Date.now() / 1000) }).where(eq(schema.partnerDiscounts.applicationId, applicationId));
}

export async function countUse(db: Db, code: string): Promise<void> {
  await db.update(schema.partnerDiscounts).set({ uses: sql`${schema.partnerDiscounts.uses} + 1` }).where(and(eq(schema.partnerDiscounts.code, code)));
}
