"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { addOptout, verifyOptout } from "@/lib/followups/tokens";

/** Runs on a button press (POST), never on page load, so mail scanners cannot opt anyone out. */
export async function optOutAction(email: string, token: string): Promise<boolean> {
  const { env } = getCloudflareContext();
  const e = String(email).trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || !(await verifyOptout(env, e, String(token)))) return false;
  try { await addOptout(env, e); return true; } catch { return false; }
}
