"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProducts } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { live } from "@/lib/blog/posts";
import { FIELDS, type Raw } from "@/lib/glossary/clean";
import { planImport, type Existing, type Known, type Opts } from "@/lib/glossary/plan";
import { STARTERS } from "@/lib/glossary/starters";
import { applyBatch, bulk, deleteCategory, existingForImport, getCategories, saveCategory, saveTerm, type BatchResult, type BulkAction } from "@/lib/glossary/store";

const db = () => getDbFromEnv(getCloudflareContext().env);
const admin = async () => { try { return await requireAdmin(); } catch { return null; } };
const go = (path: string, msg: string, kind: "ok" | "err" = "ok"): never => redirect(`${path}${path.includes("?") ? "&" : "?"}${kind === "ok" ? "saved" : "error"}=${encodeURIComponent(msg)}`);
const revalidate = () => { revalidatePath("/admin/glossary"); revalidatePath("/glossary"); revalidatePath("/glossary/[slug]", "page"); };

export type FormState = { ok: boolean; message: string; errors?: string[]; id?: number } | null;

/** The editor form. intent: draft | publish | keep. */
export async function saveTermAction(_: FormState, form: FormData): Promise<FormState> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const id = Number(form.get("id")) || null;
  const raw: Raw & { featured?: string } = {};
  for (const [k] of FIELDS) if (k !== "status") (raw as Record<string, string>)[k] = String(form.get(k) ?? "");
  raw.featured = form.get("featured") === "1" ? "1" : "0";
  const intent = String(form.get("intent") ?? "draft");
  const r = await saveTerm(db(), id, raw, intent === "publish" ? "published" : intent === "keep" ? "keep" : "draft", a.email);
  if (r.ok) { revalidate(); if (!id && r.id) redirect(`/admin/glossary/${r.id}?saved=${encodeURIComponent(r.message)}`); }
  return r;
}

export async function setStatusAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  const id = Number(form.get("id")); const to = String(form.get("to"));
  const r = await bulk(db(), [id], to === "publish" ? "publish" : "draft", a.email);
  revalidate(); go(`/admin/glossary/${id}`, r.message, r.ok ? "ok" : "err");
}

export async function deleteTermAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  if (form.get("confirm") !== "1") return go(`/admin/glossary/${form.get("id")}`, "Tick the box to confirm the delete.", "err");
  await bulk(db(), [Number(form.get("id"))], "delete", a.email);
  revalidate(); go("/admin/glossary", "Entry deleted.");
}

export async function bulkAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  const back = String(form.get("back") ?? "/admin/glossary").startsWith("/admin/glossary") ? String(form.get("back")) : "/admin/glossary";
  const action = String(form.get("action")) as BulkAction;
  const ids = form.getAll("ids").map(Number);
  if (action === "delete" && form.get("confirm") !== "1") return go(back, "Tick “I confirm” to delete the selected entries.", "err");
  const r = await bulk(db(), ids, action, a.email, String(form.get("category") ?? ""));
  revalidate(); go(back, r.message, r.ok ? "ok" : "err");
}

export async function saveCategoryAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  const r = await saveCategory(db(), { slug: String(form.get("slug") ?? "") || undefined, name: String(form.get("name") ?? ""), description: String(form.get("description") ?? "") });
  revalidate(); go("/admin/glossary/categories", r.message, r.ok ? "ok" : "err");
}
export async function deleteCategoryAction(form: FormData): Promise<void> {
  const a = await admin(); if (!a) return;
  const r = await deleteCategory(db(), String(form.get("slug") ?? ""));
  revalidate(); go("/admin/glossary/categories", r.message, r.ok ? "ok" : "err");
}

// ---------- bulk import ----------
export type ImportContext = { ok: boolean; existing: Existing[]; known: Known; message?: string };
export async function importContextAction(): Promise<ImportContext> {
  if (!(await admin())) return { ok: false, existing: [], known: { products: [], guides: [], categories: [] }, message: "Your session ended. Sign in again." };
  const d = db();
  const guides = await d.select({ slug: schema.blogPosts.slug }).from(schema.blogPosts).where(and(live())).orderBy(desc(schema.blogPosts.id)).limit(2000).catch(() => []);
  return { ok: true, existing: await existingForImport(d), known: { products: getProducts().flatMap((p) => [p.slug, p.name]), guides: guides.map((g) => g.slug), categories: (await getCategories(d)).flatMap((c) => [c.slug, c.name]) } };
}

const field = z.string().max(40_000).optional();
const rowSchema = z.object({ row: z.number().int().min(1), raw: z.object(Object.fromEntries(FIELDS.map((f) => [f[0], field]))) });
const optsSchema = z.object({ mode: z.enum(["skip", "update"]), allowUpdatePublished: z.boolean(), forceDraft: z.boolean() });

/** Saves one batch. The plan is made again here against the live table, so nothing the browser says can overwrite published content. */
export async function importBatchAction(rowsIn: unknown, optsIn: unknown): Promise<{ ok: boolean; message?: string; result?: BatchResult }> {
  const a = await admin(); if (!a) return { ok: false, message: "Your session ended. Sign in again." };
  const rows = z.array(rowSchema).max(60).safeParse(rowsIn); const opts = optsSchema.safeParse(optsIn);
  if (!rows.success || !opts.success) return { ok: false, message: "The batch was not valid." };
  const ctx = await importContextAction();
  const d = db();
  const plans = planImport(rows.data.map((r) => ({ raw: r.raw as Raw, row: r.row })), ctx.existing, ctx.known, opts.data as Opts);
  try { const result = await applyBatch(d, plans, opts.data as Opts, a.email); revalidate(); return { ok: true, result }; }
  catch { return { ok: false, message: "Could not save this batch. Migration 0032 may not be applied yet." }; }
}

/** One-click: the built-in starter entries, added as DRAFTS. Existing entries are skipped. Nothing is published. */
export async function loadStartersAction(): Promise<void> {
  const a = await admin(); if (!a) return;
  const ctx = await importContextAction();
  const opts: Opts = { mode: "skip", allowUpdatePublished: false, forceDraft: true };
  const raws = STARTERS.map((s, i) => ({ row: i + 1, raw: { term: s.term, slug: s.slug, category: s.category, shortDefinition: s.shortDefinition, content: s.content, whyItMatters: s.whyItMatters, example: s.example, relatedTerms: s.relatedTerms.join("; "), relatedGuides: s.relatedGuides.join("; "), relatedProducts: s.relatedProducts.join("; ") } as Raw }));
  try {
    const plans = planImport(raws, ctx.existing, ctx.known, opts);
    const r = await applyBatch(db(), plans, opts, a.email);
    revalidate();
    go("/admin/glossary/import", `Starter entries: ${r.created} added as drafts, ${r.skipped} already existed${r.failed ? `, ${r.failed} failed` : ""}. Nothing is published yet.`, r.failed ? "err" : "ok");
  } catch (e) { if (e && typeof e === "object" && "digest" in e) throw e; go("/admin/glossary/import", "Could not save. Migration 0032 may not be applied yet.", "err"); }
}
