"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { checkAi, checkSocialRows } from "@/lib/site-links/types";
import { LLMS_DEFAULT } from "@/lib/site-links/llms-default";
import { loadLlms, publishLlms, restoreLlmsDraft, saveAi, saveLlmsDraft, saveSocial } from "@/lib/site-links/store";

type R = { ok: true; message: string } | { ok: false; error: string };
const FAIL: R = { ok: false, error: "Could not save. Sign in again and retry." };
const env = () => getCloudflareContext().env;

export async function saveSocialAction(rows: unknown): Promise<R> {
  try {
    const a = await requireAdmin();
    const c = checkSocialRows(rows); if (!c.ok) return c;
    await saveSocial(env(), a.email, c.rows);
    revalidatePath("/admin/website/social-links");
    return { ok: true, message: "Saved. The footer updates within about a minute." };
  } catch { return FAIL; }
}

export async function saveAiAction(cfg: unknown): Promise<R> {
  try {
    const a = await requireAdmin();
    const c = checkAi(cfg); if (!c.ok) return c;
    await saveAi(env(), a.email, c.value);
    revalidatePath("/admin/website/ai-platforms");
    return { ok: true, message: "Saved. The footer updates within about a minute." };
  } catch { return FAIL; }
}

export async function saveLlmsDraftAction(text: string): Promise<R> {
  try { const a = await requireAdmin(); const r = await saveLlmsDraft(env(), a.email, text); revalidatePath("/admin/website/ai-information"); return r.ok ? { ok: true, message: "Draft saved. The public file has not changed." } : r; } catch { return FAIL; }
}
export async function publishLlmsAction(text: string): Promise<R> {
  try { const a = await requireAdmin(); const r = await publishLlms(env(), a.email, text); revalidatePath("/admin/website/ai-information"); return r.ok ? { ok: true, message: "Published. /llms.txt shows this version within about a minute." } : r; } catch { return FAIL; }
}
export async function restoreLlmsAction(index: number): Promise<R> {
  try {
    const a = await requireAdmin(); const cur = await loadLlms(env());
    const text = index < 0 ? LLMS_DEFAULT : cur.revisions[index]?.text;
    if (!text) return { ok: false, error: "That version no longer exists." };
    await restoreLlmsDraft(env(), a.email, text); revalidatePath("/admin/website/ai-information");
    return { ok: true, message: "Loaded into the draft. Review it, then publish." };
  } catch { return FAIL; }
}
