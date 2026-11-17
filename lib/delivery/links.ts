import { and, eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

/** Only https links are accepted: the owner pastes them, buyers click them from an email. */
export function parseDeliveryUrl(raw: string): string {
  const v = raw.trim();
  let u: URL;
  try { u = new URL(v); } catch { throw new Error("That is not a valid link."); }
  if (u.protocol !== "https:") throw new Error("The link must start with https://");
  if (v.length > 2000) throw new Error("The link is too long.");
  return u.toString();
}

/** Exact package link first, then the product-wide link (package ''). */
export async function findDeliveryLink(env: CloudflareEnv, productSlug: string, packageName: string): Promise<string | null> {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.deliveryLinks).where(eq(schema.deliveryLinks.productSlug, productSlug));
  return (rows.find((r) => r.packageName === packageName) ?? rows.find((r) => r.packageName === ""))?.url ?? null;
}

export async function setDeliveryLink(env: CloudflareEnv, actor: string, productSlug: string, packageName: string, rawUrl: string | null) {
  const db = getDbFromEnv(env);
  const where = and(eq(schema.deliveryLinks.productSlug, productSlug), eq(schema.deliveryLinks.packageName, packageName));
  if (!rawUrl || !rawUrl.trim()) {
    await db.delete(schema.deliveryLinks).where(where);
    return "removed";
  }
  const url = parseDeliveryUrl(rawUrl);
  await db.insert(schema.deliveryLinks).values({ productSlug, packageName, url, updatedBy: actor })
    .onConflictDoUpdate({ target: [schema.deliveryLinks.productSlug, schema.deliveryLinks.packageName], set: { url, updatedBy: actor, updatedAt: new Date() } });
  return "saved";
}
