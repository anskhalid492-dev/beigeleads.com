import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { chat } from "@/lib/beigepilot/chat";
import { recordTurn, validCid } from "@/lib/beigepilot/history";
import { getSettings } from "@/lib/beigepilot/store";
import { piloEvent } from "@/lib/beigepilot/v2/events";
import { detectDiscountAsk } from "@/lib/beigepilot/v2/negotiate";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().min(1).max(1500) })).min(1).max(12),
  path: z.string().trim().max(200).startsWith("/"),
  cid: z.string().trim().max(40).optional(),
  cart: z.array(z.object({ slug: z.string().trim().max(100), pkg: z.string().trim().max(40) })).max(10).optional(),
  lang: z.string().trim().max(8).optional(),
  memory: z.unknown().optional(),
});
/** Last public failure for the admin overview (reason only, never visitor text). */
async function noteError(kv: KVNamespace, reason: string) { try { await kv.put("beigepilot:lasterr", JSON.stringify({ at: Date.now(), reason: reason.slice(0, 300) }), { expirationTtl: 7 * 86400 }); } catch { /* optional */ } }
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Public visitor chat. Same-origin only, rate limited, no provider details in the response. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const { env, ctx } = getCloudflareContext();
  if (origin && new URL(origin).host !== new URL(req.url).host) { await noteError(env.CACHE, `Request blocked: origin ${new URL(origin).host} does not match ${new URL(req.url).host}.`); return json(403, { ok: false }); }
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || p.data.messages[p.data.messages.length - 1].role !== "user") { await noteError(env.CACHE, `Invalid chat request: ${p.success ? "last message is not from the visitor" : p.error.issues.map((i) => i.path.join(".")).join(", ")}`); return json(400, { ok: false, error: "Invalid message." }); }
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bp-chat-min", who, 6, 60) || await isRateLimited(env.CACHE, "bp-chat", who, 40, 3600)) return json(429, { ok: false, error: "You are sending messages very quickly. Please wait a moment." });
  const input = { history: p.data.messages, path: p.data.path, cart: p.data.cart, lang: p.data.lang, memory: p.data.memory, sid: validCid(p.data.cid) ? p.data.cid : undefined, ipHash: who };
  const finish = async (r: Awaited<ReturnType<typeof chat>>) => {
    if (!r.ok || !r.text) { await noteError(env.CACHE, r.error ?? "The assistant returned no text."); return null; }
    // A good answer clears the old failure note, so the admin Overview never shows a stale error.
    ctx.waitUntil(env.CACHE.delete("beigepilot:lasterr").catch(() => {}));
    if (validCid(p.data.cid)) {
      const cid = p.data.cid;
      const user = p.data.messages[p.data.messages.length - 1].text;
      ctx.waitUntil((async () => { if ((await getSettings(env)).s.saveChats) await recordTurn(env, cid, p.data.path, user, { text: r.text, tools: r.trace.map((t) => t.name), provider: r.provider ?? "", tokens: (r.tokensIn ?? 0) + (r.tokensOut ?? 0), handoff: !!r.handoff }); })());
    }
    if (validCid(p.data.cid)) {
      const cid = p.data.cid;
      ctx.waitUntil((async () => {
        if (r.lang) await piloEvent(env, cid, "language", r.lang);
        if (r.cards.length) await piloEvent(env, cid, "recommendation", String(r.cards.length));
        if (r.offer || r.keptVolume || detectDiscountAsk(p.data.messages[p.data.messages.length - 1].text).ask) await piloEvent(env, cid, "discount_inquiry");
        if (r.offer) await piloEvent(env, cid, "offer_issued", String(r.offer.percent));
        if (r.keptVolume) await piloEvent(env, cid, "offer_kept_volume");
      })());
    }
    return { ok: true, lang: r.lang ?? "en", memory: r.memory ?? null, quick: r.quick ?? [], offer: r.offer ?? null, text: r.text, cards: r.cards, dfy: r.dfy ?? [], bundle: r.bundle ?? null, sources: r.sources, handoff: r.handoff, miss: !!r.miss, tools: r.tools ?? [] };
  };

  // Live status for the widget: one JSON line per step (tool started), then the final answer or a failure.
  if ((req.headers.get("accept") ?? "").includes("x-ndjson")) {
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(c) {
        const line = (o: unknown) => { try { c.enqueue(enc.encode(`${JSON.stringify(o)}\n`)); } catch { /* client left */ } };
        try {
          const done = await finish(await chat(env, { ...input, onTool: (name) => line({ t: "tool", name }) }));
          line(done ? { t: "done", ...done } : { t: "fail" });
        } catch { await noteError(env.CACHE, "Unexpected error while answering."); line({ t: "fail" }); }
        try { c.close(); } catch { /* closed */ }
      },
    });
    return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
  }

  const done = await finish(await chat(env, input));
  return done ? json(200, done) : json(503, { ok: false, unavailable: true });
}
