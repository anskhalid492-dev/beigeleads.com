export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Hash used for the suppressions table. The data pipeline must hash emails the same way. */
export async function suppressionHash(email: string, salt = ""): Promise<string> {
  return sha256Hex(`${salt}:${normalizeEmail(email)}`);
}
