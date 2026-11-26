// Customer feedback (CLAUDE.md section 173). Identity = a signed link from our email (no account). Stored first; internal alerts and the
// confirmation email follow and never decide whether the feedback is kept. No reward, no public testimonial.
import { z } from "zod";
import { verifyOptout } from "@/lib/followups/tokens";
import { lc } from "./data";
import { gateReason, notifyInternal, sendFounder } from "./engine";
import { loadCs } from "./settings";
import { FOUNDER_TEMPLATES } from "./templates";

type Env = CloudflareEnv;
export const feedbackSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254), token: z.string().length(48), orderId: z.string().trim().max(60).optional().default(""),
  satisfaction: z.number().int().min(1).max(5),
  productExperience: z.enum(["", "excellent", "good", "okay", "poor"]).default(""),
  workedWell: z.string().trim().max(1000).default(""), improve: z.string().trim().max(1000).default(""), comments: z.string().trim().max(2000).default(""),
  wantsHelp: z.boolean().default(false),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
const ref = () => `FB-${[...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const tmpl = (n: string) => FOUNDER_TEMPLATES.find((t) => t.founder?.id === `CS-${n}`)!.key;

export async function submitFeedback(env: Env, raw: unknown): Promise<{ ok: true; reference: string; confirmation: "sent" | "not_sent" } | { ok: false; error: string }> {
  const p = feedbackSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the form." };
  const d = p.data; const email = lc(d.email);
  if (!(await verifyOptout(env, email, d.token))) return { ok: false, error: "This link is not valid. Use the link from your email." };
  // The same answer twice within 10 minutes is the same feedback.
  try {
    const dup = await env.DB.prepare("SELECT reference FROM cs_feedback WHERE lower(email) = ? AND satisfaction = ? AND comments = ? AND improve = ? AND created_at > unixepoch() - 600").bind(email, d.satisfaction, d.comments, d.improve).first<{ reference: string }>();
    if (dup) return { ok: true, reference: dup.reference, confirmation: "not_sent" };
  } catch { return { ok: false, error: "Feedback is not available right now." }; }
  const reference = ref();
  try {
    await env.DB.prepare("INSERT INTO cs_feedback (reference, email, order_id, satisfaction, product_experience, worked_well, improve, comments, wants_help, status) VALUES (?,?,?,?,?,?,?,?,?, 'new')").bind(reference, email, d.orderId, d.satisfaction, d.productExperience, d.workedWell, d.improve, d.comments, +d.wantsHelp).run();
  } catch { return { ok: false, error: "We could not save your feedback. Please try again." }; }
  // Internal alerts: never carry the customer's address.
  const note = `Satisfaction ${d.satisfaction}/5.${d.wantsHelp ? " Asked for assistance." : ""}`;
  await notifyInternal(env, "csi2_feedback_received", reference, note);
  if (d.wantsHelp) await notifyInternal(env, "csi1_assistance_requested", reference, note);
  if (d.satisfaction <= 2) await notifyInternal(env, "csi3_negative_experience", reference, note);
  // Confirmation to the customer (assistance requests get the assistance confirmation, never both).
  let confirmation: "sent" | "not_sent" = "not_sent";
  try {
    const s = await loadCs(env);
    const key = d.wantsHelp ? tmpl("27") : tmpl("26");
    if (!(await gateReason(env, s, key))) {
      const cust = { id: 0, email, firstName: "", company: "", status: "active" as const, enrolledAt: 0, interests: "", recOverride: [] };
      const r = await sendFounder(env, cust, key, reference, s, { vars: d.wantsHelp ? { support_reference: reference } : {} });
      if (r.ok) confirmation = "sent";
    }
  } catch { /* the feedback is already saved */ }
  return { ok: true, reference, confirmation };
}
