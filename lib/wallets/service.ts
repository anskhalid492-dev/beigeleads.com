import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { notifyOwner } from "@/lib/forms/email";
import { mask, validateWalletValue, type WalletKind } from "./validate";

export const ACTIVATION_DELAY_MS = 24 * 3600 * 1000;
type Env = CloudflareEnv;

export async function listWallets() {
  return getDb().select().from(schema.wallets).orderBy(desc(schema.wallets.id));
}
export async function listAudit(limit = 30) {
  return getDb().select().from(schema.walletAuditLog).orderBy(desc(schema.walletAuditLog.id)).limit(limit);
}

/** A wallet receives payments only when enabled AND its activation time has passed. */
export const isActive = (w: { enabled: boolean; activatesAt: Date }, now = Date.now()) => w.enabled && w.activatesAt.getTime() <= now;

export async function addWallet(env: Env, actor: string, kind: WalletKind, value: string, minConfirmations: number) {
  const clean = validateWalletValue(kind, value);
  if (!Number.isInteger(minConfirmations) || minConfirmations < 1 || minConfirmations > 100) throw new Error("Confirmations must be 1-100.");
  const db = getDb();
  const activatesAt = new Date(Date.now() + ACTIVATION_DELAY_MS);
  const [w] = await db.insert(schema.wallets).values({ coin: kind.coin, network: kind.network, addressOrXpub: clean, enabled: false, activatesAt, minConfirmations }).returning();
  await db.insert(schema.walletAuditLog).values({ walletId: w.id, actor, action: "add", oldValue: null, newValue: `${kind.coin}/${kind.network} ${mask(clean)}` });
  await notifyOwner(env, "Wallet added", `${actor} added ${kind.coin} ${kind.network} wallet ${mask(clean)}. It starts disabled; once enabled it activates 24h later. If this was not you, act now.`);
  return w;
}

/** Enabling (or re-enabling) restarts the 24h delay. Disabling is immediate. */
export async function setWalletEnabled(env: Env, actor: string, id: number, enabled: boolean) {
  const db = getDb();
  const [w] = await db.select().from(schema.wallets).where(eq(schema.wallets.id, id));
  if (!w) throw new Error("Wallet not found.");
  if (w.enabled === enabled) return w;
  const activatesAt = enabled ? new Date(Date.now() + ACTIVATION_DELAY_MS) : w.activatesAt;
  await db.update(schema.wallets).set({ enabled, activatesAt }).where(eq(schema.wallets.id, id));
  await db.insert(schema.walletAuditLog).values({ walletId: id, actor, action: enabled ? "enable" : "disable", oldValue: String(w.enabled), newValue: String(enabled) });
  await notifyOwner(env, `Wallet ${enabled ? "enabled" : "disabled"}`, `${actor} ${enabled ? "enabled" : "disabled"} ${w.coin} ${w.network} wallet ${mask(w.addressOrXpub)}.${enabled ? " It activates in 24h." : ""}`);
  return { ...w, enabled, activatesAt };
}
