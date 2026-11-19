// Media Kit admin data layer against a LOCAL D1 + R2 (wrangler emulator).
import { readFileSync } from "node:fs";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, MediaKitError, addFile, deleteFile, discardDraft, getAdminKit, getPublishedFile, getPublishedKit, publishDraft, replaceFile, saveDraft, setFilePublished, sniffFile } from "@/lib/media-kit/store";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const text = (s: string) => new TextEncoder().encode(s);

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  env = proxy.env;
  const sql = readFileSync("drizzle/0018_media_kit.sql", "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.exec(s.replace(/\s+/g, " ") + ";");
  await env.DB.exec("CREATE TABLE IF NOT EXISTS settings_audit_log (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, actor text NOT NULL, category text NOT NULL, setting_key text NOT NULL, old_value text NOT NULL DEFAULT '', new_value text NOT NULL DEFAULT '', result text NOT NULL DEFAULT 'saved', created_at integer NOT NULL DEFAULT (unixepoch()));");
});
afterAll(async () => { await proxy.dispose(); });

const form = { ...DEFAULT_CONTENT };

describe("media kit text", () => {
  it("defaults, draft, publish and discard", async () => {
    expect((await getPublishedKit(env)).content).toEqual(DEFAULT_CONTENT);
    await saveDraft(env, "a@t.dev", { ...form, title: "Draft headline" });
    let kit = await getAdminKit(env);
    expect(kit.hasDraft).toBe(true);
    expect(kit.draft.title).toBe("Draft headline");
    expect((await getPublishedKit(env)).content.title).toBe(DEFAULT_CONTENT.title); // visitors do not see drafts
    await publishDraft(env, "a@t.dev");
    expect((await getPublishedKit(env)).content.title).toBe("Draft headline");
    await saveDraft(env, "a@t.dev", { ...form, title: "Second" });
    await discardDraft(env, "a@t.dev");
    kit = await getAdminKit(env);
    expect(kit.hasDraft).toBe(false);
    expect(kit.draft.title).toBe("Draft headline");
  });
  it("rejects empty and too-long fields", async () => {
    await expect(saveDraft(env, "a@t.dev", { ...form, title: "  " })).rejects.toBeInstanceOf(MediaKitError);
    await expect(saveDraft(env, "a@t.dev", { ...form, intro: "x".repeat(601) })).rejects.toBeInstanceOf(MediaKitError);
  });
});

describe("media kit files", () => {
  it("sniffs by bytes and refuses scripts in SVG", () => {
    expect(sniffFile(png)?.mime).toBe("image/png");
    expect(sniffFile(text("%PDF-1.7 hello"))?.ext).toBe("pdf");
    expect(sniffFile(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))?.mime).toBe("image/svg+xml");
    expect(() => sniffFile(text('<svg xmlns="x"><script>alert(1)</script></svg>'))).toThrow(MediaKitError);
    expect(() => sniffFile(text('<svg onload="x()"></svg>'))).toThrow(MediaKitError);
    expect(sniffFile(text("just some text file"))).toBeNull();
  });
  it("upload is hidden until published; replace, hide and delete work", async () => {
    await expect(addFile(env, "a@t.dev", { name: "x.txt", bytes: text("plain text here") }, { label: "X" })).rejects.toBeInstanceOf(MediaKitError);
    const f = await addFile(env, "a@t.dev", { name: "Press Photo.PNG", bytes: png }, { label: "Press photo", description: "Team" });
    expect(f.filename).toBe("press-photo.png");
    expect(await getPublishedFile(env, f.id)).toBeNull();
    expect((await getPublishedKit(env)).files).toHaveLength(0);
    await setFilePublished(env, "a@t.dev", f.id, true);
    expect((await getPublishedFile(env, f.id))?.label).toBe("Press photo");
    expect((await getPublishedKit(env)).files).toHaveLength(1);
    await replaceFile(env, "a@t.dev", f.id, { name: "new.pdf", bytes: text("%PDF-1.4 body body") });
    expect((await getPublishedFile(env, f.id))?.contentType).toBe("application/pdf");
    await setFilePublished(env, "a@t.dev", f.id, false);
    expect(await getPublishedFile(env, f.id)).toBeNull();
    await deleteFile(env, "a@t.dev", f.id);
    expect((await getAdminKit(env)).files).toHaveLength(0);
  });
});
