import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { CheckoutError, createOrder } from "@/lib/checkout/create";
import { getDbFromEnv, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { notifyOwner } from "@/lib/forms/email";
import { OPTION_IDS } from "@/lib/payments/options";
import { getDfyByToken, log, reviewCopy, submitOnboarding, adminUrl } from "@/lib/dfy/store";

const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const token = z.string().regex(/^[0-9a-f]{48}$/);

/** Client actions of the private order page. The link token is the credential; every action is same-origin and rate limited. */
export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const { action } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const t = token.safeParse(body?.token);
  if (!body || !t.success) return json(400, { ok: false, error: "This link is not valid." });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, `dfy-${action}`, who, 30, 3600)) return json(429, { ok: false, error: "Too many requests. Try again later." });
  if (action === "onboarding") {
    if (body.website2) return json(200, { ok: true });
    const r = await submitOnboarding(env, t.data, body.form);
    return json(r.ok ? 200 : 400, r);
  }
  if (action === "copy") {
    const d = z.enum(["approve", "changes"]).safeParse(body.decision);
    if (!d.success) return json(400, { ok: false, error: "Choose approve or request changes." });
    const r = await reviewCopy(env, t.data, d.data, typeof body.note === "string" ? body.note : "");
    return json(r.ok ? 200 : 400, r);
  }
  const row = await getDfyByToken(env, t.data);
  if (!row) return json(404, { ok: false, error: "This link is not valid." });
  const db = getDbFromEnv(env);
  if (action === "cancel") {
    if (!row.paidAt || row.status === "cancelled") return json(400, { ok: false, error: "Nothing to cancel." });
    await db.update(schema.dfyOrders).set({ cancelRequested: 1, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.dfyOrders.id, row.id));
    await log(db, row.id, "customer", "cancel_requested");
    await notifyOwner(env, `DFY cancellation requested: ${row.id}`, `Open ${adminUrl(row.id)} and confirm it.`).catch(() => undefined);
    return json(200, { ok: true, message: "Cancellation requested. No further renewals will be invoiced. Our team will confirm by email." });
  }
  if (action === "renew") {
    const coin = z.enum(OPTION_IDS).safeParse(body.coin);
    if (!coin.success) return json(400, { ok: false, error: "Choose how you want to pay." });
    try { return json(200, { ok: true, redirect: `/checkout/${await createOrder(env, { email: row.email, items: [], option: coin.data, dfyRenewal: row.id })}` }); }
    catch (e) { return e instanceof CheckoutError ? json(409, { ok: false, error: e.message }) : json(500, { ok: false, error: "Something went wrong. Try again in a minute." }); }
  }
  return json(404, { ok: false, error: "Unknown action." });
}
