import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eventCounts, importDefaults, listCampaigns, livePopups, purgeOldPopupEvents, recordEvent, setStatus } from "@/lib/popups/store";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "popups-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(0[0-9]|1[0-9]|2[0-5])_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("popup storage", () => {
  it("imports the 12 drafts once and never overwrites", async () => {
    expect(await importDefaults(env)).toBe(12);
    expect(await importDefaults(env)).toBe(0);
    const { ready, items } = await listCampaigns(env);
    expect(ready).toBe(true);
    expect(items).toHaveLength(12);
    expect(items.every((c) => c.status === "draft")).toBe(true);
  });
  it("shows visitors nothing until a campaign is set live, then only live ones", async () => {
    expect(await livePopups(env)).toHaveLength(0);
    expect(await setStatus(env, "custom-audience", "live")).toBe(true);
    const l = await livePopups(env);
    expect(l.map((c) => c.id)).toEqual(["custom-audience"]);
    expect(await setStatus(env, "custom-audience", "bogus")).toBe(false);
    await setStatus(env, "custom-audience", "paused");
    expect(await livePopups(env)).toHaveLength(0);
  });
  it("records only anonymous events for live campaigns and counts them", async () => {
    expect(await recordEvent(env, "custom-audience", "impression", "home")).toBe(false); // paused
    await setStatus(env, "custom-audience", "live");
    expect(await recordEvent(env, "custom-audience", "impression", "home")).toBe(true);
    expect(await recordEvent(env, "custom-audience", "click", "home")).toBe(true);
    expect(await recordEvent(env, "custom-audience", "hack", "home")).toBe(false);
    expect(await recordEvent(env, "nope", "impression", "home")).toBe(false);
    expect((await eventCounts(env))["custom-audience"]).toEqual({ impression: 1, click: 1 });
    const cols = (await env.DB.prepare("PRAGMA table_info(popup_events)").all<{ name: string }>()).results.map((c) => c.name);
    expect(cols).toEqual(["id", "campaign_id", "event", "page_type", "created_at"]);
  });
  it("purges events older than 90 days", async () => {
    await env.DB.prepare("INSERT INTO popup_events (campaign_id, event, created_at) VALUES ('old','impression', unixepoch() - 100*86400)").run();
    await purgeOldPopupEvents(env);
    expect((await env.DB.prepare("SELECT COUNT(*) n FROM popup_events WHERE campaign_id='old'").first<{ n: number }>())?.n).toBe(0);
  });
});
