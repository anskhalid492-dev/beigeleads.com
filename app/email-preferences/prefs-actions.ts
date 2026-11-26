"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resubscribe, savePrefs, unsubscribeAll } from "@/lib/founder/prefs";
import type { PrefRow } from "@/lib/founder/data";

const s = (v: unknown) => String(v).trim().toLowerCase().slice(0, 254);
export async function savePrefsAction(email: string, token: string, p: PrefRow): Promise<boolean> {
  return savePrefs(getCloudflareContext().env, s(email), String(token), { recs: !!p.recs, products: !!p.products, founder: !!p.founder, education: !!p.education, offers: !!p.offers, frequency: p.frequency === "less" ? "less" : "normal", countries: Array.isArray(p.countries) ? p.countries.map(String) : [], industries: Array.isArray(p.industries) ? p.industries.map(String) : [], unsubAll: false });
}
export async function unsubscribeAction(email: string, token: string): Promise<boolean> { return unsubscribeAll(getCloudflareContext().env, s(email), String(token)); }
export async function resubscribeAction(email: string, token: string): Promise<boolean> { return resubscribe(getCloudflareContext().env, s(email), String(token)); }
