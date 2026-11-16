const DEFAULT_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** `verifyUrl` is only overridden in local tests (TURNSTILE_VERIFY_URL); production uses Cloudflare. */
export async function verifyTurnstile(
  token: string,
  secret: string | undefined,
  ip?: string,
  verifyUrl: string = DEFAULT_VERIFY_URL,
): Promise<boolean> {
  if (!secret || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(verifyUrl, {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
