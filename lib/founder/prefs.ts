// Customer email preferences (CLAUDE.md section 173). Account-free: a signed link per address. Unsubscribe-all writes the SAME
// shared opt-out list the review and sample follow-ups use, so it applies to all three founder sender addresses at once.
import { addOptout, emailHash, verifyOptout } from "@/lib/followups/tokens";
import { PREF_KEYS } from "./config";
import { DEFAULT_PREFS, lc, loadPrefs, type PrefRow } from "./data";

type Env = Pick<CloudflareEnv, "DB"> & Partial<Pick<CloudflareEnv, "HASH_SALT">>;
const list = (v: string[]) => v.map((x) => x.trim().toLowerCase().replace(/[^a-z0-9 \-]/g, "").slice(0, 40)).filter(Boolean).slice(0, 10).join(",");

export async function savePrefs(env: Env, email: string, token: string, input: Partial<PrefRow>): Promise<boolean> {
  const e = lc(email);
  if (!(await verifyOptout(env, e, token))) return false;
  const cur = await loadPrefs(env, e);
  const n = { ...cur, ...input };
  try {
    await env.DB.prepare(`INSERT INTO cs_prefs (email_hash, recs, products, founder, education, offers, frequency, countries, industries, unsub_all, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?, unixepoch())
      ON CONFLICT(email_hash) DO UPDATE SET recs=excluded.recs, products=excluded.products, founder=excluded.founder, education=excluded.education, offers=excluded.offers, frequency=excluded.frequency, countries=excluded.countries, industries=excluded.industries, unsub_all=excluded.unsub_all, updated_at=excluded.updated_at`)
      .bind(await emailHash(env, e), +n.recs, +n.products, +n.founder, +n.education, +n.offers, n.frequency === "less" ? "less" : "normal", list(n.countries), list(n.industries), +n.unsubAll).run();
    if (n.unsubAll) await addOptout(env, e);
    return true;
  } catch { return false; }
}
export async function unsubscribeAll(env: Env, email: string, token: string): Promise<boolean> { return savePrefs(env, email, token, { unsubAll: true }); }
/** Starts optional emails again. Only on an explicit press with a valid link. */
export async function resubscribe(env: Env, email: string, token: string): Promise<boolean> {
  const e = lc(email);
  if (!(await verifyOptout(env, e, token))) return false;
  try { await env.DB.prepare("DELETE FROM courtesy_optouts WHERE email_hash = ?").bind(await emailHash(env, e)).run(); } catch { /* table may not exist */ }
  return savePrefs(env, e, token, { unsubAll: false });
}
export { PREF_KEYS, DEFAULT_PREFS };
