// Pure llms.txt validation (shared by the admin editor in the browser and the server).
export const LLMS_MAX = 20_000;

/** Plain-text rules: it is served as text/plain, but still refuse markup, scripts, secrets and empty files. */
export function checkLlms(text: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof text !== "string") return { ok: false, error: "The file must be text." };
  const v = text.replace(/\r\n/g, "\n").trim() + "\n";
  if (v.trim().length < 200) return { ok: false, error: "The file is too short (200 characters minimum)." };
  if (v.length > LLMS_MAX) return { ok: false, error: `The file is too long (${LLMS_MAX.toLocaleString("en-US")} characters maximum).` };
  if (!/^# \S/.test(v)) return { ok: false, error: "Start the file with a title line such as \"# BeigeLeads\"." };
  if (/<\s*\/?\s*(script|iframe|html|body|style|object|embed|svg|img|a)\b/i.test(v)) return { ok: false, error: "HTML is not allowed in llms.txt. Use plain text and Markdown." };
  if (/javascript:|data:text|vbscript:/i.test(v)) return { ok: false, error: "Unsafe link schemes are not allowed." };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) return { ok: false, error: "The file contains control characters." };
  if (/(sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|xprv|zprv|\b[a-f0-9]{64}\b)/.test(v)) return { ok: false, error: "The text looks like it contains a secret or key. Remove it." };
  if (/https?:\/\/[^\s)]*@/.test(v)) return { ok: false, error: "Links with a username or password are not allowed." };
  const bad = [...v.matchAll(/https?:\/\/[^\s)>\]]+/g)].map((m) => m[0]).find((u) => !/^https:\/\//.test(u));
  if (bad) return { ok: false, error: `Use https links only (found ${bad.slice(0, 60)}).` };
  return { ok: true, value: v };
}

