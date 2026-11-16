// Admin login primitives on Web Crypto only (no extra dependencies): PBKDF2 password hashes,
// HMAC-signed values and RFC 6238 TOTP. Secrets live in Worker secrets, never in code or the DB.
const enc = new TextEncoder();
export const toHex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export const fromHex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));

export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256));
}

/** Format: pbkdf2$<iterations>$<saltHex>$<hashHex> */
export async function hashPassword(password: string, iterations = 100_000): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iterations}$${toHex(salt)}$${await pbkdf2(password, salt, iterations)}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const [kind, it, salt, hash] = (stored ?? "").split("$");
  if (kind !== "pbkdf2" || !it || !salt || !hash) return false;
  return safeEqual(await pbkdf2(password, fromHex(salt), Number(it)), hash);
}

export async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Decode(s: string): Uint8Array {
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const ch of s.replace(/[\s=]/g, "").toUpperCase()) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error("bad base32");
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Uint8Array.from(out);
}
export function base32Encode(b: Uint8Array): string {
  let bits = 0, val = 0, out = "";
  for (const x of b) { val = (val << 8) | x; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

export async function totp(secretB32: string, timeMs: number): Promise<string> {
  const counter = Math.floor(timeMs / 30_000);
  const msg = new Uint8Array(8);
  new DataView(msg.buffer).setUint32(4, counter);
  const key = await crypto.subtle.importKey("raw", base32Decode(secretB32) as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[19] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/** Accepts the current code and one step either side (clock drift). */
export async function verifyTotp(secretB32: string | undefined, code: string, timeMs = Date.now()): Promise<boolean> {
  if (!secretB32 || !/^\d{6}$/.test(code)) return false;
  let ok = false;
  for (const d of [-1, 0, 1]) ok = safeEqual(await totp(secretB32, timeMs + d * 30_000), code) || ok;
  return ok;
}
