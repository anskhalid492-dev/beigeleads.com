import { readFileSync } from "node:fs";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { feedbackSchema, recordFeedback } from "@/lib/help/feedback";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  env = proxy.env;
  const sql = readFileSync("drizzle/0019_help_feedback.sql", "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.exec(s.replace(/\s+/g, " ") + ";");
});
afterAll(async () => { await proxy.dispose(); });

describe("help feedback", () => {
  it("stores votes for real articles only", async () => {
    await recordFeedback(env, "pricing/no-subscription", true);
    await recordFeedback(env, "pricing/no-subscription", false);
    await expect(recordFeedback(env, "made/up", true)).rejects.toThrow();
    const r = await env.DB.prepare("SELECT helpful FROM help_feedback WHERE article_id = ?").bind("pricing/no-subscription").all();
    expect(r.results.map((x) => x.helpful).sort()).toEqual([0, 1]);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM help_feedback").first<{ n: number }>())?.n).toBe(2);
  });
  it("validates the request body", () => {
    expect(feedbackSchema.safeParse({ article: "a/b", helpful: true }).success).toBe(true);
    expect(feedbackSchema.safeParse({ article: "a/b", helpful: "yes" }).success).toBe(false);
  });
});
