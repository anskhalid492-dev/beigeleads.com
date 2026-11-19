"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { MediaKitError, deleteFile, discardDraft, publishDraft, saveDraft, setFilePublished, updateFile } from "@/lib/media-kit/store";

type R = { ok: true } | { ok: false; error: string };
async function run(fn: (env: CloudflareEnv, actor: string) => Promise<void>): Promise<R> {
  try {
    const admin = await requireAdmin();
    await fn(getCloudflareContext().env, admin.email);
    revalidatePath("/admin/media-kit"); revalidatePath("/media-kit");
    return { ok: true };
  } catch (e) {
    if (e instanceof MediaKitError) return { ok: false, error: e.message };
    return { ok: false, error: "Could not save. Check that migration 0018 has been run, then try again." };
  }
}

export const saveDraftAction = async (v: Record<string, string>) => run((env, who) => saveDraft(env, who, v));
export const publishAction = async (v: Record<string, string>) => run(async (env, who) => { await saveDraft(env, who, v); await publishDraft(env, who); });
export const discardDraftAction = async () => run((env, who) => discardDraft(env, who));
export const updateFileAction = async (id: number, v: { label: string; description: string }) => run((env, who) => updateFile(env, who, id, v));
export const setFilePublishedAction = async (id: number, p: boolean) => run((env, who) => setFilePublished(env, who, id, p));
export const deleteFileAction = async (id: number) => run((env, who) => deleteFile(env, who, id));
