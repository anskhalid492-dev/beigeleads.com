// AES-GCM encryption of provider API keys with a server-only secret (BEIGEPILOT_KEY_SECRET). Web Crypto only.
const enc = new TextEncoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function key(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(`beigepilot:v1:${secret}`));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Format: v1.<iv>.<ciphertext> (base64). Throws when the secret is missing or too short. */
export async function encryptKey(plain: string, secret: string | undefined): Promise<string> {
  if (!secret || secret.length < 32) throw new Error("BEIGEPILOT_KEY_SECRET is missing or shorter than 32 characters.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret), enc.encode(plain)));
  return `v1.${b64(iv)}.${b64(ct)}`;
}

/** Returns null when the value is damaged or the secret changed. Never throws. */
export async function decryptKey(stored: string, secret: string | undefined): Promise<string | null> {
  try {
    if (!secret || secret.length < 32) return null;
    const [v, iv, ct] = stored.split(".");
    if (v !== "v1" || !iv || !ct) return null;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(secret), unb64(ct));
    return new TextDecoder().decode(pt);
  } catch { return null; }
}

/** Shown in the admin instead of the key: only the last 4 characters. */
export const keyHint = (k: string) => `••••${k.slice(-4)}`;
