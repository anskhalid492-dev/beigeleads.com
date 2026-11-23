// Pilo chat persistence (CLAUDE.md section 147). Pure, storage injected so it can be tested.
// Closing the widget never touches this. Only startNew()/clear() (explicit visitor actions) end a conversation.
export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const SESSION_KEY = "bp-chat-v3";
/** Local (cross-tab, return-visit) copy lives this long after the LAST message. */
export const SESSION_TTL_MS = 24 * 3600_000;
export const MAX_SAVED = 30;
export type Saved<M> = { cid: string; msgs: M[]; mem: unknown; at: number };

export function newCid(): string {
  try { return crypto.randomUUID().replace(/-/g, "").slice(0, 24); } catch { return `c${Math.random().toString(36).slice(2, 14)}${Date.now().toString(36)}`.slice(0, 24); }
}

/** A conversation never shows the same assistant/user line twice in a row (double restore, double send). */
export function dedupe<M extends { role: string; text: string }>(list: M[]): M[] {
  const out: M[] = [];
  for (const m of list) { const p = out[out.length - 1]; if (p && p.role === m.role && p.text === m.text) continue; out.push(m); }
  return out;
}

function parse<M>(raw: string | null, now: number): Saved<M> | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<Saved<M>>;
    if (!j || typeof j.cid !== "string" || !/^[a-z0-9]{8,40}$/i.test(j.cid) || !Array.isArray(j.msgs) || typeof j.at !== "number") return null;
    if (now - j.at > SESSION_TTL_MS || j.at > now + 60_000) return null;
    return { cid: j.cid, msgs: j.msgs as M[], mem: j.mem, at: j.at };
  } catch { return null; }
}

/** The freshest valid saved conversation across the stores (tab storage first, then the local copy). */
export function loadSession<M extends { role: string; text: string }>(stores: Store[], now = Date.now()): Saved<M> | null {
  let best: Saved<M> | null = null;
  for (const s of stores) { try { const v = parse<M>(s.getItem(SESSION_KEY), now); if (v && (!best || v.at > best.at)) best = v; } catch { /* storage blocked */ } }
  return best ? { ...best, msgs: dedupe(best.msgs) } : null;
}

export function saveSession<M>(stores: Store[], s: Saved<M>): void {
  const raw = JSON.stringify({ ...s, msgs: s.msgs.slice(-MAX_SAVED) });
  for (const st of stores) { try { st.setItem(SESSION_KEY, raw); } catch { /* blocked or full */ } }
}

export function clearSession(stores: Store[]): void { for (const s of stores) { try { s.removeItem(SESSION_KEY); } catch { /* blocked */ } } }

/** Browser stores: tab storage + local copy. Empty when the browser blocks storage. */
export function browserStores(): Store[] {
  const out: Store[] = [];
  try { out.push(window.sessionStorage); } catch { /* blocked */ }
  try { out.push(window.localStorage); } catch { /* blocked */ }
  return out;
}
