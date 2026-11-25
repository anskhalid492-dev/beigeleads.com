"use client";
// The BeigePilot chat panel (loaded only after the visitor first opens the assistant). State lives here so minimizing keeps the chat.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Check, Copy, MoreVertical, RotateCcw, Search, Send, Square, Tag, ThumbsDown, ThumbsUp, Wallet, GitCompare, X, LifeBuoy, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart/client";
import type { Bundle, Card, DfyCardData, Extra, OfferCard, Source } from "@/lib/beigepilot/tools";
import { LANGS, detectLang, isLang, isRtl, t, type Lang } from "@/lib/beigepilot/v2/lang";
import { browserStores, clearSession, dedupe, loadSession, newCid, saveSession } from "@/lib/beigepilot/v2/session";
import { EMPTY_MEMORY, describe as describeMemory, parseMemory, remember, type Memory } from "@/lib/beigepilot/v2/memory";
import type { Quick } from "@/lib/beigepilot/v2/followup";
import { revealCut, stepSize, wordCount } from "@/lib/beigepilot/v2/reveal";
import { trackPilo } from "@/lib/beigepilot/v2/track";
import { OfferCardView } from "./offer-card";
import { useRouter } from "next/navigation";
import { chipsFor, isCheer } from "@/lib/beigepilot/suggest";
import { ApiForm } from "@/components/forms/api-form";
import { Markup } from "./markup";
import { ChatBundle, ChatDfyCard, ChatProductCard } from "./product-card";
import { ChatExtra } from "./extras";
import { useGaze, setGaze } from "./use-gaze";
import { Pilo, type Intensity, type Mood } from "./pilo";

export type Cfg = { enabled: boolean; greeting: string; saving?: boolean; name: string; humor: "professional" | "friendly" | "playful"; motion: Intensity; launcher: "right" | "left"; suggestions: string[]; sales?: { finder: boolean; cart: boolean; budget: boolean; handoff: boolean }; proactive?: { enabled: boolean; delays: number[]; bubbleSeconds: number; mobile: boolean; exitIntent?: boolean }; negotiation?: boolean };
type Msg = { role: "user" | "assistant"; text: string; rated?: 1 | -1; cards?: Card[]; extras?: Extra[]; dfy?: DfyCardData[]; bundle?: Bundle | null; sources?: Source[]; handoff?: boolean; miss?: boolean; quick?: Quick[]; offer?: OfferCard | null; fresh?: boolean };
type Done = { t?: string; ok?: boolean; text?: string; cards?: Card[]; extras?: Extra[]; dfy?: DfyCardData[]; bundle?: Bundle | null; sources?: Source[]; handoff?: string | null; miss?: boolean; error?: string; lang?: string; memory?: unknown; quick?: Quick[]; offer?: OfferCard | null };

// A message Pilo wrote first (from a proactive bubble) is shown in the chat but not sent: providers need the visitor to speak first.
const dropLeadingAssistant = (l: Msg[]) => { let i = 0; while (i < l.length && l[i].role === "assistant") i++; return l.slice(i); };
const CID = "bp-cid-v1";
const MEM_KEY = "bp-mem-v1", LANG_KEY = "bp-lang-v1", KEEP_KEY = "bl-pilo-remember-v1", KEEP_MEM = "bl-pilo-mem-v1", KEEP_DAYS = 30;
const PACKAGE_TOOLS = new Set(["getProductPackages", "findWithinBudget", "prepareAddToCart"]);
const SEARCH_TOOLS = new Set(["searchProducts", "getProductDetails", "getProductPackages", "getRelatedProducts", "getProductVerificationInfo", "showProductCards"]);
/** Stable for the whole conversation: survives close, refresh, navigation and return visits (24 h) until the visitor starts a new chat. */
let liveCid = "";
function chatId(): string {
  if (liveCid) return liveCid;
  const saved = loadSession<Msg>(browserStores());
  liveCid = saved?.cid ?? newCid();
  if (!saved) saveSession(browserStores(), { cid: liveCid, msgs: [], mem: null, at: Date.now() });
  return liveCid;
}

export type Launch = { n: number; ask?: string; action?: "support"; seed?: string };

export function BeigePilotPanel({ cfg, path, open, launch, onClosed }: { cfg: Cfg; path: string; open: boolean; launch?: Launch | null; onClosed: (clear: boolean) => void }) {
  const cart = useCart();
  const [msgs, setMsgs] = useState<Msg[]>(() => { const v = loadSession<Msg>(browserStores()); return v ? v.msgs.map((m) => ({ ...m, fresh: false })) : []; });
  const epoch = useRef(0); // bumped by New chat / Clear so a late answer from the old conversation is dropped
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState("");
  // A refresh in the middle of an answer leaves the visitor's last line unanswered: offer Retry instead of silence.
  const [err, setErr] = useState<string | null>(() => (msgs[msgs.length - 1]?.role === "user" ? "That answer did not finish. Try again." : null));
  const [online, setOnline] = useState(true);
  const [form, setForm] = useState<number | "err" | "direct" | null>(null);
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [closing, setClosing] = useState(false);
  const [flash, setFlash] = useState<Mood | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panel = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const name = cfg.name || "Pilo";
  const hero = useRef<HTMLDivElement>(null);
  const [landing, setLanding] = useState(false);
  const [openN, setOpenN] = useState(0);
  // BeigePilot 2.0: language ("auto" detects), memory, optional persistence on this device, scroll helper.
  const [langSel, setLangSel] = useState<Lang | "auto">("auto");
  const [lang, setLang] = useState<Lang>("en");
  const [mem, setMem] = useState<Memory>(() => { const v = loadSession<Msg>(browserStores()); return v ? parseMemory(v.mem) : EMPTY_MEMORY; });
  const [keep, setKeep] = useState(false);
  const [away, setAway] = useState(false);
  const rtl = isRtl(lang);

  const doFlash = useCallback((m: Mood, ms: number) => { setFlash(m); clearTimeout(flashTimer.current); flashTimer.current = setTimeout(() => setFlash(null), ms); }, []);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  useEffect(() => {
    const tm = setTimeout(() => {
      try {
        const l = sessionStorage.getItem(LANG_KEY); if (isLang(l)) { setLang(l); } const ls = sessionStorage.getItem(LANG_KEY + "-sel"); if (isLang(ls)) setLangSel(ls);
        const m = sessionStorage.getItem(MEM_KEY); if (m) setMem(parseMemory(JSON.parse(m)));
        if (localStorage.getItem(KEEP_KEY) === "1") {
          setKeep(true);
          const raw = localStorage.getItem(KEEP_MEM);
          if (raw && !sessionStorage.getItem(MEM_KEY)) { const j = JSON.parse(raw) as { mem: unknown; at: number }; if (Date.now() - j.at < KEEP_DAYS * 86400_000) setMem(parseMemory(j.mem)); else localStorage.removeItem(KEEP_MEM); }
        }
      } catch { /* storage blocked */ }
    }, 0);
    return () => clearTimeout(tm);
  }, []);
  // Saved after every change (never while empty, so merely opening Pilo cannot overwrite or extend an old chat).
  useEffect(() => { if (msgs.length) saveSession(browserStores(), { cid: chatId(), msgs: msgs.map(({ fresh, ...m }) => (void fresh, m)), mem, at: Date.now() }); }, [msgs, mem]);
  useEffect(() => {
    try { sessionStorage.setItem(MEM_KEY, JSON.stringify(mem)); sessionStorage.setItem(LANG_KEY, lang); sessionStorage.setItem(LANG_KEY + "-sel", langSel); } catch { /* ignore */ }
    try { if (keep) localStorage.setItem(KEEP_MEM, JSON.stringify({ mem, at: Date.now() })); } catch { /* ignore */ }
  }, [mem, lang, langSel, keep]);
  // Keep the newest message in view, unless the visitor scrolled up to read.
  useEffect(() => { if (!away) end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy, err, open, form, away]);

  useEffect(() => {
    if (!open) return;
    const lt = setTimeout(() => setLanding(false), 1000);
    const tm = setTimeout(() => { setOpenN((n) => n + 1); setLanding(true); doFlash("wave", 2300); if (window.matchMedia("(pointer: fine)").matches) input.current?.focus(); else panel.current?.focus(); }, 0);
    return () => { clearTimeout(tm); clearTimeout(lt); };
  }, [open, doFlash]);
  useEffect(() => { if (open) trackPilo(chatId(), "chat_open", "", path.split("/")[1]?.slice(0, 18) ?? ""); }, [open, path]);

  // Mobile: follow the visual viewport so the composer stays above the on-screen keyboard (and the safe area).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    const on = () => {
      const el = panel.current; if (!el) return;
      if (window.innerWidth >= 640) { el.style.height = ""; el.style.top = ""; el.style.bottom = ""; return; }
      el.style.height = `${vv.height}px`; el.style.top = `${vv.offsetTop}px`; el.style.bottom = "auto";
    };
    on(); vv.addEventListener("resize", on); vv.addEventListener("scroll", on); window.addEventListener("resize", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); window.removeEventListener("resize", on); const el = panel.current; if (el) { el.style.height = ""; el.style.top = ""; el.style.bottom = ""; } };
  }, [open]);

  useEffect(() => { const el = input.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 112)}px`; }, [text]);

  const run = useCallback(async (list: Msg[], uiLang: Lang, memory: Memory) => {
    setBusy(true); setTool(""); setErr(null);
    const ep = epoch.current;
    const ac = new AbortController(); abort.current = ac;
    let final: Done | null = null; let reason = "";
    try {
      const res = await fetch("/api/beigepilot/chat", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/x-ndjson, application/json" }, signal: ac.signal,
        body: JSON.stringify({ cid: chatId(), lang: langSel === "auto" ? undefined : langSel, memory, messages: dropLeadingAssistant(list.slice(-12)).map((m) => ({ role: m.role, text: m.text.slice(0, 1500) })), path, cart: cart.slice(0, 10) }),
      });
      if ((res.headers.get("content-type") ?? "").includes("ndjson") && res.body) {
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
        for (;;) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line) continue;
            try { const o = JSON.parse(line) as Done & { name?: string }; if (o.t === "tool" && o.name) setTool(o.name); else if (o.t === "done") final = o; } catch { /* partial line */ }
          }
        }
      } else {
        const j = (await res.json().catch(() => ({}))) as Done;
        if (res.ok && j.ok && j.text) final = j; else if (res.status === 429) reason = j.error ?? "Please wait a moment before sending more messages.";
      }
    } catch (e) { if ((e as Error).name === "AbortError") { setBusy(false); setTool(""); abort.current = null; return; } reason = "I could not reach the server. Check your connection and try again."; }
    abort.current = null;
    if (ep !== epoch.current) return; // a new chat was started meanwhile: drop this answer
    setBusy(false); setTool("");
    if (final?.text) {
      const hasCards = !!final.cards?.length;
      if (isLang(final.lang) && langSel === "auto") setLang(final.lang);
      if (final.memory) setMem(parseMemory(final.memory));
      setMsgs([...list, { role: "assistant", text: final.text, cards: final.cards, extras: final.extras, dfy: final.dfy, bundle: final.bundle, sources: final.sources, handoff: !!final.handoff, miss: !!final.miss && !hasCards, quick: final.quick, offer: final.offer ?? null, fresh: true }]);
      setOnline(true);
      if (hasCards) window.dispatchEvent(new Event("bl:pilo-recs"));
      if (hasCards) doFlash("found", 2200); else if (final.miss) doFlash("confused", 2600); else if (final.offer) doFlash("excited", 2400);
    } else {
      setOnline(false);
      setErr(reason || (cfg.humor === "professional" ? "Something went wrong. Please try again." : "Oops, I tripped over my own feet. Let's try again."));
    }
  }, [path, cart, cfg.humor, doFlash, langSel]);

  const send = useCallback((raw: string, viaQuick = false) => {
    const tx = raw.trim();
    if (!tx || busy) return;
    if (!msgs.some((m) => m.role === "user")) { window.dispatchEvent(new Event("bl:pilo-chat-started")); trackPilo(chatId(), "conversation_start", "", ""); }
    if (viaQuick) trackPilo(chatId(), "followup_click", "quick");
    // Language: an explicit choice wins; otherwise follow what the visitor writes.
    let ui = lang;
    if (langSel === "auto") { const d = detectLang(tx); if (d && d !== lang) { ui = d; setLang(d); } }
    const memory = remember(mem, tx, ui); setMem(memory);
    const next: Msg[] = [...msgs.map((m) => ({ ...m, quick: undefined })), { role: "user", text: tx }];
    setMsgs(next); setText(""); doFlash(isCheer(tx) ? "giggle" : "nod", isCheer(tx) ? 1800 : 600); setForm(null); setAway(false);
    void run(next, ui, memory);
  }, [busy, msgs, run, doFlash, lang, langSel, mem]);

  const stop = () => { abort.current?.abort(); };
  const retry = () => { if (!busy && msgs.length && msgs[msgs.length - 1].role === "user") void run(msgs, lang, mem); };
  const rate = (i: number, rating: 1 | -1) => {
    setMsgs((m) => m.map((x, j) => (j === i ? { ...x, rated: rating } : x)));
    if (rating === 1) doFlash("giggle", 1800);
    void fetch("/api/beigepilot/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cid: chatId(), idx: i, rating }) }).catch(() => {});
  };
  /** Hides the widget. It never ends or clears the conversation (an answer still being written lands in the kept chat). */
  const close = () => { if (closing) return; setClosing(true); setFlash("bye"); setMenu(false); setTimeout(() => { setClosing(false); setFlash(null); onClosed(false); }, 650); };
  /** Explicit visitor action: a fresh conversation with a NEW id. Closing never calls this. */
  const startNew = (forgetDevice: boolean) => {
    epoch.current++; abort.current?.abort(); abort.current = null;
    clearSession(browserStores()); liveCid = newCid();
    saveSession(browserStores(), { cid: liveCid, msgs: [], mem: null, at: Date.now() });
    setMsgs([]); setErr(null); setForm(null); setText(""); setBusy(false); setTool(""); setMem({ ...EMPTY_MEMORY, lang }); setConfirmClear(false); setMenu(false); setAway(false);
    try { sessionStorage.removeItem(MEM_KEY); if (forgetDevice) localStorage.removeItem(KEEP_MEM); } catch { /* ignore */ }
    trackPilo(liveCid, forgetDevice ? "memory_cleared" : "conversation_new");
  };
  const clearAll = () => startNew(true);
  const toggleKeep = () => {
    const on = !keep; setKeep(on);
    try { if (on) { localStorage.setItem(KEEP_KEY, "1"); localStorage.setItem(KEEP_MEM, JSON.stringify({ mem, at: Date.now() })); } else { localStorage.removeItem(KEEP_KEY); localStorage.removeItem(KEEP_MEM); } } catch { /* ignore */ }
  };
  const pickLang = (v: string) => {
    if (v === "auto") { setLangSel("auto"); return; }
    if (isLang(v)) { setLangSel(v); setLang(v); setMem((m) => ({ ...m, lang: v })); trackPilo(chatId(), "language", v); }
  };

  const searching = busy && SEARCH_TOOLS.has(tool);
  const mood: Mood = closing ? "bye" : flash ?? (busy ? (searching ? "search" : "think") : err ? "error" : text.trim() ? "curious" : "idle");
  const chips = useMemo(() => chipsFor(cfg.suggestions, cfg.sales), [cfg.suggestions, cfg.sales]);
  const status = busy ? t(lang, "thinking") : online ? t(lang, "online") : "Having trouble";
  // Activity labels appear only while that kind of tool is REALLY running.
  const activity = !busy ? "" : tool === "requestDiscount" ? t(lang, "offers") : PACKAGE_TOOLS.has(tool) ? t(lang, "checking") : SEARCH_TOOLS.has(tool) ? t(lang, "searching") : "";
  const welcome = useMemo(() => {
    const out: { id: string; Icon: typeof Search; title: string; sub: string; ask: string }[] = [];
    if (cfg.sales?.finder !== false) out.push({ id: "find", Icon: Search, title: t(lang, "cardFind"), sub: t(lang, "cardFindSub"), ask: "Help me find a database." });
    if (cfg.sales?.budget !== false) out.push({ id: "budget", Icon: Wallet, title: t(lang, "cardBudget"), sub: t(lang, "cardBudgetSub"), ask: "I want to shop by budget." });
    if (cfg.sales?.finder !== false) out.push({ id: "compare", Icon: GitCompare, title: t(lang, "cardCompare"), sub: t(lang, "cardCompareSub"), ask: "Help me compare databases." });
    if (cfg.negotiation) out.push({ id: "discount", Icon: Tag, title: t(lang, "cardDiscount"), sub: t(lang, "cardDiscountSub"), ask: "Is there a discount available for my cart?" });
    return out;
  }, [cfg.sales, cfg.negotiation, lang]);

  useGaze(hero, open && msgs.length === 0, 520);
  useEffect(() => { if (text.trim()) setGaze(hero.current, 0, 0.9); }, [text]);

  const pickChip = (c: { ask?: string; focus?: boolean; action?: "cart" | "support" }) => {
    if (c.action === "cart") { close(); router.push("/cart"); return; }
    if (c.action === "support") { setMsgs((m) => [...m, { role: "assistant", text: "Of course! I can send your question to the BeigeLeads support team. Fill in the form below." }]); setForm("direct"); return; }
    if (c.ask) send(c.ask); else input.current?.focus();
  };
  const lastAssistant = msgs.length - 1;
  const doneLaunch = useRef(0);
  useEffect(() => {
    if (!launch || doneLaunch.current === launch.n) return;
    const tm = setTimeout(() => { doneLaunch.current = launch.n; if (launch.seed) { const seed = launch.seed; setMsgs((m) => (m[m.length - 1]?.text === seed ? m : [...m, { role: "assistant", text: seed }])); input.current?.focus(); } else if (launch.ask) send(launch.ask); else if (launch.action === "support") pickChip({ action: "support" }); else input.current?.focus(); }, 450);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch]);

  const onScroll = () => { const el = scroller.current; if (!el) return; setAway(el.scrollHeight - el.scrollTop - el.clientHeight > 140); };
  const remembered = describeMemory(mem);
  const iconBtn = "grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600";

  return (
    <section ref={panel} tabIndex={-1} role="dialog" dir={rtl ? "rtl" : "ltr"} lang={lang} aria-label={`${name}, BeigeLeads assistant`} style={open || closing ? undefined : { display: "none" }}
      onKeyDown={(e) => { if (e.key === "Escape") { if (menu) setMenu(false); else close(); } }}
      className={`${closing ? "bp-close" : "bp-open"} fixed inset-0 z-50 flex flex-col overflow-hidden bg-sand-50 pb-[env(safe-area-inset-bottom)] outline-none sm:inset-auto sm:bottom-5 sm:h-[min(660px,calc(100vh-2.5rem))] sm:w-[400px] sm:rounded-[1.75rem] sm:border sm:border-sand-300 sm:pb-0 sm:shadow-[0_24px_60px_-24px_rgba(15,42,29,.5)] ${cfg.launcher === "left" ? "sm:left-5" : "sm:right-5"}`}>
      <header className="flex items-center gap-1.5 border-b border-sand-200 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <span className="shrink-0"><Pilo crop="avatar" mood={mood} size={42} intensity={cfg.motion} /></span>
        <div className="min-w-0 flex-1 ps-1">
          <p className="display text-[1.1rem] leading-none text-forest-900">{name} <span aria-hidden>💜</span></p>
          <p className="flex items-center gap-1.5 text-[0.7rem]" aria-live="polite"><span aria-hidden className={`size-1.5 rounded-full ${online ? "bg-forest-500" : "bg-amber-500"}`} />{status}</p>
        </div>
        <label className="sr-only" htmlFor="bp-lang">{t(lang, "language")}</label>
        <select id="bp-lang" value={langSel === "auto" ? "auto" : lang} onChange={(e) => pickLang(e.target.value)} className="h-8 max-w-[5.6rem] rounded-full border border-sand-300 bg-white px-2 text-[0.72rem] font-semibold text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
          <option value="auto">Auto</option>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
        <button type="button" onClick={() => { setMenu((v) => !v); setConfirmClear(false); }} aria-expanded={menu} aria-haspopup="true" aria-label={t(lang, "options")} className={iconBtn}><MoreVertical className="size-4" aria-hidden /></button>
        <button type="button" onClick={() => close()} aria-label={t(lang, "close")} className={iconBtn}><X className="size-[1.1rem]" aria-hidden /></button>
      </header>

      {menu && (
        <div className="bp-msg mx-3 mt-2 rounded-2xl border border-sand-200 bg-white p-3 text-xs leading-relaxed text-forest-900 shadow-sm" role="menu" aria-label={t(lang, "options")}>
          <p className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-forest-500" aria-hidden /><span>{t(lang, "privacy")}{cfg.saving && " Conversations may be stored to improve the service."}</span></p>
          <div className="mt-2.5 rounded-xl bg-sand-100 p-2.5">
            <p className="font-bold">{t(lang, "memoryTitle")}</p>
            {remembered.length ? <ul className="mt-1 space-y-0.5">{remembered.map((r) => <li key={r.label}><span className="text-forest-700">{r.label}:</span> {r.value}</li>)}</ul> : <p className="mt-1 text-forest-700">{t(lang, "memoryEmpty")}</p>}
          </div>
          <label className="mt-2.5 flex items-start gap-2 font-semibold"><input type="checkbox" checked={keep} onChange={toggleKeep} className="mt-0.5 size-4 shrink-0 accent-purple-600" /><span>{keep ? t(lang, "rememberOff") : t(lang, "remember")}<span className="block font-normal text-forest-700">Kept only in this browser for {KEEP_DAYS} days. Never sent as a profile.</span></span></label>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {confirmClear ? (
              <><span className="font-semibold">{t(lang, "clearAsk")}</span><button type="button" onClick={clearAll} className="rounded-full bg-forest-900 px-3 py-1 font-bold text-sand-50 hover:bg-forest-700">{t(lang, "yes")}</button><button type="button" onClick={() => setConfirmClear(false)} className="rounded-full border border-forest-900 px-3 py-1 font-bold">{t(lang, "no")}</button></>
            ) : (
              <>
              <button type="button" role="menuitem" onClick={() => startNew(false)} className="inline-flex items-center gap-1.5 font-bold text-forest-900 underline underline-offset-2"><RotateCcw className="size-3.5" aria-hidden />{t(lang, "newChat")}</button>
              <button type="button" role="menuitem" onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-1.5 font-bold text-purple-700 underline underline-offset-2"><RotateCcw className="size-3.5" aria-hidden />{t(lang, "clear")}</button>
              </>
            )}
            <Link href="/legal/privacy" className="font-semibold text-purple-700 underline underline-offset-2">Privacy policy</Link>
          </div>
        </div>
      )}

      <div ref={scroller} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-2 pt-2 text-[0.9rem] leading-snug" role="log" aria-live="polite" aria-relevant="additions">
        {msgs.length === 0 && !busy && (
          <div className="flex min-h-full flex-col items-center justify-center pb-4 text-center">
            <div ref={hero} key={openN}><Pilo className={landing ? "pl-land" : ""} mood={landing ? "idle" : mood === "idle" ? "wave" : mood} size={132} intensity={cfg.motion} title={`${name}, your little BeigeLeads friend`} /></div>
            <h2 className="display mt-1 text-[1.7rem] leading-none text-forest-900">{t(lang, "welcomeTitle")}</h2>
            <p className="mt-2 max-w-[22rem] text-[0.92rem] text-forest-700">{t(lang, "welcomeSub")}</p>
            <div className="mt-4 grid w-full gap-2 text-start">
              {welcome.map(({ id, Icon, title, ask }) => (
                <button key={id} type="button" onClick={() => send(ask)} className="group flex items-center gap-3 rounded-2xl border border-sand-300 bg-white py-2 ps-2 pe-3.5 transition-[transform,border-color,background-color,box-shadow] duration-150 hover:border-forest-900 hover:bg-forest-900 hover:shadow-md focus-visible:outline-2 focus-visible:outline-purple-600 motion-reduce:transition-none">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-900 text-sand-50 transition-colors group-hover:bg-sand-50 group-hover:text-forest-900"><Icon className="size-[1.1rem]" aria-hidden /></span>
                  <span className="flex-1 text-[0.9rem] font-bold leading-tight text-forest-900 transition-colors group-hover:text-sand-50">{title}</span>
                  <span aria-hidden className="text-forest-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-sand-50 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">&rsaquo;</span>
                </button>
              ))}
              {welcome.length === 0 && chips.map((c) => <button key={c.id} type="button" onClick={() => pickChip(c)} className="col-span-2 rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-[0.8rem] font-semibold text-forest-900">{c.label}</button>)}
            </div>
            {cfg.suggestions.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-2">{chips.map((c) => <button key={c.id} type="button" onClick={() => pickChip(c)} className="rounded-full border border-sand-300 bg-white px-3 py-1 text-[0.75rem] font-semibold text-forest-900">{c.label}</button>)}</div>}
          </div>
        )}

        <div className="space-y-2.5">
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="bp-msg ms-auto w-fit max-w-[84%] whitespace-pre-wrap break-words rounded-2xl rounded-ee-md bg-forest-900 px-3 py-2 text-sand-50">{m.text}</div>
          ) : (
            <div key={i} className="bp-msg group/m flex items-start gap-2">
              <span className="mt-0.5 shrink-0"><Pilo crop="avatar" mood={m.cards?.length && i === lastAssistant ? "found" : m.miss && i === lastAssistant ? "confused" : "idle"} size={34} intensity={cfg.motion} animated={i === lastAssistant} /></span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="relative w-fit max-w-full break-words rounded-2xl rounded-ss-md bg-sand-100 px-3 py-2 text-forest-900"><Revealed text={m.text} run={!!m.fresh && i === lastAssistant} /><CopyBtn text={m.text} lang={lang} /></div>
                {m.offer && <OfferCardView o={m.offer} cid={chatId()} lang={lang} onApplied={() => { window.dispatchEvent(new Event("bl:pilo-cart-add")); doFlash("success", 2400); }} />}
                {m.extras?.map((x, n) => <ChatExtra key={n} x={x} />)}
                {m.dfy?.map((c) => <ChatDfyCard key={c.name} c={c} onAdded={() => { window.dispatchEvent(new Event("bl:pilo-cart-add")); doFlash("success", 2400); }} />)}
                {m.bundle && <ChatBundle b={m.bundle} onAdded={() => { window.dispatchEvent(new Event("bl:pilo-cart-add")); doFlash("success", 2400); }} />}
                {m.cards?.map((c) => <ChatProductCard key={c.slug} c={c} onAdded={() => { window.dispatchEvent(new Event("bl:pilo-cart-add")); trackPilo(chatId(), "add_to_cart"); setMem((x) => ({ ...x, picked: [...new Set([...x.picked, c.slug])].slice(-6) })); doFlash("success", 2400); }} onPick={() => doFlash("point", 1500)} />)}
                {(i === lastAssistant && !m.rated) || m.handoff ? (
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    {i === lastAssistant && !m.rated && <span role="group" aria-label="Rate this answer" className="flex">
                      <button type="button" onClick={() => rate(i, 1)} aria-label="Helpful" className="grid size-7 place-items-center rounded-full text-forest-700/70 hover:bg-sand-100 hover:text-forest-900"><ThumbsUp className="size-3.5" aria-hidden /></button>
                      <button type="button" onClick={() => rate(i, -1)} aria-label="Not helpful" className="grid size-7 place-items-center rounded-full text-forest-700/70 hover:bg-sand-100 hover:text-forest-900"><ThumbsDown className="size-3.5" aria-hidden /></button></span>}
                    {m.handoff && form !== i && <button type="button" onClick={() => setForm(i)} className="inline-flex items-center gap-1 rounded-full border border-forest-900 px-3 py-1 font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><LifeBuoy className="size-3.5" aria-hidden />Talk to a person</button>}
                  </div>
                ) : null}
                {i === lastAssistant && !busy && !!m.quick?.length && (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick replies">
                    {m.quick.map((q) => <button key={q.label} type="button" onClick={() => send(q.text, true)} className="rounded-full border border-purple-600/40 bg-white px-3 py-1 text-[0.78rem] font-semibold text-purple-700 transition-colors hover:bg-purple-100 focus-visible:outline-2 focus-visible:outline-purple-600">{q.label}</button>)}
                  </div>
                )}
                {((m.handoff && form === i) || (form === "direct" && i === lastAssistant)) && <HandoffForm path={path} history={msgs} />}
                {!!m.sources?.length && <p className="text-xs">Sources: {m.sources.map((s, j) => <span key={s.url}>{j > 0 && " · "}<Link href={s.url} className="font-semibold text-purple-700 underline underline-offset-2">{s.title}</Link></span>)}</p>}
              </div>
            </div>
          ))}

          {busy && (
            <div className="bp-msg flex items-center gap-2" role="status">
              <span className="shrink-0"><Pilo crop="avatar" mood={searching ? "search" : "think"} size={40} intensity={cfg.motion} /></span>
              <span className="flex flex-col gap-1 rounded-2xl rounded-ss-md bg-sand-100 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[0.8rem] text-forest-700"><span>{t(lang, "thinking")}</span><span className="flex gap-1" aria-hidden><i className="bp-dot" /><i className="bp-dot" style={{ animationDelay: ".15s" }} /><i className="bp-dot" style={{ animationDelay: ".3s" }} /></span></span>
                {activity && <span className="text-[0.75rem] font-semibold text-forest-900">{activity}</span>}
              </span>
            </div>
          )}

          {err && !busy && (
            <div className="bp-msg rounded-2xl bg-amber-50 p-3 text-forest-900 ring-1 ring-amber-300" role="alert">
              <p className="text-[0.85rem] font-semibold">{err}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-3.5 py-1.5 text-xs font-bold text-sand-50 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"><RotateCcw className="size-3.5" aria-hidden />{t(lang, "retry")}</button>
                <button type="button" onClick={() => setForm("err")} className="inline-flex items-center gap-1.5 rounded-full border border-forest-900 px-3.5 py-1.5 text-xs font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><LifeBuoy className="size-3.5" aria-hidden />Contact Support</button>
              </div>
              {form === "err" && <div className="mt-3"><HandoffForm path={path} history={msgs} /></div>}
            </div>
          )}
        </div>
        <div ref={end} />
        {away && (
          <button type="button" onClick={() => { setAway(false); end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }} className="sticky bottom-1 ms-auto flex items-center gap-1 rounded-full bg-forest-900 px-3 py-1.5 text-xs font-bold text-sand-50 shadow-lg focus-visible:outline-2 focus-visible:outline-purple-600"><ArrowDown className="size-3.5" aria-hidden />{t(lang, "latest")}</button>
        )}
      </div>

      <form className="px-3 pb-3 pt-1" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <div className="flex items-end gap-1.5 rounded-[1.4rem] border border-sand-300 bg-white p-1.5 shadow-[0_8px_22px_-14px_rgba(15,42,29,.5)] transition-colors focus-within:border-purple-600">
          <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={1500} placeholder={rtl || lang !== "en" ? t(lang, "placeholder") : `Ask ${name} anything...`} aria-label="Your message" enterKeyHint="send" dir="auto"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-3 py-2 text-start text-[0.92rem] leading-snug text-forest-900 placeholder:text-forest-700/55 focus:outline-none" />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Stop" className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-900 text-sand-50 transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"><Square className="size-3.5 fill-current" aria-hidden /></button>
          ) : (
            <button type="submit" disabled={!text.trim()} aria-label={t(lang, "send")} className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:bg-sand-200 disabled:text-forest-700/50"><Send className={`size-4 ${rtl ? "-scale-x-100" : ""}`} aria-hidden /></button>
          )}
        </div>
      </form>
    </section>
  );
}

/** The newest answer appears word by word (at most about 0.9 s); older ones and reduced motion show instantly. */
function Revealed({ text, run }: { text: string; run: boolean }) {
  const total = wordCount(text);
  const [n, setN] = useState(() => (run && typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : total));
  useEffect(() => {
    if (n >= total) return;
    const step = stepSize(total);
    const id = setTimeout(() => setN((x) => Math.min(total, x + step)), 60);
    return () => clearTimeout(id);
  }, [n, total]);
  return <Markup text={n >= total ? text : revealCut(text, Math.max(1, n))} />;
}

function CopyBtn({ text, lang }: { text: string; lang: Lang }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" aria-label={t(lang, "copy")} title={t(lang, "copy")} onClick={() => { void navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1400); }).catch(() => {}); }}
      className="absolute -bottom-2.5 end-1 grid size-6 place-items-center rounded-full border border-sand-300 bg-white text-forest-700 opacity-0 shadow-sm transition-opacity hover:text-forest-900 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-purple-600 group-hover/m:opacity-100 [@media(hover:none)]:opacity-100">
      {ok ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      <span className="sr-only">{ok ? t(lang, "copied") : t(lang, "copy")}</span>
    </button>
  );
}

function HandoffForm({ path, history }: { path: string; history: Msg[] }) {
  const [share, setShare] = useState(false);
  // A short summary of the last few messages. It is sent only when the visitor ticks the box below.
  const summary = useMemo(() => history.filter((m) => m.text).slice(-6).map((m) => `${m.role === "user" ? "Visitor" : "BeigePilot"}: ${m.text.replace(/\s+/g, " ").slice(0, 220)}`).join("\n"), [history]);
  return (
    <div className="rounded-xl border border-sand-300 bg-white p-3">
      <p className="mb-2 text-sm font-bold text-forest-900">Leave your details and our team will read your message.</p>
      {summary && (
        <div className="mb-3 rounded-lg bg-sand-100 p-2.5 text-xs">
          <label className="flex items-start gap-2 font-semibold text-forest-900"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-purple-600" />Share a short summary of this chat with the support team</label>
          <details className="mt-1.5 pl-6"><summary className="cursor-pointer font-semibold text-purple-700">See what would be shared</summary><p className="mt-1 whitespace-pre-wrap">{summary}</p><p className="mt-1">Emails and phone numbers are removed.</p></details>
        </div>
      )}
      <ApiForm endpoint="/api/beigepilot/handoff" submitLabel="Send to Human Support" successTitle="Request sent" successText="Thanks. Our support team has your request. Your reference number is {reference}. We sent a confirmation to your email."
        failText="Your request couldn't be submitted. Please try again or contact support using the contact page."
        hidden={{ page: path.slice(0, 80), shareChat: share ? "yes" : "no", summary: share ? summary : "" }}
        fields={[
          { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "message", label: "What do you need?", type: "textarea", required: true },
          { name: "consent", label: "I agree that BeigeLeads may contact me by email about this request.", type: "checkbox", required: true },
        ]} />
      <p className="mt-2 text-xs">Or write to us on the <Link href="/contact" className="font-semibold text-purple-700 underline">contact page</Link>.</p>
    </div>
  );
}
