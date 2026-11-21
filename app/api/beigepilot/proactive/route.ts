import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { hydrateCatalog } from "@/lib/catalog-db";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { buildContext, openingFor } from "@/lib/beigepilot/proactive/context";
import { selectTemplate } from "@/lib/beigepilot/proactive/select";
import { getPro } from "@/lib/beigepilot/proactive/store";

const body = z.object({
  stage: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  path: z.string().max(200),
  search: z.string().max(120).optional(),
  recent: z.array(z.string().max(200)).max(8),
  cart: z.array(z.string().max(120)).max(10),
  shown: z.array(z.string().max(40)).max(3),
});

/** Picks the next proactive message from REAL context (catalog, cart, search). No AI call, nothing stored. Same-origin only. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return new Response(null, { status: 400 });
  const { env } = getCloudflareContext();
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-proactive", who, 40, 3600)) return Response.json({ msg: null });
  const pro = await getPro(env);
  if (!pro.enabled) return Response.json({ msg: null });
  await hydrateCatalog(env);
  const ctx = buildContext({ path: p.data.path, search: p.data.search, recent: p.data.recent, cart: p.data.cart });
  if (!pro.pages[ctx.page] || (ctx.page === "cart" && !pro.cartMessages)) return Response.json({ msg: null });
  const pick = selectTemplate(p.data.stage, ctx, pro, p.data.shown);
  if (!pick) return Response.json({ msg: null });
  return Response.json({ msg: { id: pick.template.id, stage: p.data.stage, text: pick.text, cta: pick.cta, opening: openingFor(pick.ask, pick.template.kind, p.data.path, ctx), page: ctx.page } });
}
