// AES-GCM for the Resend credentials saved in the admin. Key = SHA-256 of a SEPARATE server secret (EMAIL_KEY_SECRET).
const enc = new TextEncoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function key(secret: string) {
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode(`beigeleads:email:v1:${secret}`)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export const secretOk = (s: string | undefined): s is string => !!s && s.length >= 32;

export async function encryptSecret(plain: string, secret: string | undefined): Promise<string> {
  if (!secretOk(secret)) throw new Error("EMAIL_KEY_SECRET is missing or shorter than 32 characters.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret), enc.encode(plain)));
  return `v1.${b64(iv)}.${b64(ct)}`;
}
/** null when damaged or the secret changed. Never throws. */
export async function decryptSecret(stored: string, secret: string | undefined): Promise<string | null> {
  try {
    if (!secretOk(secret)) return null;
    const [v, iv, ct] = stored.split(".");
    if (v !== "v1" || !iv || !ct) return null;
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(secret), unb64(ct)));
  } catch { return null; }
}
export const hint = (k: string) => `••••${k.slice(-4)}`;
