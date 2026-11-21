// Secure client link: derived token (HMAC of the order id with HASH_SALT); only its SHA-256 is stored. Signed short-lived file links.
import { sha256Hex } from "@/lib/forms/hash";
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(salt: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`dfy:${salt}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
}
export const dfyToken = async (env: { HASH_SALT?: string }, id: string) => (await hmac(env.HASH_SALT ?? "", `token:${id}`)).slice(0, 48);
export const dfyTokenHash = (token: string) => sha256Hex(`dfy-token:${token}`);
export async function signDfyFile(env: { HASH_SALT?: string }, key: string, ttlSec = 600, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSec;
  return { exp, sig: (await hmac(env.HASH_SALT ?? "", `file:${key}:${exp}`)).slice(0, 40) };
}
export async function verifyDfyFile(env: { HASH_SALT?: string }, key: string, exp: number, sig: string, now = Date.now()) {
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  const want = (await hmac(env.HASH_SALT ?? "", `file:${key}:${exp}`)).slice(0, 40);
  if (sig.length !== want.length) return false;
  let d = 0; for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return d === 0;
}
