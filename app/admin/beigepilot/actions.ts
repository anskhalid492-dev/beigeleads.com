"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { chat, type ChatOut } from "@/lib/beigepilot/chat";
import { isProviderId, listModels, PROVIDER_IDS, ProviderError } from "@/lib/beigepilot/providers";
import { getProviderKey, removeProviderKey, saveProvider, saveSettings } from "@/lib/beigepilot/store";
import { refreshPilo } from "@/lib/beigepilot/sync";
import { isRateLimited } from "@/lib/forms/rate-limit";

async function actor(): Promise<string | null> { try { return (await requireAdmin()).email; } catch { return null; } }
const audit = (env: CloudflareEnv, who: string, key: string, what: string) => getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: who, category: "beigepilot", settingKey: key, newValue: what }).catch(() => {});
export type Result = { ok: boolean; message: string; models?: string[] };
const numOr = (v: FormDataEntryValue | null, d: number, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) && v !== null && String(v).trim() !== "" ? Math.min(max, Math.max(min, n)) : d; };
const optNum = (v: FormDataEntryValue | null) => { const n = Number(v); return v !== null && String(v).trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null; };

/** Save one provider. The key field is write-only: empty = keep the saved key. */
export async function saveProviderAction(_: Result | null, form: FormData): Promise<Result> {
  const who = await actor(); if (!who) return { ok: false, message: "Not allowed." };
  const id = String(form.get("id") ?? ""); if (!isProviderId(id)) return { ok: false, message: "Unknown provider." };
  const env = getCloudflareContext().env;
  const apiKey = String(form.get("apiKey") ?? "").trim();
  if (apiKey && !env.BEIGEPILOT_KEY_SECRET) return { ok: false, message: "Set the secret BEIGEPILOT_KEY_SECRET in Cloudflare first; keys are never stored without encryption." };
  if (apiKey && (apiKey.length < 16 || /\s/.test(apiKey))) return { ok: false, message: "That does not look like an API key." };
  try {
    await saveProvider(env, id, { apiKey: apiKey || undefined, model: String(form.get("model") ?? "").trim().slice(0, 120), temperature: numOr(form.get("temperature"), 0.3, 0, 1), maxTokens: Math.round(numOr(form.get("maxTokens"), 700, 100, 4000)), priceIn: optNum(form.get("priceIn")), priceOut: optNum(form.get("priceOut")) });
  } catch { return { ok: false, message: "Could not save. Run migration 0037 in D1 first." }; }
  await audit(env, who, `provider.${id}`, apiKey ? "key + settings saved" : "settings saved");
  revalidatePath("/admin/beigepilot", "layout");
  return { ok: true, message: apiKey ? "Saved. The key is stored encrypted and cannot be shown again." : "Saved." };
}

export async function removeKeyAction(_: Result | null, form: FormData): Promise<Result> {
  const who = await actor(); if (!who) return { ok: false, message: "Not allowed." };
  const id = String(form.get("id") ?? ""); if (!isProviderId(id)) return { ok: false, message: "Unknown provider." };
  const env = getCloudflareContext().env;
  await removeProviderKey(env, id);
  await audit(env, who, `provider.${id}`, "key removed");
  revalidatePath("/admin/beigepilot", "layout");
  return { ok: true, message: "Key removed." };
}

/** Test the SAVED key (or a freshly typed one) and load the model list. */
export async function testProviderAction(_: Result | null, form: FormData): Promise<Result> {
  const who = await actor(); if (!who) return { ok: false, message: "Not allowed." };
  const id = String(form.get("id") ?? ""); if (!isProviderId(id)) return { ok: false, message: "Unknown provider." };
  const env = getCloudflareContext().env;
  if (await isRateLimited(env.CACHE, "bp-test", who, 20, 3600)) return { ok: false, message: "Too many tests. Try again later." };
  const typed = String(form.get("apiKey") ?? "").trim();
  const key = typed || (await getProviderKey(env, id));
  if (!key) return { ok: false, message: "No key saved yet (or the secret changed and the saved key cannot be read). Paste the key and test again." };
  try {
    const models = await listModels(id, key);
    return { ok: true, message: `Connected. ${models.length} models available.`, models };
  } catch (e) { return { ok: false, message: e instanceof ProviderError ? e.message : "Connection failed." }; }
}

export async function saveSettingsAction(_: Result | null, form: FormData): Promise<Result> {
  const who = await actor(); if (!who) return { ok: false, message: "Not allowed." };
  const env = getCloudflareContext().env;
  const active = String(form.get("active") ?? ""), fallback = String(form.get("fallback") ?? "");
  const patch: Record<string, string> = {};
  if (form.has("active")) { patch.active = isProviderId(active) ? active : ""; patch.fallback = isProviderId(fallback) && fallback !== active ? fallback : ""; }
  if (form.has("enabled")) patch.enabled = form.getAll("enabled").pop() === "1" ? "1" : "0";
  if (form.has("greeting")) patch.greeting = String(form.get("greeting")).trim().slice(0, 300);
  if (form.has("retentionDays")) { patch.saveChats = form.getAll("saveChats").pop() === "1" ? "1" : "0"; const d = Number(form.get("retentionDays")); patch.retentionDays = String([30, 90, 180, 365].includes(d) ? d : 90); }
  if (form.has("name")) patch.name = String(form.get("name")).trim().slice(0, 24) || "Pilo";
  if (form.has("humor")) { const h = String(form.get("humor")); patch.humor = ["professional", "friendly", "playful"].includes(h) ? h : "friendly"; }
  if (form.has("motion")) { const m = String(form.get("motion")); patch.motion = ["calm", "balanced", "lively"].includes(m) ? m : "balanced"; }
  if (form.has("launcher")) patch.launcher = String(form.get("launcher")) === "left" ? "left" : "right";
  if (form.has("suggestions")) patch.suggestions = String(form.get("suggestions")).split("\n").map((x) => x.trim().slice(0, 60)).filter(Boolean).slice(0, 3).join("\n");
  if (form.has("saMaxRecs")) {
    for (const [f, k] of [["saFinder", "saFinder"], ["saCart", "saCart"], ["saBudget", "saBudget"], ["saHandoff", "saHandoff"], ["saAlternatives", "saAlternatives"], ["saVolume", "saVolume"], ["saUnavailable", "saUnavailable"]] as const) patch[k] = form.getAll(f).pop() === "1" ? "1" : "0";
    patch.saMaxRecs = String(Math.round(numOr(form.get("saMaxRecs"), 5, 1, 5)));
    const em = String(form.get("saSupportEmail") ?? "").trim().toLowerCase();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return { ok: false, message: "That support email address does not look valid." };
    patch.saSupportEmail = em.slice(0, 200);
    patch.saAckNote = String(form.get("saAckNote") ?? "").trim().slice(0, 400);
  }
  if (form.has("instructions")) patch.instructions = String(form.get("instructions")).trim().slice(0, 1500);
  if (form.has("dailyRequestLimit")) { patch.dailyRequestLimit = String(Math.round(numOr(form.get("dailyRequestLimit"), 500, 1, 1_000_000))); patch.dailyTokenLimit = String(Math.round(numOr(form.get("dailyTokenLimit"), 500000, 1000, 1_000_000_000))); const m = optNum(form.get("monthlySpendUsd")); patch.monthlySpendUsd = m ? String(m) : ""; }
  if (patch.enabled === "1") {
    const { getSettings } = await import("@/lib/beigepilot/store");
    const cur = (await getSettings(env)).s; const act = patch.active ?? cur.active;
    if (!act) return { ok: false, message: "Choose an active provider before switching BeigePilot on." };
    if (!(await getProviderKey(env, act as (typeof PROVIDER_IDS)[number]))) return { ok: false, message: "The active provider has no usable key yet." };
  }
  try { await saveSettings(env, patch); } catch { return { ok: false, message: "Could not save. Run migration 0037 in D1 first." }; }
  await audit(env, who, "settings", Object.keys(patch).join(", "));
  revalidatePath("/admin/beigepilot", "layout");
  return { ok: true, message: "Saved." };
}

export async function playgroundAction(_: { out: ChatOut | null; q: string } | null, form: FormData): Promise<{ out: ChatOut | null; q: string }> {
  const who = await actor(); const q = String(form.get("q") ?? "").trim().slice(0, 1000);
  if (!who || !q) return { out: null, q };
  const env = getCloudflareContext().env;
  if (await isRateLimited(env.CACHE, "bp-play", who, 60, 3600)) return { out: { ok: false, text: "", cards: [], sources: [], handoff: null, trace: [], error: "Too many tests this hour." }, q };
  const p = String(form.get("provider") ?? "");
  const out = await chat(env, { history: [{ role: "user", text: q }], path: String(form.get("path") ?? "/").slice(0, 200), provider: isProviderId(p) ? p : undefined });
  return { out, q };
}

/* ---------------- Phase 2: knowledge, unanswered, leads ---------------- */
import { redirect } from "next/navigation";
import { cleanEntry, deleteEntry, saveEntry } from "@/lib/beigepilot/knowledge";
import { deleteLead, deleteUnanswered, getLeadByReference, setUnanswered, updateLead } from "@/lib/beigepilot/leads";
import { sendLeadEmails } from "@/lib/beigepilot/handoff";

export async function saveEntryAction(_: Result | null, form: FormData): Promise<Result> {
  const who = await actor(); if (!who) return { ok: false, message: "Not allowed." };
  const env = getCloudflareContext().env;
  const c = cleanEntry({ kind: String(form.get("kind") ?? ""), title: String(form.get("title") ?? ""), answer: String(form.get("answer") ?? ""), keywords: String(form.get("keywords") ?? ""), status: String(form.get("status") ?? "") });
  if (!c.ok) return { ok: false, message: c.error };
  const id = Number(form.get("id")) || null;
  const from = Number(form.get("fromUnanswered")) || null;
  let saved: number;
  try { saved = await saveEntry(env, id, c.v); } catch { return { ok: false, message: "Could not save. Run migration 0038 in D1 first." }; }
  if (from) await setUnanswered(env, from, "resolved", saved).catch(() => {});
  await audit(env, who, `knowledge.${saved}`, `${c.v.kind} ${c.v.status}`);
  revalidatePath("/admin/beigepilot", "layout");
  if (!id) redirect(`/admin/beigepilot/knowledge?saved=${saved}`);
  return { ok: true, message: "Saved. Published answers are used within about a minute." };
}
export async function deleteEntryAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const id = Number(form.get("id")); if (!id) return;
  const env = getCloudflareContext().env;
  await deleteEntry(env, id); await audit(env, who, `knowledge.${id}`, "deleted");
  revalidatePath("/admin/beigepilot", "layout");
}
export async function unansweredAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const id = Number(form.get("id")); const op = String(form.get("op") ?? ""); if (!id) return;
  const env = getCloudflareContext().env;
  if (op === "delete") await deleteUnanswered(env, id); else await setUnanswered(env, id, op);
  await audit(env, who, `unanswered.${id}`, op);
  revalidatePath("/admin/beigepilot/unanswered");
}
export async function leadAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const id = Number(form.get("id")); if (!id) return;
  const env = getCloudflareContext().env;
  if (String(form.get("op")) === "delete") { await deleteLead(env, id); await audit(env, who, `lead.${id}`, "deleted"); }
  else { await updateLead(env, id, String(form.get("status") ?? ""), String(form.get("note") ?? "")); await audit(env, who, `lead.${id}`, `status ${String(form.get("status"))}`); }
  revalidatePath("/admin/beigepilot/leads");
}

/** Sends the failed (or skipped) support or acknowledgment email of one ticket again. The ticket itself is never changed. */
export async function retryLeadEmailAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const ref = String(form.get("ref") ?? ""), which = String(form.get("which") ?? "");
  if (!/^BP-[A-Z0-9]{8}$/.test(ref) || (which !== "owner" && which !== "customer")) return;
  const env = getCloudflareContext().env;
  const l = await getLeadByReference(env, ref); if (!l) return;
  const r = await sendLeadEmails(env, l, which);
  await audit(env, who, `lead.${ref}`, `retry ${which} email: ${which === "owner" ? r.owner : r.customer}`);
  revalidatePath("/admin/beigepilot/leads");
}

/* ---------------- Phase 3: test cases, conversations ---------------- */
import { CASES, evaluate, type CaseResult } from "@/lib/beigepilot/cases";
import { deleteAllConversations, deleteConversation } from "@/lib/beigepilot/history";

export async function runCaseAction(caseId: string, provider: string): Promise<CaseResult> {
  const who = await actor();
  const c = CASES.find((x) => x.id === caseId);
  const fail = (m: string): CaseResult => ({ id: caseId, pass: false, failures: [m], answer: "", tools: [], tokens: 0, error: m });
  if (!who || !c) return fail("Not allowed.");
  const env = getCloudflareContext().env;
  if (await isRateLimited(env.CACHE, "bp-cases", who, 100, 3600)) return fail("Too many test runs this hour.");
  const out = await chat(env, { history: [{ role: "user", text: c.question }], path: c.path, provider: isProviderId(provider) ? provider : undefined });
  return evaluate(c, out);
}
export async function deleteConversationAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const id = String(form.get("id") ?? ""); if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return;
  const env = getCloudflareContext().env;
  await deleteConversation(env, id); await audit(env, who, "conversation", "deleted one");
  redirect("/admin/beigepilot/conversations");
}
export async function deleteAllConversationsAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  if (form.get("confirm") !== "yes") return;
  const env = getCloudflareContext().env;
  await deleteAllConversations(env); await audit(env, who, "conversation", "deleted all");
  revalidatePath("/admin/beigepilot/conversations");
}

/** Clears every cache Pilo reads Help, Glossary and Knowledge from, so the next question uses the newest published content. */
export async function refreshPiloAction(): Promise<void> {
  const who = await actor(); if (!who) return;
  const env = getCloudflareContext().env;
  await refreshPilo(env);
  await audit(env, who, "contentSync", "refresh");
  revalidatePath("/admin/beigepilot/sync");
}
