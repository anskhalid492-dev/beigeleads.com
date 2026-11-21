import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hydrateCatalog } from "@/lib/catalog-db";
import { searchBuilder } from "@/lib/bundles/builder";
import { loadBuilderSettings } from "@/lib/bundles/settings";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";

const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Lists the visitor can pick for Build Your Own Bundle. Read-only; prices come from the catalog. */
export async function GET(req: Request) {
  const { env } = getCloudflareContext();
  const u = new URL(req.url);
  const who = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "bundle-search", who, 600, 3600)) return json(429, { ok: false, error: "Too many searches. Try again in a few minutes." });
  await hydrateCatalog(env);
  const s = await loadBuilderSettings(env);
  if (!s.enabled) return json(200, { ok: true, items: [], hasMore: false, disabled: true });
  const r = searchBuilder(s, { q: u.searchParams.get("q")?.slice(0, 80) ?? "", country: u.searchParams.get("country")?.slice(0, 60) ?? "", category: u.searchParams.get("category")?.slice(0, 60) ?? "", offset: Number(u.searchParams.get("offset")) || 0 }, env.CHECKOUT_ALLOW_PLACEHOLDER === "true");
  return json(200, { ok: true, ...r });
}
