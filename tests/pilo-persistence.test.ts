import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clearSession, dedupe, loadSession, newCid, saveSession, SESSION_TTL_MS, type Store } from "@/lib/beigepilot/v2/session";
import { describe as describeMemory, EMPTY_MEMORY, parseMemory, remember } from "@/lib/beigepilot/v2/memory";

const fake = (): Store & { data: Map<string, string> } => { const data = new Map<string, string>(); return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }; };
type M = { role: "user" | "assistant"; text: string };
const conv = (cid = newCid()): { cid: string; msgs: M[]; mem: unknown; at: number } => ({ cid, msgs: [{ role: "user", text: "Hello" }, { role: "assistant", text: "Hi! Who are we finding today?" }], mem: null, at: Date.now() });

describe("Pilo chat persistence", () => {
  it("A: close and reopen keeps both messages (closing touches no storage)", () => {
    const tab = fake(), local = fake(); const c = conv();
    saveSession([tab, local], c);
    // "close" = hide the widget: nothing is called. Reopen = load again.
    const v = loadSession<M>([tab, local])!;
    expect(v.msgs.map((m) => m.text)).toEqual(["Hello", "Hi! Who are we finding today?"]);
    expect(v.cid).toBe(c.cid);
  });
  it("B/C: refresh and navigation restore the same conversation id and order", () => {
    const tab = fake(), local = fake(); const c = conv();
    c.msgs.push({ role: "user", text: "dentists" }, { role: "assistant", text: "Which country?" }, { role: "user", text: "USA" });
    saveSession([tab, local], c);
    const v = loadSession<M>([tab, local])!;
    expect(v.msgs.map((m) => m.text)).toEqual(["Hello", "Hi! Who are we finding today?", "dentists", "Which country?", "USA"]);
    expect(v.cid).toBe(c.cid);
  });
  it("return visit (new tab, tab storage empty) restores from the local copy within 24 h", () => {
    const local = fake(); saveSession([fake(), local], conv());
    expect(loadSession<M>([fake(), local])?.msgs.length).toBe(2);
    expect(loadSession<M>([fake(), local], Date.now() + SESSION_TTL_MS + 5000)).toBeNull();
  });
  it("D: restored memory keeps the audience and quantity for the AI backend", () => {
    let m = remember(EMPTY_MEMORY, "I need 50K dentists in the USA", "en");
    const tab = fake(); saveSession([tab], { ...conv(), mem: m });
    const v = loadSession<M>([tab])!; m = parseMemory(v.mem);
    const text = JSON.stringify(describeMemory(m)).toLowerCase();
    expect(text).toMatch(/dentist/); expect(text).toMatch(/50/);
  });
  it("E: a new chat gets a NEW id and no old messages", () => {
    const tab = fake(), local = fake(); const old = conv(); saveSession([tab, local], old);
    clearSession([tab, local]); const fresh = newCid(); saveSession([tab, local], { cid: fresh, msgs: [], mem: null, at: Date.now() });
    const v = loadSession<M>([tab, local])!;
    expect(v.cid).not.toBe(old.cid); expect(v.msgs).toEqual([]);
  });
  it("F: guests are isolated: storage is per browser and no public route reads a conversation by id", () => {
    const a = fake(), b = fake(); saveSession([a], conv());
    expect(loadSession<M>([b])).toBeNull();
    // A tampered id/blob is refused.
    a.data.set("bp-chat-v3", JSON.stringify({ cid: "../../x", msgs: [], at: Date.now() })); expect(loadSession<M>([a])).toBeNull();
    // No visitor-facing route returns stored conversations (history is read only in /admin).
    const routes = ["chat", "feedback", "event", "config", "handoff", "offer", "proactive"].map((r) => { try { return readFileSync(`app/api/beigepilot/${r}/route.ts`, "utf8"); } catch { return ""; } }).join("\n");
    expect(routes).not.toMatch(/listConversations|getConversation|conversationMessages/);
  });
  it("G: no duplicates after restore, and corrupt storage is ignored", () => {
    expect(dedupe([{ role: "assistant", text: "a" }, { role: "assistant", text: "a" }, { role: "user", text: "b" }]).length).toBe(2);
    const s = fake(); s.data.set("bp-chat-v3", "{not json"); expect(loadSession<M>([s])).toBeNull();
    const blocked: Store = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(loadSession<M>([blocked])).toBeNull(); expect(() => saveSession([blocked], conv())).not.toThrow();
  });
  it("closing the widget never clears the chat (source guard)", () => {
    const src = readFileSync("components/beigepilot/panel.tsx", "utf8");
    const close = src.slice(src.indexOf("const close = "), src.indexOf("const startNew"));
    expect(close).not.toMatch(/setMsgs|clearSession|startNew|newCid/);
    expect(src).not.toMatch(/close\(true\)/);
    expect(src).toMatch(/epoch\.current\+\+/); // a new chat drops a late answer from the old one
  });
});
