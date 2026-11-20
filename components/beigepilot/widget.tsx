"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Minus, Send, X } from "lucide-react";
import { useCart } from "@/lib/cart/client";
import type { Card, Source } from "@/lib/beigepilot/tools";
import { Markup } from "./markup";
import { ChatProductCard } from "./product-card";

type Msg = { role: "user" | "assistant"; text: string; cards?: Card[]; sources?: Source[]; handoff?: boolean; error?: boolean };
const KEY = "bp-chat-v1";
const SUGGESTED = ["Find a database for my business", "Compare available packages", "How fresh is your data?", "How does delivery work?", "What guarantees do you offer?"];

/** Page-aware opening question (public page path only). */
function hint(path: string): string {
  if (/^\/lists\/[^/]+\/?$/.test(path) && !path.startsWith("/lists/email") ) return "Need help choosing a package?";
  if (path.startsWith("/lists")) return "Looking for a specific industry or city?";
  if (path.startsWith("/cart")) return "Questions about your selected databases?";
  return "Not sure which database fits? Ask me.";
}

export function BeigePilot() {
  const path = usePathname();
  const cart = useCart();
  const [cfg, setCfg] = useState<{ enabled: boolean; greeting: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetch("/api/beigepilot/config").then((r) => r.json() as Promise<{ enabled: boolean; greeting: string }>).then((c) => { if (live) setCfg(c); }).catch(() => {});
      try { const s = sessionStorage.getItem(KEY); if (s) setMsgs(JSON.parse(s) as Msg[]); } catch { /* storage blocked */ }
    }, 1800);
    return () => { live = false; clearTimeout(t); };
  }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* ignore */ } }, [msgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy, open]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  const send = useCallback(async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const res = await fetch("/api/beigepilot/chat", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => !m.error).slice(-12).map((m) => ({ role: m.role, text: m.text.slice(0, 1500) })), path, cart: cart.slice(0, 10) }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; cards?: Card[]; sources?: Source[]; handoff?: string | null; error?: string };
      if (res.ok && j.ok && j.text) setMsgs([...next, { role: "assistant", text: j.text, cards: j.cards, sources: j.sources, handoff: !!j.handoff }]);
      else setMsgs([...next, { role: "assistant", error: true, handoff: true, text: res.status === 429 ? (j.error ?? "Please wait a moment before sending more messages.") : "BeigePilot is not available right now. Our team can help you directly." }]);
    } catch { setMsgs([...next, { role: "assistant", error: true, handoff: true, text: "I could not reach the server. Please try again, or contact our team." }]); }
    setBusy(false);
  }, [busy, msgs, path, cart]);

  if (!cfg?.enabled || path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const onCart = path.startsWith("/cart");

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Open BeigePilot, the AI assistant"
          className={`fixed right-4 z-40 flex items-center gap-2.5 rounded-full border border-sand-300 bg-sand-50 py-1.5 pl-1.5 pr-1.5 shadow-[0_6px_20px_-8px_rgba(15,42,29,.35)] transition-colors hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:pr-4 ${onCart ? "bottom-24 lg:bottom-5" : "bottom-5"}`}>
          <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-sand-50"><Compass className="size-5" aria-hidden /></span>
          <span className="hidden text-sm font-bold text-forest-900 sm:block">Ask BeigePilot</span>
        </button>
      )}
      {open && (
        <section role="dialog" aria-label="BeigePilot AI assistant" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          className="bp-open fixed inset-0 z-50 flex flex-col bg-sand-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100vh-2.5rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-sand-300 sm:shadow-[0_20px_50px_-20px_rgba(15,42,29,.45)]">
          <header className="flex items-center gap-3 border-b border-sand-200 bg-sand-100 px-4 py-3 sm:rounded-t-2xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-900 text-sand-50"><Compass className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1"><p className="display text-lg leading-none text-forest-900">BeigePilot</p><p className="truncate text-xs">Your AI Data &amp; Audience Specialist</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Minimize chat" className="grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-200"><Minus className="size-4" aria-hidden /></button>
            <button type="button" onClick={() => { setMsgs([]); setOpen(false); }} aria-label="Close and clear chat" className="grid size-9 place-items-center rounded-full text-forest-900 hover:bg-sand-200"><X className="size-4" aria-hidden /></button>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[0.93rem] leading-relaxed" aria-live="polite">
            <div className="bp-msg max-w-[88%] rounded-2xl rounded-tl-sm bg-sand-100 px-3.5 py-2.5 text-forest-900">{cfg.greeting}</div>
            {msgs.length === 0 && (
              <div className="space-y-2 pt-1">
                <button type="button" onClick={() => send(hint(path))} className="block w-full rounded-xl border border-purple-600/30 bg-purple-100 px-3.5 py-2 text-left text-sm font-semibold text-forest-900 hover:border-purple-600">{hint(path)}</button>
                <div className="flex flex-wrap gap-2">{SUGGESTED.map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-sand-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-900 hover:border-forest-900">{q}</button>)}</div>
              </div>
            )}
            {msgs.map((m, i) => m.role === "user" ? (
              <div key={i} className="bp-msg ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-forest-900 px-3.5 py-2.5 text-sand-50">{m.text}</div>
            ) : (
              <div key={i} className="bp-msg space-y-2.5">
                <div className={`max-w-[92%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-forest-900 ${m.error ? "bg-amber-100" : "bg-sand-100"}`}><Markup text={m.text} /></div>
                {m.cards?.map((c) => <ChatProductCard key={c.slug} c={c} />)}
                {m.handoff && <Link href="/contact" className="inline-flex rounded-full border border-forest-900 px-4 py-2 text-xs font-bold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Contact Our Team</Link>}
                {!!m.sources?.length && <p className="text-xs">Sources: {m.sources.map((s, j) => <span key={s.url}>{j > 0 && " · "}<Link href={s.url} className="font-semibold text-purple-700 underline underline-offset-2">{s.title}</Link></span>)}</p>}
              </div>
            ))}
            {busy && <div className="flex w-fit gap-1 rounded-2xl rounded-tl-sm bg-sand-100 px-4 py-3" role="status" aria-label="BeigePilot is typing"><i className="bp-dot" /><i className="bp-dot" style={{ animationDelay: ".15s" }} /><i className="bp-dot" style={{ animationDelay: ".3s" }} /></div>}
            <div ref={end} />
          </div>
          <form className="border-t border-sand-200 px-3 pb-3 pt-2.5 sm:rounded-b-2xl" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
            <div className="flex items-end gap-2">
              <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={1500} placeholder="Ask about a list, price or policy" aria-label="Your message"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(text); } }}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-[0.93rem] text-forest-900 placeholder:text-forest-700/60 focus-visible:outline-2 focus-visible:outline-purple-600" />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40"><Send className="size-4" aria-hidden /></button>
            </div>
            <p className="mt-2 text-[0.7rem] leading-snug">AI assistant: check details on the product page. Please do not share personal or payment information.</p>
          </form>
        </section>
      )}
    </>
  );
}
