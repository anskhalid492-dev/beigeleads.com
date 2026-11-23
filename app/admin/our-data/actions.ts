"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CLAIM_KEYS, DEFAULT_FAQS, loadOurData, saveOurData, type Claim, type OurDataSettings } from "@/lib/our-data/settings";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function ourDataAction(_: unknown, f: FormData): Promise<Res> {
  let who: string; try { who = (await requireAdmin()).email; } catch { return { ok: false, error: "Not allowed." }; }
  const { env } = getCloudflareContext();
  const cur = await loadOurData(env);
  const claims = { ...cur.claims };
  for (const k of CLAIM_KEYS) {
    const status = s(f, `${k}.status`) as Claim["status"];
    const next: Claim = { status: ["pending", "approved", "rejected"].includes(status) ? status : "pending", value: s(f, `${k}.value`), evidence: s(f, `${k}.evidence`), evidenceUrl: s(f, `${k}.url`), reviewedBy: cur.claims[k].reviewedBy, reviewedAt: cur.claims[k].reviewedAt };
    const changed = JSON.stringify({ ...next, reviewedBy: "", reviewedAt: "" }) !== JSON.stringify({ ...cur.claims[k], reviewedBy: "", reviewedAt: "" });
    if (changed) { next.reviewedBy = who; next.reviewedAt = new Date().toISOString().slice(0, 10); }
    claims[k] = next;
  }
  const faqs: OurDataSettings["faqs"] = [];
  for (let i = 0; i < 30; i++) { const q = s(f, `faq${i}.q`), a = s(f, `faq${i}.a`); if (q || a) faqs.push({ q, a }); }
  const r = await saveOurData(env, { published: f.get("published") === "on", claims, seoTitle: s(f, "seoTitle"), seoDescription: s(f, "seoDescription"), faqs: faqs.length ? faqs : DEFAULT_FAQS }, who);
  revalidatePath("/our-data"); revalidatePath("/admin/our-data");
  return r.ok ? { ok: true, message: "Saved. The page updates within a minute." } : { ok: false, error: r.message };
}
