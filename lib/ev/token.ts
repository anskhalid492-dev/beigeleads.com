// Secure links for a verification order. The token is derived (HMAC of the order id with HASH_SALT), so the checkout page and the emails can
// show the same link without the database ever holding the plain token (only its SHA-256 is stored). Download links are short-lived and signed.
import { sha256Hex } from "@/lib/forms/hash";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(salt: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`ev:${salt}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
}
export const evToken = async (env: { HASH_SALT?: string }, evId: string) => (await hmac(env.HASH_SALT ?? "", `token:${evId}`)).slice(0, 48);
export const evTokenHash = (token: string) => sha256Hex(`ev-token:${token}`);

export async function signFile(env: { HASH_SALT?: string }, fileId: string, ttlSec = 600, now = Date.now()): Promise<{ exp: number; sig: string }> {
  const exp = Math.floor(now / 1000) + ttlSec;
  return { exp, sig: (await hmac(env.HASH_SALT ?? "", `file:${fileId}:${exp}`)).slice(0, 40) };
}
export async function verifyFile(env: { HASH_SALT?: string }, fileId: string, exp: number, sig: string, now = Date.now()): Promise<boolean> {
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  const want = (await hmac(env.HASH_SALT ?? "", `file:${fileId}:${exp}`)).slice(0, 40);
  if (sig.length !== want.length) return false;
  let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ sig.charCodeAt(i); // constant time
  return d === 0;
}
