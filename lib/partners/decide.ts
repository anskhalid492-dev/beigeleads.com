// Admin decisions on partner applications. Approving creates the partner's code and sends the approval email once.
import { eq } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { ensureDiscount, setDiscountActive } from "./discount";
import { firstName } from "./submit";
import { PARTNER_PERCENT, type PartnerStatus } from "./types";

type Db = ReturnType<typeof getDbFromEnv>;
export class PartnerError extends Error {}
export type DecisionResult = { status: PartnerStatus; email: "sent" | "failed" | "skipped" | "already-sent" | null };

const out = (r: "sent" | "already-sent" | "skipped" | "failed") => r;

async function load(db: Db, id: number) {
  const [a] = await db.select().from(schema.partnerApplications).where(eq(schema.partnerApplications.id, id)).limit(1);
  if (!a) throw new PartnerError("Application not found.");
  return a;
}

export async function markUnderReview(db: Db, id: number): Promise<void> {
  const a = await load(db, id);
  if (a.status !== "pending") throw new PartnerError("Only a pending application can be marked under review.");
  await db.update(schema.partnerApplications).set({ status: "under_review", updatedAt: Date.now() }).where(eq(schema.partnerApplications.id, id));
}

/** Pending / under review -> approved. Declined applications can be approved later too (a changed decision), which creates the code then. */
export async function approve(env: CloudflareEnv, db: Db, actor: string, id: number): Promise<DecisionResult> {
  const a = await load(db, id);
  if (a.status === "approved") throw new PartnerError("This application is already approved.");
  // The code is created BEFORE the status flips, so an approved partner always has one.
  const { code } = await ensureDiscount(db, a.id, a.email);
  await db.update(schema.partnerApplications).set({ status: "approved", decidedAt: Math.floor(Date.now() / 1000), decidedBy: actor, updatedAt: Date.now() }).where(eq(schema.partnerApplications.id, id));
  const r = out(await sendOnce(env, db, "partner_application_approved", a.email, {
    first_name: firstName(a.fullName), business_name: a.businessName, request_reference: a.reference, partner_code: code, partner_discount: `${PARTNER_PERCENT}%`,
  }, a.reference));
  await db.update(schema.partnerApplications).set({ decisionEmail: r === "already-sent" ? "sent" : r }).where(eq(schema.partnerApplications.id, id));
  return { status: "approved", email: r };
}

/** Declining also deactivates any code the application had (for example after an earlier approval). */
export async function decline(env: CloudflareEnv, db: Db, actor: string, id: number): Promise<DecisionResult> {
  const a = await load(db, id);
  if (a.status === "declined") throw new PartnerError("This application is already declined.");
  await db.update(schema.partnerApplications).set({ status: "declined", decidedAt: Math.floor(Date.now() / 1000), decidedBy: actor, updatedAt: Date.now() }).where(eq(schema.partnerApplications.id, id));
  await setDiscountActive(db, a.id, false);
  const r = out(await sendOnce(env, db, "partner_application_declined", a.email, { first_name: firstName(a.fullName), business_name: a.businessName, request_reference: a.reference }, a.reference));
  await db.update(schema.partnerApplications).set({ decisionEmail: r === "already-sent" ? "sent" : r }).where(eq(schema.partnerApplications.id, id));
  return { status: "declined", email: r };
}

/** Retries the decision email for an already decided application (only sends if it was not sent yet). */
export async function resendDecisionEmail(env: CloudflareEnv, db: Db, id: number): Promise<DecisionResult> {
  const a = await load(db, id);
  if (a.status !== "approved" && a.status !== "declined") throw new PartnerError("Decide the application first.");
  let r: "sent" | "already-sent" | "skipped" | "failed";
  if (a.status === "approved") {
    const { code } = await ensureDiscount(db, a.id, a.email);
    r = await sendOnce(env, db, "partner_application_approved", a.email, { first_name: firstName(a.fullName), business_name: a.businessName, request_reference: a.reference, partner_code: code, partner_discount: `${PARTNER_PERCENT}%` }, a.reference);
  } else {
    r = await sendOnce(env, db, "partner_application_declined", a.email, { first_name: firstName(a.fullName), business_name: a.businessName, request_reference: a.reference }, a.reference);
  }
  await db.update(schema.partnerApplications).set({ decisionEmail: r === "already-sent" ? "sent" : r }).where(eq(schema.partnerApplications.id, id));
  return { status: a.status, email: r };
}

/** Deactivate / reactivate a partner's code. Only an approved partner's code can be active. */
export async function setPartnerDiscount(db: Db, id: number, active: boolean): Promise<void> {
  const a = await load(db, id);
  if (active && a.status !== "approved") throw new PartnerError("Only an approved partner's code can be reactivated.");
  await setDiscountActive(db, a.id, active);
}

export async function pendingCount(db: Db): Promise<number> {
  try {
    return await db.$count(schema.partnerApplications, eq(schema.partnerApplications.status, "pending"));
  } catch { return 0; }
}
