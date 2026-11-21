"use client";
// Proactive messages from Pilo. Max 3 per session, timed by ACTIVE browsing (visible tab), kept in sessionStorage so refreshes and
// navigation never restart or repeat them. Stops for good after a click, a dismissal or the first chat message.
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/client";
import { advance, dueStage, freshState, markEvent, onHidden, onNothing, onShown, onStop, type SState } from "@/lib/beigepilot/proactive/schedule";
import { trackPro } from "@/lib/beigepilot/proactive/track";
import { cleanSearch, type Stage } from "@/lib/beigepilot/proactive/types";
import type { ProEvent } from "@/lib/beigepilot/proactive/events";
import { exitCopy, exitDue, exitVariant, flickedToTop, leftThroughTop } from "@/lib/beigepilot/v2/exit";
import { isLang, type Lang } from "@/lib/beigepilot/v2/lang";
import { trackPilo } from "@/lib/beigepilot/v2/track";

const KEY = "bl-pilo-pro-v1";
export type ProCfg = { enabled: boolean; delays: number[]; bubbleSeconds: number; mobile: boolean; exitIntent?: boolean };
export type Bubble = { id: string; stage: Stage; text: string; cta: string; opening: string; page: string; /** exit-intent bubbles carry a second "No Thanks" button */ secondary?: string; exit?: boolean };

function sid(): string { const a = new Uint8Array(8); try { crypto.getRandomValues(a); } catch { for (let i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256); } return [...a].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function load(): SState {
  try { const r = sessionStorage.getItem(KEY); if (r) { const j = JSON.parse(r) as SState; if (j && typeof j.sid === "string" && /^[a-f0-9]{16}$/.test(j.sid)) return { ...freshState(j.sid), ...j }; } } catch { /* storage blocked */ }
  return freshState(sid());
}
const save = (s: SState) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } };

export function useProactive({ cfg, path, active, open }: { cfg: ProCfg | undefined; path: string; active: boolean; open: boolean }) {
  const cart = useCart();
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [unread, setUnread] = useState(false); // a message went away by itself (not dismissed): a small dot stays on the launcher
  const st = useRef<SState | null>(null);
  const bub = useRef<Bubble | null>(null);
  const live = useRef({ cfg, path, active, open, cart: [] as string[] });
  const inflight = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readyAt = useRef(0);
  const slugs = cart.map((c) => c.slug).join(",");
  useEffect(() => { live.current = { cfg, path, active, open, cart: slugs ? slugs.split(",") : [] }; });
  const get = () => (st.current ??= load());
  const put = (s: SState) => { st.current = s; save(s); };

  const send = useCallback((event: ProEvent, stage?: Stage) => {
    const s = get(); const g = stage ?? s.last; if (!g) return;
    const r = markEvent(s, `${g}:${event}`); put(r.s);
    if (r.fresh) trackPro(s.sid, g, event, g === s.last ? s.tpl ?? "" : "", g === s.last ? s.pg ?? "" : "");
  }, []);

  const hide = useCallback(() => { clearTimeout(hideTimer.current); if (bub.current) { bub.current = null; setBubble(null); put(onHidden(get())); } }, []);
  const autoHide = useCallback(() => { if (bub.current) setUnread(true); hide(); }, [hide]);

  // Where the visitor has been: product pages and a real search term (from /lists?q= or the home search box).
  useEffect(() => {
    const s = get(); let next = s;
    if (/^\/lists\/[^/]+$/.test(path) && s.recent[s.recent.length - 1] !== path) next = { ...next, recent: [...s.recent, path].slice(-6) };
    if (path === "/lists") { const q = cleanSearch(new URLSearchParams(window.location.search).get("q")); if (q) next = { ...next, search: q }; }
    if (next !== s) put(next);
  }, [path]);
  useEffect(() => {
    const on = (e: Event) => { const q = cleanSearch((e as CustomEvent<{ q?: string }>).detail?.q); if (q) put({ ...get(), search: q }); };
    window.addEventListener("bl:pilo-search", on);
    return () => window.removeEventListener("bl:pilo-search", on);
  }, []);

  // The schedule: one tick a second, counting only while the tab is visible.
  useEffect(() => {
    let last = Date.now();
    const iv = setInterval(() => {
      const now = Date.now(); const dt = now - last; last = now;
      const L = live.current; let s = advance(get(), dt, document.visibilityState === "visible"); put(s);
      if (!L.active || !L.cfg?.enabled || inflight.current) return;
      if (!readyAt.current) readyAt.current = now + 1500; // let Pilo finish appearing first
      if (now < readyAt.current) return;
      const el = document.activeElement; if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const blocked = L.path.startsWith("/checkout") || L.path.startsWith("/admin");
      const mob = !L.cfg.mobile && window.matchMedia("(max-width: 639px)").matches;
      const stage = dueStage(s, L.cfg.delays, { chatOpen: L.open, bubbleVisible: !!bub.current, pathBlocked: blocked, mobileBlocked: mob });
      if (!stage) return;
      inflight.current = true; const path = L.path;
      fetch("/api/beigepilot/proactive", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stage, path, search: s.search, recent: s.recent, cart: L.cart, shown: s.shown }) })
        .then((r) => (r.ok ? (r.json() as Promise<{ msg: Bubble | null }>) : { msg: null }))
        .then(({ msg }) => {
          s = get();
          const L2 = live.current;
          if (!msg) { put(onNothing(s)); return; }
          if (s.stop || L2.open || !L2.active || bub.current || s.stage >= stage || L2.path !== path) { put(onNothing(s)); return; } // the situation changed while asking
          put(onShown(s, stage, msg.id, msg.page)); bub.current = { ...msg, stage }; setBubble(bub.current);
          send("impression", stage);
          clearTimeout(hideTimer.current); hideTimer.current = setTimeout(autoHide, (L2.cfg?.bubbleSeconds ?? 25) * 1000);
        })
        .catch(() => put(onNothing(get())))
        .finally(() => { inflight.current = false; });
    }, 1000);
    return () => { clearInterval(iv); clearTimeout(hideTimer.current); };
  }, [hide, send, autoHide]);

  // Exit intent: desktop = the pointer leaves through the top edge while moving up; touch = only a deliberate flick back to the top after
  // a long scroll (there is no cursor, so nothing is faked). Shares the proactive state: one per session, counts toward the 3-message cap.
  useEffect(() => {
    const fire = () => {
      const L = live.current; const s = get();
      if (!L.active || inflight.current) return;
      const el = document.activeElement; const formFocused = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (!exitDue(s, { chatOpen: L.open, bubbleVisible: !!bub.current, path: L.path, enabled: !!L.cfg?.enabled && L.cfg.exitIntent !== false, formFocused })) return;
      if (!L.cfg?.mobile && window.matchMedia("(max-width: 639px)").matches) return;
      let lang: Lang = "en"; try { const l = sessionStorage.getItem("bp-lang-v1"); if (isLang(l)) lang = l; } catch { /* default */ }
      const v = exitVariant(L.path); const c = exitCopy(lang, v);
      const stage = (s.stage + 1) as Stage;
      put({ ...onShown(s, stage, `exit-${v}`, v), exit: true });
      bub.current = { id: `exit-${v}`, stage, text: c.text, cta: c.cta, secondary: c.secondary, opening: c.opening, page: v, exit: true }; setBubble(bub.current);
      send("impression", stage); trackPilo(s.sid, "exit_impression", v);
      clearTimeout(hideTimer.current); hideTimer.current = setTimeout(autoHide, Math.max(20, L.cfg?.bubbleSeconds ?? 25) * 1000);
    };
    let prevY = 9999; const samples: { y: number; at: number }[] = [];
    const move = (e: MouseEvent) => { prevY = e.clientY; };
    const out = (e: MouseEvent) => { if (leftThroughTop(prevY, e.clientY, e.relatedTarget)) fire(); };
    const scroll = () => {
      if (!window.matchMedia("(hover: none)").matches) return;
      const y = window.scrollY; samples.push({ y, at: Date.now() }); while (samples.length && Date.now() - samples[0].at > 1200) samples.shift();
      if (flickedToTop(samples, document.documentElement.scrollHeight, window.innerHeight)) { samples.length = 0; fire(); }
    };
    document.addEventListener("mousemove", move, { passive: true }); document.documentElement.addEventListener("mouseleave", out); window.addEventListener("scroll", scroll, { passive: true });
    return () => { document.removeEventListener("mousemove", move); document.documentElement.removeEventListener("mouseleave", out); window.removeEventListener("scroll", scroll); };
  }, [hide, send, autoHide]);

  // A bubble never stays while the chat is open.
  useEffect(() => { if (open) { hide(); if (get().last) send("chat_open"); } }, [open, hide, send]);
  useEffect(() => { if (!active) hide(); }, [active, hide]);

  // Real things that happen in the chat or the shop, attributed to the most recent message of this session.
  useEffect(() => {
    const started = () => { if (get().last) send("conversation_start"); put(onStop(get())); hide(); };
    const recs = () => send("product_rec");
    const added = () => send("add_to_cart");
    const bought = () => send("purchase");
    window.addEventListener("bl:pilo-chat-started", started); window.addEventListener("bl:pilo-recs", recs);
    window.addEventListener("bl:pilo-cart-add", added); window.addEventListener("bl:purchased", bought);
    return () => { window.removeEventListener("bl:pilo-chat-started", started); window.removeEventListener("bl:pilo-recs", recs); window.removeEventListener("bl:pilo-cart-add", added); window.removeEventListener("bl:purchased", bought); };
  }, [hide, send]);

  const click = useCallback((): string | null => { const b = bub.current; if (!b) return null; setUnread(false); send("click", b.stage); if (b.exit) trackPilo(get().sid, "exit_click", b.page); put(onStop(get())); hide(); return b.opening; }, [hide, send]);
  const dismiss = useCallback(() => { setUnread(false); const b = bub.current; if (b) { send("dismiss", b.stage); if (b.exit) trackPilo(get().sid, "exit_dismiss", b.page); } put(onStop(get())); hide(); }, [hide, send]);
  return { bubble, click, dismiss, unread: unread && !open };
}
