// Private links for follow-up emails. Tokens are derived (HMAC of an id with HASH_SALT); only the SHA-256 of a review token is stored.
import { sha256Hex } from "@/lib/forms/hash";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(salt: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`fu:${salt}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
}
export const validTok = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{48}$/.test(v);
export const reviewToken = async (env: { HASH_SALT?: string }, orderId: string) => (await hmac(env.HASH_SALT ?? "", `review:${orderId}`)).slice(0, 48);
export const reviewTokenHash = (token: string) => sha256Hex(`review-token:${token}`);
/** Opt-out token for one email address (so the link works without a stored token). */
export const optoutToken = async (env: { HASH_SALT?: string }, email: string) => (await hmac(env.HASH_SALT ?? "", `optout:${email.trim().toLowerCase()}`)).slice(0, 48);
export const emailHash = (env: { HASH_SALT?: string }, email: string) => sha256Hex(`${env.HASH_SALT ?? ""}:courtesy:${email.trim().toLowerCase()}`);
export async function optoutUrl(env: { HASH_SALT?: string }, email: string) {
  return `https://beigeleads.com/email-preferences?e=${encodeURIComponent(email.trim().toLowerCase())}&t=${await optoutToken(env, email)}`;
}
export async function verifyOptout(env: { HASH_SALT?: string }, email: string, token: string) {
  if (!validTok(token)) return false;
  const want = await optoutToken(env, email);
  let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ token.charCodeAt(i);
  return d === 0;
}
export async function isOptedOut(env: { DB: D1Database; HASH_SALT?: string }, email: string): Promise<boolean> {
  try { return !!(await env.DB.prepare("SELECT 1 AS x FROM courtesy_optouts WHERE email_hash = ?").bind(await emailHash(env, email)).first()); } catch { return true; } // unknown = do not send
}
export async function addOptout(env: { DB: D1Database; HASH_SALT?: string }, email: string) {
  await env.DB.prepare("INSERT OR IGNORE INTO courtesy_optouts (email_hash) VALUES (?)").bind(await emailHash(env, email)).run();
}
