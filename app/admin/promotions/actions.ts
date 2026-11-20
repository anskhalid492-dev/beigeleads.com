"use server";
import { revalidatePath } from "next/cache";
import { clearPublicPromos } from "@/lib/promos/public";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { PromoError, createPromo, deletePromo, duplicatePromo, promoInput, setPromoStatus, updatePromo } from "@/lib/promos/admin";

type Res = { ok: true; message: string } | { ok: false; error: string };
const actor = async () => { try { return (await requireAdmin()).email; } catch { return null; } };
const audit = (who: string, id: number | string, what: string) => getDbFromEnv(getCloudflareContext().env).insert(schema.settingsAuditLog).values({ actor: who, category: "promotions", settingKey: `promotion:${id}`, newValue: what }).catch(() => {});

function readForm(f: FormData) {
  const g = (k: string) => (f.get(k) ?? "") as string;
  return promoInput.safeParse({
    name: g("name"), title: g("title"), description: g("description"), kind: g("kind"), value: g("value"), mode: g("mode"), code: g("code"),
    productSlugs: f.getAll("productSlugs"), categorySlugs: f.getAll("categorySlugs"), packageNames: f.getAll("packageNames"),
    minCart: g("minCart"), maxDiscount: g("maxDiscount"), startsLocal: g("startsLocal"), endsLocal: g("endsLocal"), timezone: g("timezone") || "UTC",
    usageLimit: g("usageLimit"), perCustomerLimit: g("perCustomerLimit"), eligibility: g("eligibility") || "everyone",
    combinable: f.get("combinable") === "on", bannerPlaces: f.getAll("bannerPlaces"), status: g("status") || "draft",
  });
}

/** Create (no id) or update. Returns the real outcome; success on create redirects to the list. */
export async function savePromoAction(_: unknown, form: FormData): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const parsed = readForm(form);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const db = getDbFromEnv(getCloudflareContext().env);
  const rawId = String(form.get("id") ?? "");
  try {
    if (rawId) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id < 1) return { ok: false, error: "Invalid request." };
      await updatePromo(db, id, parsed.data);
      await audit(who, id, `updated (${parsed.data.status})`);
      revalidatePath("/admin/promotions", "layout");
    await clearPublicPromos(getCloudflareContext().env);
      return { ok: true, message: "Saved." };
    }
    const id = await createPromo(db, parsed.data);
    await audit(who, id, `created (${parsed.data.status})`);
  } catch (e) {
    if (e instanceof PromoError) return { ok: false, error: e.message };
    return { ok: false, error: "Could not save. Run migration 0034_promotions.sql in D1 if you have not yet." };
  }
  revalidatePath("/admin/promotions", "layout");
    await clearPublicPromos(getCloudflareContext().env);
  redirect("/admin/promotions?created=1");
}

async function row(form: FormData, fn: (db: ReturnType<typeof getDbFromEnv>, id: number, who: string) => Promise<string>): Promise<Res> {
  const who = await actor();
  if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return { ok: false, error: "Invalid request." };
  try {
    const message = await fn(getDbFromEnv(getCloudflareContext().env), id, who);
    revalidatePath("/admin/promotions", "layout");
    await clearPublicPromos(getCloudflareContext().env);
    return { ok: true, message };
  } catch (e) {
    return { ok: false, error: e instanceof PromoError ? e.message : "Something went wrong. Try again." };
  }
}
export async function statusAction(_: unknown, form: FormData): Promise<Res> {
  const s = String(form.get("status"));
  if (s !== "draft" && s !== "active" && s !== "paused") return { ok: false, error: "Invalid request." };
  return row(form, async (db, id, who) => { await setPromoStatus(db, id, s); await audit(who, id, `status -> ${s}`); return s === "active" ? "Activated." : s === "paused" ? "Paused. It stops working within seconds." : "Moved to draft."; });
}
export async function duplicateAction(_: unknown, form: FormData): Promise<Res> {
  return row(form, async (db, id, who) => { const n = await duplicatePromo(db, id); await audit(who, n, `duplicated from ${id}`); return "Copied as a draft (add a code before activating)."; });
}
export async function deleteAction(_: unknown, form: FormData): Promise<Res> {
  return row(form, async (db, id, who) => { await deletePromo(db, id); await audit(who, id, "deleted"); return "Deleted."; });
}
