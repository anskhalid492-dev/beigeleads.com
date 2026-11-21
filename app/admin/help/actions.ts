"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { HelpError, deleteArticle, deleteCategory, moveArticle, moveCategory, saveArticle, saveCategory, setArticleStatus } from "@/lib/help/admin";
import { applyReviewUpdates, importBuiltIn } from "@/lib/help/store";

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof HelpError ? e.message : "Something went wrong. Try again." });
const done = () => { revalidatePath("/admin/help", "layout"); };
const id = z.coerce.number().int().positive();

async function run<T extends object>(fn: (env: CloudflareEnv, actor: string) => Promise<T>): Promise<Res<T>> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, error: "Your session ended. Sign in again." }; }
  try { const r = await fn(getCloudflareContext().env, admin.email); done(); return { ok: true, ...r }; } catch (e) { return fail(e); }
}

export async function saveArticleAction(payload: unknown) { return run((env, who) => saveArticle(env, who, payload)); }
export async function articleStatusAction(articleId: number, status: "draft" | "published") { return run(async (env, who) => { await setArticleStatus(env, who, id.parse(articleId), z.enum(["draft", "published"]).parse(status)); return {}; }); }
export async function deleteArticleAction(articleId: number) { return run(async (env, who) => { await deleteArticle(env, who, id.parse(articleId)); return {}; }); }
export async function moveArticleAction(articleId: number, dir: "up" | "down") { return run(async (env, who) => { await moveArticle(env, who, id.parse(articleId), z.enum(["up", "down"]).parse(dir)); return {}; }); }
export async function saveCategoryAction(payload: unknown) { return run(async (env, who) => { await saveCategory(env, who, payload); return {}; }); }
export async function deleteCategoryAction(catId: number) { return run(async (env, who) => { await deleteCategory(env, who, id.parse(catId)); return {}; }); }
export async function moveCategoryAction(catId: number, dir: "up" | "down") { return run(async (env, who) => { await moveCategory(env, who, id.parse(catId), z.enum(["up", "down"]).parse(dir)); return {}; }); }
export async function importBuiltInAction() { return run(async (env) => ({ result: await importBuiltIn(env) })); }

export async function applyReviewUpdatesAction() { return run(async (env, who) => ({ result: await applyReviewUpdates(env, who) })); }
