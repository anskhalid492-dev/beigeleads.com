import type { getDbFromEnv } from "@/lib/db";
import type { Mail } from "@/lib/forms/email";
import { SITE } from "./brand";
import { getEditable } from "./store";
import { renderEmail, type Vars } from "./render";

type Db = ReturnType<typeof getDbFromEnv>;

export const systemVars = (): Vars => ({ company_name: "BeigeLeads", website_url: SITE, contact_url: `${SITE}/contact`, help_url: `${SITE}/help-center`, lists_url: `${SITE}/lists` });

/**
 * Builds the customer email for a template. Uses the PUBLISHED version (or the built-in one). If anything is wrong
 * (template unknown, a required value missing, a bad link, an error) the caller's existing plain-text `fallback`
 * is returned unchanged, so a template problem can never stop a confirmation or a delivery.
 */
export async function systemMail(db: Db, key: string, to: string, vars: Vars, fallback: Mail, extra: { reference?: string } = {}): Promise<Mail> {
  try {
    const t = await getEditable(db, key);
    if (!t) return fallback;
    const all: Vars = { ...systemVars(), ...vars };
    if (t.def.required.some((k) => !all[k]?.trim())) return fallback;
    const r = renderEmail(t.published, all);
    if (r.issues.badUrl || r.issues.unknown.length || !r.subject) return fallback;
    return { to, subject: r.subject, text: r.text, html: r.html, templateKey: key, reference: extra.reference };
  } catch { return fallback; }
}
