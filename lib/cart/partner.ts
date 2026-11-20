/**
 * A partner code the buyer applied in the cart, kept for this browser tab only (sessionStorage) so checkout can pick it up.
 * It holds the code and the email it belongs to, nothing else. The server re-checks both on every price and order.
 */
const KEY = "bl-partner-v1";
export type StoredPartner = { code: string; email: string };

export function readPartner(): StoredPartner | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<StoredPartner>;
    if (typeof j.code === "string" && typeof j.email === "string" && j.code.length > 0 && j.code.length <= 40 && j.email.length <= 254) return { code: j.code, email: j.email };
  } catch { /* storage blocked or corrupt: no saved code */ }
  return null;
}

export function writePartner(p: StoredPartner | null) {
  try { if (p) sessionStorage.setItem(KEY, JSON.stringify(p)); else sessionStorage.removeItem(KEY); } catch { /* storage blocked: the code just is not remembered */ }
}
