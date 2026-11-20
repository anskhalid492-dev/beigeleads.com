"use client";
// The BeigePilot chat panel (loaded only after the visitor first opens the assistant). State lives here so minimizing keeps the chat.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Minus, RotateCcw, Send, ThumbsDown, ThumbsUp, X, Target, Globe2, Scale, ShieldCheck, LifeBuoy } from "lucide-react";
import { useCart } from "@/lib/cart/client";
import type { Card, Source } from "@/lib/beigepilot/tools";
import { followUps, suggestionsFor, WELCOME_CARDS } from "@/lib/beigepilot/suggest";
import { ApiForm } from "@/components/forms/api-form";
import { Markup } from "./markup";
import { ChatProductCard } from "./product-card";
import { Pilo, type Intensity, type Mood } from "./pilo";

export type Cfg = { enabled: boolean; greeting: string; saving?: boolean; name: string; humor: "professional" | "friendly" | "playful"; motion: Intensity; launcher: "right" | "left"; suggestions: string[] };
type Msg = { role: "user" | "assistant"; text: string; rated?: 1 | -1; cards?: Card[]; sources?: Source[]; handoff?: boolean; miss?: boolean };
type Done = { t?: string; ok?: boolean; text?: string; cards?: Card[]; sources?: Source[]; handoff?: string | null; miss?: boolean; error?: string };

const KEY = "bp-chat-v2";
const CID = "bp-cid-v1";
const SEARCH_TOOLS = new Set(["searchProducts", "getProductDetails", "getProductPackages", "getRelatedProducts", "getProductVerificationInfo", "showProductCards"]);
const ICONS = { prospects: Target, explore: Globe2, packages: Scale, quality: ShieldCheck } as const;
function chatId(): string { try { let c = sessionStorage.getItem(CID); if (!c) { c = crypto.randomUUID().replace(/-/g, "").slice(0, 24); sessionStorage.setItem(CID, c); } return c; } catch { return `nostorage${Math.random().toString(36).slice(2, 12)}`; } }

export function BeigePilotPanel({ cfg, path, open, onClosed }: { cfg: Cfg; path: string; open: boolean; onClosed: (clear: boolean) => void }) {
  const cart = useCart();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [form, setForm] = useState<number | "err" | null>(null);
  const [info, setInfo] = useState(false);
  const [closing, setClosing] = useState(false);
  const [flash, setFlash] = useState<Mood | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panel = useRef<HTMLElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const name = cfg.name || "Pilo";

  const doFlash = useCallback((m: Mood, ms: number) => { setFlash(m); clearTimeout(flashTimer.current); flashTimer.current = setTimeout(() => setFlash(null), ms); }, []);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  useEffect(() => {
    const t = setTimeout(() => { try { const s = sessionStorage.getItem(KEY); if (s) setMsgs(JSON.parse(s) as Msg[]); } catch { /* storage blocked */ } }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* ignore */ } }, [msgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy, err, open, form]);

  // Opening: wave hello, move focus into the panel (keyboard only gets the field on devices with a real pointer).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { doFlash("wave", 2300); if (window.matchMedia("(pointer: fine)").matches) input.current?.focus(); else panel.current?.focus(); }, 0);
    return () => clearTimeout(t);
  }, [open, doFlash]);

  // Mobile: follow the visual viewport so the composer stays above the on-screen keyboard.
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

  const run = useCallback(async (list: Msg[]) => {
    setBusy(true); setTool(""); setErr(null);
    let final: Done | null = null; let reason = "";
    try {
      const res = await fetch("/api/beigepilot/chat", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/x-ndjson, application/json" },
        body: JSON.stringify({ cid: chatId(), messages: list.slice(-12).map((m) => ({ role: m.role, text: m.text.slice(0, 1500) })), path, cart: cart.slice(0, 10) }),
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
    } catch { reason = "I could not reach the server. Check your connection and try again."; }
    setBusy(false); setTool("");
    if (final?.text) {
      const hasCards = !!final.cards?.length;
      setMsgs([...list, { role: "assistant", text: final.text, cards: final.cards, sources: final.sources, handoff: !!final.handoff, miss: !!final.miss && !hasCards }]);
      setOnline(true);
      if (hasCards) doFlash("found", 2200); else if (final.miss) doFlash("confused", 2600);
    } else {
      setOnline(false);
      setErr(reason || (cfg.humor === "professional" ? "Something went wrong. Please try again." : "My circuits hit a tiny speed bump. Let's try again."));
    }
  }, [path, cart, cfg.humor, doFlash]);

  const send = useCallback((raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next); setText(""); doFlash("nod", 600); setForm(null);
    void run(next);
  }, [busy, msgs, run, doFlash]);

  const retry = () => { if (!busy && msgs.length && msgs[msgs.length - 1].role === "user") void run(msgs); };
  const rate = (i: number, rating: 1 | -1) => {
    setMsgs((m) => m.map((x, j) => (j === i ? { ...x, rated: rating } : x)));
    void fetch("/api/beigepilot/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cid: chatId(), idx: i, rating }) }).catch(() => {});
  };
  const close = (clear: boolean) => { if (closing) return; setClosing(true); setFlash("bye"); setTimeout(() => { setClosing(false); setFlash(null); if (clear) { setMsgs([]); setErr(null); setForm(null); } onClosed(clear); }, 650); };

  const searching = busy && SEARCH_TOOLS.has(tool);
  const mood: Mood = closing ? "bye" : flash ?? (busy ? (searching ? "search" : "think") : err ? "error" : text.trim() ? "curious" : "idle");
  const chips = useMemo(() => suggestionsFor(path, cfg.suggestions), [path, cfg.suggestions]);
  const last = msgs[msgs.length - 1];
  const asked = msgs.filter((m) => m.role === "user").map((m) => m.text);
  const status = busy ? (searching ? "Searching the catalog" : "Thinking") : online ? "Online" : "Having trouble";
  const caption = searching ? (cfg.humor === "playful" ? "Let me dig through the data jungle..." : "Searching the catalog...") : "Thinking...";

  return (
    <section ref={panel} tabIndex={-1} role="dialog" aria-label={`${name}, BeigeLeads assistant`} style={open || closing ? undefined : { display: "none" }}
      onKeyDown={(e) => { if (e.key === "Escape") { if (info) setInfo(false); else close(false); } }}
      className={`${closing ? "bp-close" : "bp-open"} fixed inset-0 z-50 flex flex-col overflow-hidden bg-sand-50 outline-none sm:inset-auto sm:bottom-5 sm:h-[min(660px,calc(100vh-2.5rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-sand-300 sm:shadow-[0_24px_60px_-24px_rgba(15,42,29,.5)] ${cfg.launcher === "left" ? "sm:left-5" : "sm:right-5"}`}>
      <header className="flex items-center gap-2.5 border-b border-sand-200 bg-sand-100/80 px-3.5 py-2.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand-50 ring-1 ring-sand-200"><Pilo mood={mood} size={40} intensity={cfg.motion} /></span>
        <div className="min-w-0 flex-1">
          <p className="display text-[1.15rem] leading-none text-forest-900">{name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs" aria-live="polite"><span aria-hidden className={`size-1.5 rounded-full ${online ? "bg-forest-500" : "bg-amber-500"}`} />{status}</p>
        </div>
        <button type="button" onClick={() => setInfo((v) => !v)} aria-expanded={info} aria-label="About this assistant and your privacy" className="grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-200 focus-visible:outline-2 focus-visible:outline-purple-600"><Info className="size-4" aria-hidden /></button>
        <button type="button" onClick={() => close(false)} aria-label="Minimize chat" className="grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-200 focus-visible:outline-2 focus-visible:outline-purple-600"><Minus className="size-4" aria-hidden /></button>
        <button type="button" onClick={() => close(true)} aria-label="Close and clear chat" className="grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-200 focus-visible:outline-2 focus-visible:outline-purple-600"><X className="size-4" aria-hidden /></button>
      </header>

      {info && (
        <div className="bp-msg border-b border-sand-200 bg-white px-4 py-3 text-xs leading-relaxed text-forest-900" role="note">
          <p><b>{name}</b> is an AI assistant. It answers from BeigeLeads&apos; real catalog, help articles and policies, and can be wrong, so check details on the product page.</p>
          <p className="mt-1.5">Please do not share personal or payment information in this chat. It is sent to an AI provider to produce answers.{cfg.saving && " Conversations may be stored to improve the service."} <Link href="/legal/privacy" className="font-semibold text-purple-700 underline">Privacy policy</Link></p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 text-[0.875rem] leading-snug" role="log" aria-live="polite" aria-relevant="additions">
        {msgs.length === 0 && !busy && (
          <div className="px-1 pb-1 pt-2 text-center">
            <div className="mx-auto w-fit"><Pilo mood={mood === "idle" ? "wave" : mood} size={104} intensity={cfg.motion} title={`${name}, the BeigePilot mascot`} /></div>
            <h2 className="display mt-1 text-[1.65rem] leading-tight text-forest-900">Hey there! I&apos;m {name}. 👋</h2>
            <p className="mt-0.5 text-[0.95rem] font-semibold text-forest-700">Your little expert in finding big opportunities.</p>
            <p className="mx-auto mt-2 max-w-[19rem] text-[0.82rem]">{cfg.greeting}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              {WELCOME_CARDS.map((c) => { const I = ICONS[c.id as keyof typeof ICONS]; return (
                <button key={c.id} type="button" onClick={() => send(c.ask)} className="group flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-2.5 py-2.5 text-[0.8rem] font-semibold leading-tight text-forest-900 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-purple-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-forest-100 text-forest-700 group-hover:bg-purple-100 group-hover:text-purple-700"><I className="size-4" aria-hidden /></span>{c.label}
                </button>); })}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {chips.map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-sand-300 px-3 py-1.5 text-xs font-semibold text-forest-900 hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">{q}</button>)}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="bp-msg ml-auto w-fit max-w-[84%] rounded-2xl rounded-br-md bg-forest-900 px-3 py-2 text-sand-50">{m.text}</div>
          ) : (
            <div key={i} className="bp-msg flex items-start gap-2">
              <span className="mt-0.5 shrink-0"><Pilo mood={m.cards?.length && i === msgs.length - 1 ? "found" : m.miss && i === msgs.length - 1 ? "confused" : "idle"} size={28} intensity={cfg.motion} animated={i === msgs.length - 1} /></span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="w-fit max-w-full rounded-2xl rounded-tl-md bg-sand-100 px-3 py-2 text-forest-900"><Markup text={m.text} /></div>
                {m.cards?.map((c) => <ChatProductCard key={c.slug} c={c} onAdded={() => doFlash("success", 2400)} onPick={() => doFlash("point", 1500)} />)}
                <div className="flex flex-wrap items-center gap-1 text-xs" role="group" aria-label="Rate this answer">
                  {m.rated ? <span>Thanks for the feedback.</span> : <>
                    <button type="button" onClick={() => rate(i, 1)} aria-label="Helpful" className="grid size-7 place-items-center rounded-full hover:bg-sand-200"><ThumbsUp className="size-3.5" aria-hidden /></button>
                    <button type="button" onClick={() => rate(i, -1)} aria-label="Not helpful" className="grid size-7 place-items-center rounded-full hover:bg-sand-200"><ThumbsDown className="size-3.5" aria-hidden /></button></>}
                  {m.handoff && form !== i && <button type="button" onClick={() => setForm(i)} className="ml-1 inline-flex items-center gap-1 rounded-full border border-forest-900 px-3 py-1 font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><LifeBuoy className="size-3.5" aria-hidden />Contact Our Team</button>}
                </div>
                {m.handoff && form === i && <HandoffForm path={path} />}
                {!!m.sources?.length && <p className="text-xs">Sources: {m.sources.map((s, j) => <span key={s.url}>{j > 0 && " · "}<Link href={s.url} className="font-semibold text-purple-700 underline underline-offset-2">{s.title}</Link></span>)}</p>}
              </div>
            </div>
          ))}

          {busy && (
            <div className="bp-msg flex items-center gap-2" role="status">
              <span className="shrink-0"><Pilo mood={searching ? "search" : "think"} size={34} intensity={cfg.motion} /></span>
              <span className="rounded-2xl rounded-tl-md bg-sand-100 px-3 py-2 text-xs font-semibold text-forest-700">{caption}</span>
            </div>
          )}

          {err && !busy && (
            <div className="bp-msg rounded-2xl border border-amber-300 bg-amber-50 p-3 text-forest-900" role="alert">
              <p className="text-[0.85rem] font-semibold">{err}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 px-3.5 py-1.5 text-xs font-bold text-sand-50 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"><RotateCcw className="size-3.5" aria-hidden />Retry</button>
                <button type="button" onClick={() => setForm("err")} className="inline-flex items-center gap-1.5 rounded-full border border-forest-900 px-3.5 py-1.5 text-xs font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50"><LifeBuoy className="size-3.5" aria-hidden />Contact Support</button>
              </div>
              {form === "err" && <div className="mt-3"><HandoffForm path={path} /></div>}
            </div>
          )}

          {!busy && !err && last?.role === "assistant" && (
            <div className="flex flex-wrap gap-1.5 pl-9">
              {followUps(!!last.cards?.length, asked).map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-sand-300 bg-white px-2.5 py-1 text-xs font-semibold text-forest-900 hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">{q}</button>)}
            </div>
          )}
        </div>
        <div ref={end} />
      </div>

      <form className="px-3 pb-3 pt-1" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <div className="flex items-end gap-1.5 rounded-2xl border border-sand-300 bg-white p-1.5 shadow-[0_6px_18px_-12px_rgba(15,42,29,.45)] focus-within:border-purple-600">
          <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={1500} placeholder={`Ask ${name} anything about our databases...`} aria-label="Your message" enterKeyHint="send"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[0.9rem] leading-snug text-forest-900 placeholder:text-forest-700/55 focus:outline-none" />
          <button type="submit" disabled={busy || !text.trim()} aria-label={busy ? "Sending" : "Send message"} className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:bg-sand-200 disabled:text-forest-700/50">
            {busy ? <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : <Send className="size-4" aria-hidden />}
          </button>
        </div>
        {cfg.saving && <p className="mt-1.5 px-1 text-[0.68rem]">Conversations may be stored to improve the service.</p>}
      </form>
    </section>
  );
}

function HandoffForm({ path }: { path: string }) {
  return (
    <div className="rounded-xl border border-sand-300 bg-white p-3">
      <p className="mb-2 text-sm font-bold text-forest-900">Leave your details and our team will read your message.</p>
      <ApiForm endpoint="/api/beigepilot/handoff" submitLabel="Send to our team" successTitle="Message sent" successText="Thanks. Our team has your message. We sent a confirmation to your email."
        hidden={{ page: path.slice(0, 80) }}
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
