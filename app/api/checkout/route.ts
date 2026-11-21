import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { CheckoutError, createOrder } from "@/lib/checkout/create";
import { sha256Hex } from "@/lib/forms/hash";
import { OPTION_IDS } from "@/lib/payments/options";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { verifyTurnstile } from "@/lib/forms/turnstile";

const schema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  // Either one list (product + package) or a cart (items). Prices are never accepted from the browser.
  product: z.string().trim().min(1).max(80).optional(),
  package: z.string().trim().min(1).max(40).optional(),
  items: z.array(z.object({ product: z.string().trim().min(1).max(80), package: z.string().trim().min(1).max(40) })).max(10).optional(),
  bundles: z.array(z.string().trim().min(1).max(80)).max(5).optional(),
  verification: z.string().trim().max(40).optional(),
  dfy: z.object({ pkg: z.string().trim().min(1).max(40), ownership: z.boolean() }).optional(),
  discountCode: z.string().trim().max(40).optional(),
  coin: z.enum(OPTION_IDS, "Choose how you want to pay."),
});

const orderItems = (d: z.infer<typeof schema>) => (d.items ?? (d.product && d.package ? [{ product: d.product, package: d.package }] : [])).map((i) => ({ productSlug: i.product, packageName: i.package }));

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function POST(req: Request) {
  let raw: unknown;
  try { raw = await req.json(); } catch { return json(400, { ok: false, error: "Invalid request." }); }
  const p = schema.safeParse(raw);
  if (!p.success) return json(400, { ok: false, error: p.error.issues[0]?.message ?? "Check the form and try again." });
  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await verifyTurnstile(p.data.turnstileToken, env.TURNSTILE_SECRET_KEY, ip, env.TURNSTILE_VERIFY_URL))) {
    return json(400, { ok: false, error: "The spam check failed. Reload the page and try again." });
  }
  const ipHash = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`);
  if (await isRateLimited(env.CACHE, "checkout", ipHash, 10, 3600)) return json(429, { ok: false, error: "Too many requests. Try again later." });
  try {
    const orderId = await createOrder(env, { email: p.data.email, items: orderItems(p.data), option: p.data.coin, discountCode: p.data.discountCode, bundles: p.data.bundles, verification: p.data.verification, dfy: p.data.dfy });
    return json(200, { ok: true, redirect: `/checkout/${orderId}` });
  } catch (e) {
    if (e instanceof CheckoutError) return json(409, { ok: false, error: e.message });
    return json(500, { ok: false, error: "Something went wrong. Try again in a minute." });
  }
}
