"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { sendEmailDetailed } from "@/lib/forms/email";
import { getTemplate } from "@/lib/system-emails/defaults";
import { systemVars } from "@/lib/system-emails/mail";
import { renderEmail } from "@/lib/system-emails/render";
import { EmailError, checkContent, discardDraft, exampleVars, publish, restoreVersion, saveDraft } from "@/lib/system-emails/store";
import { suggestSubjects, type SubjectIdea } from "@/lib/system-emails/subjects";
import { getVar } from "@/lib/system-emails/variables";

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof EmailError ? e.message : "Something went wrong. Try again." });

async function run<T extends object>(fn: (env: CloudflareEnv, actor: string) => Promise<T>): Promise<Res<T>> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, error: "Your session ended. Sign in again." }; }
  try { const r = await fn(getCloudflareContext().env, admin.email); revalidatePath("/admin/system-emails", "layout"); return { ok: true, ...r }; } catch (e) { return fail(e); }
}

const audit = (env: CloudflareEnv, actor: string, key: string, what: string) =>
  getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor, category: "system-emails", settingKey: key, newValue: what }).catch(() => {});

export async function saveDraftAction(key: string, content: unknown) { return run(async (env, who) => { await saveDraft(getDbFromEnv(env), who, key, content); return {}; }); }
export async function publishAction(key: string, content: unknown, note?: string) {
  return run(async (env, who) => { const v = await publish(getDbFromEnv(env), who, key, content, note ?? ""); await audit(env, who, key, `published version ${v}`); return { version: v }; });
}
export async function discardDraftAction(key: string) { return run(async (env, who) => { await discardDraft(getDbFromEnv(env), who, key); await audit(env, who, key, "discarded draft"); return {}; }); }
export async function restoreVersionAction(key: string, version: number) {
  return run(async (env, who) => { await restoreVersion(getDbFromEnv(env), who, key, Math.max(0, Math.floor(Number(version) || 0))); await audit(env, who, key, `loaded version ${version} into the draft`); return {}; });
}

export type Preview = { subject: string; preheader: string; html: string; text: string; errors: string[]; warnings: string[]; used: { key: string; label: string; required: boolean; fallback: string }[]; ideas: SubjectIdea[] };

/** Renders unsaved content with labelled EXAMPLE values. Writes nothing. */
export async function previewAction(key: string, content: unknown, dark: boolean): Promise<Res<{ preview: Preview }>> {
  try { await requireAdmin(); } catch { return { ok: false, error: "Your session ended. Sign in again." }; }
  const def = getTemplate(key);
  if (!def) return { ok: false, error: "Unknown template." };
  const { content: c, errors, warnings } = checkContent(def, content);
  if (!c) return { ok: true, preview: { subject: "", preheader: "", html: "", text: "", errors, warnings, used: [], ideas: [] } };
  const r = renderEmail(c, { ...systemVars(), ...exampleVars(def) }, { forceDark: dark });
  const used = [...new Set([...JSON.stringify(c).matchAll(/\{\{\s*([a-z_]+)/g)].map((m) => m[1]))].map((k) => ({ key: k, label: getVar(k)?.label ?? k, required: def.required.includes(k), fallback: getVar(k)?.personal ? "removed from the sentence when missing" : getVar(k)?.fallback ? `shows "${getVar(k)!.fallback}"` : "hidden or empty when missing" }));
  return { ok: true, preview: { ...r, errors, warnings, used, ideas: suggestSubjects(def, c) } };
}

/** Test emails go ONLY to the signed-in admin's own address, 10 per hour, with a visible test banner. */
export async function sendTestAction(key: string, content: unknown): Promise<Res<{ to: string }>> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, error: "Your session ended. Sign in again." }; }
  const def = getTemplate(key);
  if (!def) return { ok: false, error: "Unknown template." };
  const { content: c, errors } = checkContent(def, content);
  if (!c) return { ok: false, error: errors[0] ?? "The template is not valid yet." };
  const env = getCloudflareContext().env;
  const rk = `sysmailtest:${admin.email}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = Number((await env.CACHE.get(rk)) ?? 0);
  if (n >= 10) return { ok: false, error: "Test email limit reached (10 per hour). Try again later." };
  await env.CACHE.put(rk, String(n + 1), { expirationTtl: 3700 });
  const r = renderEmail(c, { ...systemVars(), ...exampleVars(def) });
  const banner = '<div style="background:#D8EADF;color:#0F2A1D;padding:8px 12px;font:13px sans-serif;text-align:center">Test email with example data. It was not sent to a customer.</div>';
  const res = await sendEmailDetailed(env, { to: admin.email, subject: `[TEST] ${r.subject}`, text: `TEST EMAIL with example data.\n\n${r.text}`, html: r.html.replace(/(<body[^>]*>)/, `$1${banner}`), templateKey: key, source: "test" });
  return res.ok ? { ok: true, to: admin.email } : { ok: false, error: res.error ?? "The email was not accepted." };
}
