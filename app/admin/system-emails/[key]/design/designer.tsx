"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, GripVertical, Redo2, Trash2, Undo2 } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/system-emails/brand";
import type { Block, Content, Style } from "@/lib/system-emails/types";
import { previewAction, publishAction, saveDraftAction, sendTestAction, type Preview } from "../../actions";
import { BLOCK_NAME, LIBRARY, STYLE_CONTROLS } from "./blocks";

type Var = { key: string; label: string; example: string };
type Sel = { kind: "block"; i: number } | { kind: "heading" } | { kind: "cta" } | { kind: "signoff" } | null;

const input = "w-full rounded-lg border border-sand-300 bg-white px-2.5 py-1.5 text-sm text-forest-900";
const small = "inline-flex h-8 items-center gap-1 rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100 disabled:opacity-40";
const TEXT_PX = { sm: 14, md: 16, lg: 18, xl: 22 } as const;
const HEAD_PX = { sm: 18, md: 22, lg: 26, xl: 32 } as const;
const PAD = { none: 0, sm: 8, md: 16, lg: 24 } as const;

/** Plain-text inline editor. The DOM is the source while focused, so the caret never jumps. */
function Inline({ value, onCommit, onFocusEl, multiline, style, className, label }: { value: string; onCommit: (v: string) => void; onFocusEl: (el: HTMLElement) => void; multiline?: boolean; style?: React.CSSProperties; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value; }, [value]);
  return (
    <div ref={ref} role="textbox" aria-multiline={!!multiline} aria-label={label} contentEditable="plaintext-only" suppressContentEditableWarning spellCheck
      className={`min-h-[1.2em] whitespace-pre-wrap break-words outline-none focus:ring-2 focus:ring-purple-600/40 ${className ?? ""}`} style={style}
      onFocus={(e) => onFocusEl(e.currentTarget)}
      onKeyDown={(e) => { if (!multiline && e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      onBlur={(e) => { const v = e.currentTarget.innerText.replace(/ /g, " ").replace(multiline ? /\n+$/ : /\n/g, ""); if (v !== value) onCommit(v); }}>
      {value}
    </div>
  );
}

const toneCss = (t: Style["tone"] | undefined): React.CSSProperties => t === "soft" ? { background: BRAND.sand100, border: `1px solid ${BRAND.sand200}`, color: BRAND.forest900 } : t === "highlight" ? { background: BRAND.forest100, color: BRAND.forest900 } : t === "dark" ? { background: BRAND.forest900, color: BRAND.sand50 } : { color: BRAND.forest700 };

export function Designer({ tkey, name, initial, vars, allowed, hasDraft, publishedVersion, canPublish, locked }: { tkey: string; name: string; initial: Content; vars: Var[]; allowed: string[]; hasDraft: boolean; publishedVersion: number; canPublish: boolean; locked: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const allowedSet = useMemo(() => new Set(allowed), [allowed]);
  const [c, setC] = useState<Content>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [past, setPast] = useState<Content[]>([]);
  const [future, setFuture] = useState<Content[]>([]);
  const [sel, setSel] = useState<Sel>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [pv, setPv] = useState<Preview | null>(null);
  const [modal, setModal] = useState(false);
  const [mview, setMview] = useState<"desktop" | "mobile" | "text">("desktop");
  const [dark, setDark] = useState(false);
  const [confirmPub, setConfirmPub] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [q, setQ] = useState("");
  const last = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const dirty = JSON.stringify(c) !== saved;

  const commit = useCallback((next: Content, coalesce?: string) => {
    setC((cur) => {
      const now = Date.now();
      const merge = coalesce && last.current.key === coalesce && now - last.current.at < 900;
      last.current = { key: coalesce ?? "", at: now };
      if (!merge) setPast((p) => [...p.slice(-99), cur]);
      setFuture([]);
      return next;
    });
  }, []);
  const undo = useCallback(() => setPast((p) => { if (!p.length) return p; const prev = p[p.length - 1]; setFuture((f) => [c, ...f]); setC(prev); last.current = { key: "", at: 0 }; return p.slice(0, -1); }), [c]);
  const redo = useCallback(() => setFuture((f) => { if (!f.length) return f; const nx = f[0]; setPast((p) => [...p, c]); setC(nx); last.current = { key: "", at: 0 }; return f.slice(1); }), [c]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[contenteditable], input, textarea")) return; // native undo inside a text field
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    const b = (e: BeforeUnloadEvent) => { if (JSON.stringify(c) !== saved) e.preventDefault(); };
    window.addEventListener("keydown", k); window.addEventListener("beforeunload", b);
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("beforeunload", b); };
  }, [undo, redo, c, saved]);

  useEffect(() => {
    if (!modal) return;
    const t = setTimeout(async () => { const r = await previewAction(tkey, c, dark); if (r.ok) setPv(r.preview); }, 150);
    return () => clearTimeout(t);
  }, [modal, c, dark, tkey]);
  useEffect(() => { const t = setTimeout(async () => { const r = await previewAction(tkey, c, false); if (r.ok) setPv(r.preview); }, 500); return () => clearTimeout(t); }, [c, tkey]);

  // ---- block operations
  const setBlocks = (fn: (b: Block[]) => Block[], co?: string) => commit({ ...c, blocks: fn(structuredClone(c.blocks)) }, co);
  const patch = (i: number, p: Partial<Block> | Record<string, unknown>, co?: string) => setBlocks((b) => { b[i] = { ...b[i], ...p } as Block; return b; }, co);
  const patchStyle = (i: number, p: Partial<Style>, co?: string) => setBlocks((b) => { b[i] = { ...b[i], style: { ...(b[i].style ?? {}), ...p } } as Block; return b; }, co);
  const insertAt = (at: number, blk: Block) => { setBlocks((b) => { b.splice(at, 0, blk); return b; }); setSel({ kind: "block", i: at }); };
  const move = (i: number, to: number) => { if (to < 0 || to >= c.blocks.length || to === i) return; setBlocks((b) => { const [x] = b.splice(i, 1); b.splice(to, 0, x); return b; }); setSel({ kind: "block", i: to }); };
  const remove = (i: number) => { setBlocks((b) => b.filter((_, k) => k !== i)); setSel(null); };
  const dup = (i: number) => insertAt(i + 1, structuredClone(c.blocks[i]));

  const focusEl = useRef<HTMLElement | null>(null);
  const insertVar = (k: string) => {
    const el = focusEl.current;
    if (!el || !document.body.contains(el)) { toast(false, "Click inside a text first, then pick a variable."); return; }
    el.focus(); document.execCommand("insertText", false, `{{${k}}}`);
  };

  const onDragOverBlock = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
  };
  const onDrop = (e: React.DragEvent, at?: number) => {
    e.preventDefault();
    const where = at ?? dropAt ?? c.blocks.length;
    const lib = e.dataTransfer.getData("application/x-lib");
    const idx = e.dataTransfer.getData("application/x-idx");
    setDropAt(null);
    if (lib) { const item = LIBRARY.find((l) => l.id === lib); if (item) insertAt(where, item.make(allowedSet)); }
    else if (idx !== "") { const from = Number(idx); move(from, where > from ? where - 1 : where); }
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => { const r = await fn(); toast(r.ok, r.ok ? ok : (r.error ?? "Failed.")); if (r.ok) { after?.(); router.refresh(); } });
  const blocked = (pv?.errors.length ?? 0) > 0;
  const selBlock = sel?.kind === "block" ? c.blocks[sel.i] : undefined;

  // ---- canvas rendering of one block (editing view; exact output = Preview)
  const renderBlock = (b: Block, i: number) => {
    const st = b.style ?? {};
    const tone = st.tone ?? "none";
    const wrap: React.CSSProperties = { textAlign: st.align ?? "left", padding: PAD[st.pad ?? (tone === "none" ? "none" : "md")], borderRadius: tone === "none" ? 0 : (st.radius ?? 12), ...toneCss(tone) };
    const fs = TEXT_PX[st.size ?? "md"];
    const txt: React.CSSProperties = { fontSize: fs, lineHeight: 1.6, fontWeight: st.bold ? 700 : 400 };
    const ed = (v: string, key: string, multi: boolean, s?: React.CSSProperties) => <Inline value={v} multiline={multi} label={BLOCK_NAME[b.t]} onFocusEl={(el) => { focusEl.current = el; setSel({ kind: "block", i }); }} onCommit={(nv) => patch(i, { [key]: nv })} style={s} />;
    switch (b.t) {
      case "p": return <div style={wrap}>{ed(b.text, "text", true, txt)}</div>;
      case "note": return <div style={{ ...wrap, ...(tone === "none" ? toneCss("highlight") : {}), padding: PAD[st.pad ?? "md"], borderRadius: st.radius ?? 12 }}>{ed(b.text, "text", true, { ...txt, fontSize: st.size ? fs : 14 })}</div>;
      case "heading": return <div style={wrap}>{ed(b.text, "text", false, { fontSize: HEAD_PX[st.size ?? "lg"], lineHeight: 1.2, fontWeight: 800 })}</div>;
      case "footnote": return <div style={{ textAlign: st.align ?? "left", color: BRAND.forest500 }}>{ed(b.text, "text", true, { fontSize: 12 })}</div>;
      case "support": return <div style={{ ...wrap, ...(tone === "none" ? toneCss("soft") : {}), padding: PAD[st.pad ?? "md"], borderRadius: st.radius ?? 12 }}>{ed(b.text, "text", true, txt)}<p className="mt-2 text-sm underline">Contact page{" | support email (from Email branding)"}</p></div>;
      case "columns": return <div style={wrap} className="grid grid-cols-2 gap-3"><div>{ed(b.left, "left", true, txt)}</div><div>{ed(b.right, "right", true, txt)}</div></div>;
      case "list": return <ul style={{ ...wrap, ...txt, paddingLeft: PAD[st.pad ?? (tone === "none" ? "none" : "md")] + 20, listStyle: "disc" }}>{b.items.map((it, k) => <li key={k}>{it || <span className="opacity-50">empty point</span>}</li>)}</ul>;
      case "kv": return <div className="rounded-xl border p-1 text-sm" style={{ background: BRAND.sand100, borderColor: BRAND.sand200, borderRadius: st.radius ?? 12 }}>{b.rows.map((r, k) => <div key={k} className="flex gap-3 px-3 py-2"><span className="w-2/5" style={{ color: BRAND.forest500 }}>{r.label}</span><span className="font-semibold" style={{ color: BRAND.forest900 }}>{r.value || <em className="opacity-50">empty: row hidden</em>}</span></div>)}</div>;
      case "image": return <div style={{ textAlign: st.align ?? "left" }}>{b.src ? <span className="inline-block rounded-lg bg-sand-200 px-3 py-6 text-xs" style={{ width: { sm: 160, md: 320, full: "100%" }[b.width], borderRadius: st.radius ?? 12 }}>Image: {b.src}</span> : <span className="inline-block rounded-lg border-2 border-dashed border-sand-300 px-6 py-6 text-xs">Set the image address in the right panel</span>}</div>;
      case "button": return <div style={{ textAlign: st.align ?? "left" }}><span className="inline-block px-7 py-3.5 text-base font-bold" style={{ borderRadius: st.radius ?? 12, background: b.variant === "primary" ? BRAND.purple600 : b.variant === "dark" ? BRAND.forest900 : "transparent", color: b.variant === "outline" ? BRAND.forest700 : "#fff", border: b.variant === "outline" ? `2px solid ${BRAND.forest700}` : "none" }}>{ed(b.label, "label", false)}</span></div>;
      case "divider": return <hr style={{ borderColor: BRAND.sand200 }} />;
      case "spacer": return <div className="rounded border border-dashed border-sand-300 text-center text-[10px] text-forest-500" style={{ height: { sm: 12, md: 24, lg: 40 }[b.size] }}>space</div>;
      case "social": return <div style={{ ...wrap, fontSize: 14 }}>{b.links.length ? b.links.map((l, k) => <span key={k} className="mr-3 font-semibold underline">{l.label}</span>) : <span className="text-xs opacity-60">No links yet. Add them in the right panel.</span>}</div>;
      case "logo": return <div style={{ textAlign: st.align ?? "left" }}><img src="/brand/png/beigeleads-horizontal-light.png" alt="BeigeLeads" style={{ height: { sm: 28, md: 34, lg: 48 }[b.size], display: "inline-block" }} /></div>;
    }
  };

  const filtered = vars.filter((v) => `${v.key} ${v.label}`.toLowerCase().includes(q.toLowerCase()));
  const seg = <T extends string | number>(label: string, value: T | undefined, opts: { v: T; l: string }[], on: (v: T) => void) => (
    <div className="mb-3"><p className="mb-1 text-xs font-semibold text-forest-700">{label}</p><div className="flex flex-wrap gap-1">{opts.map((o) => <button key={String(o.v)} type="button" aria-pressed={value === o.v} onClick={() => on(o.v)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${value === o.v ? "border-forest-900 bg-forest-900 text-white" : "border-sand-300 bg-white text-forest-900 hover:bg-sand-100"}`}>{o.l}</button>)}</div></div>
  );
  const fld = (label: string, value: string, on: (v: string) => void, multi = false, co?: string) => (
    <label className="mb-3 block text-xs font-semibold text-forest-700">{label}{multi
      ? <textarea rows={3} className={`${input} mt-1`} value={value} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => on(e.target.value)} data-co={co} />
      : <input className={`${input} mt-1`} value={value} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => on(e.target.value)} data-co={co} />}</label>
  );

  const props = () => {
    if (!sel) return <p className="text-sm">Select an element on the canvas to change how it looks. Drag blocks from the left panel, or click one to add it.</p>;
    if (sel.kind === "heading") return <>{fld("Email heading", c.heading, (v) => commit({ ...c, heading: v }, "heading"))}<p className="text-xs">The heading is part of the branded layout and cannot be removed.</p></>;
    if (sel.kind === "signoff") return fld("Sign-off", c.signoff, (v) => commit({ ...c, signoff: v }, "signoff"), true);
    if (sel.kind === "cta") return <>{c.cta ? <>{fld("Button text", c.cta.label, (v) => commit({ ...c, cta: { ...c.cta!, label: v } }, "ctal"))}{fld("Button link (https or /path)", c.cta.url, (v) => commit({ ...c, cta: { ...c.cta!, url: v } }, "ctau"))}<button type="button" className={small} onClick={() => { commit({ ...c, cta: undefined }); setSel(null); }}>Remove main button</button></> : <button type="button" className={small} onClick={() => commit({ ...c, cta: { label: "Open", url: "/" } })}>Add main button</button>}</>;
    const b = selBlock!; const i = sel.i; const st = b.style ?? {};
    const ctl = STYLE_CONTROLS[b.t];
    return (
      <>
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-forest-900">{BLOCK_NAME[b.t]}</p>
          <div className="flex gap-1"><button type="button" className={small} aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp className="size-3.5" /></button><button type="button" className={small} aria-label="Move down" disabled={i === c.blocks.length - 1} onClick={() => move(i, i + 1)}><ArrowDown className="size-3.5" /></button><button type="button" className={small} aria-label="Duplicate block" onClick={() => dup(i)}><Copy className="size-3.5" /></button><button type="button" className={small} aria-label="Delete block" onClick={() => remove(i)}><Trash2 className="size-3.5" /></button></div></div>
        {b.t === "image" && <>{fld("Image address (https:// or /media/…)", b.src, (v) => patch(i, { src: v }, `src${i}`))}{fld("Description (alt text)", b.alt, (v) => patch(i, { alt: v }, `alt${i}`))}{fld("Link when clicked (optional)", b.link ?? "", (v) => patch(i, { link: v || undefined }, `lnk${i}`))}{seg("Width", b.width, [{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "full", l: "Full" }], (v) => patch(i, { width: v }))}<p className="mb-3 text-xs">Upload pictures in Admin &gt; Media and paste the /media/… address here.</p></>}
        {b.t === "button" && <>{fld("Button text", b.label, (v) => patch(i, { label: v }, `bl${i}`))}{fld("Link (https or /path)", b.url, (v) => patch(i, { url: v }, `bu${i}`))}{seg("Style", b.variant, [{ v: "primary", l: "Primary" }, { v: "dark", l: "Dark" }, { v: "outline", l: "Outline" }], (v) => patch(i, { variant: v }))}</>}
        {b.t === "spacer" && seg("Height", b.size, [{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }], (v) => patch(i, { size: v }))}
        {b.t === "logo" && seg("Size", b.size, [{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }], (v) => patch(i, { size: v }))}
        {b.t === "list" && fld("One point per line", b.items.join("\n"), (v) => patch(i, { items: v.split("\n") }, `li${i}`), true)}
        {b.t === "kv" && <div className="mb-3 space-y-2"><p className="text-xs font-semibold text-forest-700">Rows (an empty value hides the row)</p>{b.rows.map((r, k) => <div key={k} className="flex gap-1"><input aria-label="Label" className={`${input} w-2/5`} value={r.label} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => setBlocks((x) => { (x[i] as { rows: { label: string }[] }).rows[k].label = e.target.value; return x; }, `kl${i}${k}`)} /><input aria-label="Value" className={input} value={r.value} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => setBlocks((x) => { (x[i] as { rows: { value: string }[] }).rows[k].value = e.target.value; return x; }, `kv${i}${k}`)} /><button type="button" className={small} aria-label="Remove row" onClick={() => setBlocks((x) => { (x[i] as { rows: unknown[] }).rows.splice(k, 1); return x; })}><Trash2 className="size-3.5" /></button></div>)}<button type="button" className={small} onClick={() => setBlocks((x) => { (x[i] as { rows: { label: string; value: string }[] }).rows.push({ label: "Label:", value: "" }); return x; })}>Add row</button></div>}
        {b.t === "social" && <div className="mb-3 space-y-2"><p className="text-xs font-semibold text-forest-700">Links (only real accounts; https only)</p>{b.links.map((l, k) => <div key={k} className="flex gap-1"><input aria-label="Name" className={`${input} w-2/5`} value={l.label} onChange={(e) => setBlocks((x) => { (x[i] as { links: { label: string }[] }).links[k].label = e.target.value; return x; }, `sl${i}${k}`)} /><input aria-label="Address" className={input} value={l.url} onChange={(e) => setBlocks((x) => { (x[i] as { links: { url: string }[] }).links[k].url = e.target.value; return x; }, `su${i}${k}`)} /><button type="button" className={small} aria-label="Remove link" onClick={() => setBlocks((x) => { (x[i] as { links: unknown[] }).links.splice(k, 1); return x; })}><Trash2 className="size-3.5" /></button></div>)}<button type="button" className={small} onClick={() => setBlocks((x) => { (x[i] as { links: { label: string; url: string }[] }).links.push({ label: "", url: "https://" }); return x; })}>Add link</button></div>}
        {ctl.includes("align") && seg("Alignment", st.align ?? "left", [{ v: "left", l: "Left" }, { v: "center", l: "Center" }, { v: "right", l: "Right" }], (v) => patchStyle(i, { align: v }))}
        {ctl.includes("size") && seg("Text size", st.size ?? (b.t === "heading" ? "lg" : "md"), [{ v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }, { v: "xl", l: "XL" }], (v) => patchStyle(i, { size: v }))}
        {ctl.includes("bold") && seg("Weight", st.bold ? "bold" : "normal", [{ v: "normal", l: "Normal" }, { v: "bold", l: "Bold" }], (v) => patchStyle(i, { bold: v === "bold" }))}
        {ctl.includes("tone") && seg("Background (brand colours)", st.tone ?? "none", [{ v: "none", l: "None" }, { v: "soft", l: "Sand" }, { v: "highlight", l: "Green" }, { v: "dark", l: "Forest" }], (v) => patchStyle(i, { tone: v }))}
        {ctl.includes("radius") && seg("Corner radius", st.radius ?? 12, [{ v: 0, l: "0" }, { v: 8, l: "8" }, { v: 12, l: "12" }, { v: 20, l: "20" }], (v) => patchStyle(i, { radius: v }))}
        {ctl.includes("pad") && seg("Spacing inside", st.pad ?? "md", [{ v: "none", l: "None" }, { v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }], (v) => patchStyle(i, { pad: v }))}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-sand-200 bg-white p-3">
        <Link href={`/admin/system-emails/${tkey}`} className={small}>Back to editor</Link>
        <button type="button" className={small} onClick={undo} disabled={!past.length} aria-label="Undo"><Undo2 className="size-3.5" /> Undo</button>
        <button type="button" className={small} onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 className="size-3.5" /> Redo</button>
        <input aria-label="Subject" placeholder="Subject" className={`${input} min-w-[14rem] flex-1`} value={c.subject} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => commit({ ...c, subject: e.target.value }, "subject")} />
        <input aria-label="Preheader" placeholder="Preheader" className={`${input} min-w-[12rem] flex-1`} value={c.preheader} onFocus={(e) => { focusEl.current = e.currentTarget; }} onChange={(e) => commit({ ...c, preheader: e.target.value }, "pre")} />
        {!locked && <Button size="sm" variant="secondary" disabled={pending || !dirty} onClick={() => run(() => saveDraftAction(tkey, c), "Draft saved. Nothing changed for customers.", () => setSaved(JSON.stringify(c)))}>Save draft</Button>}
        <Button size="sm" variant="secondary" disabled={!pv?.html} onClick={() => setModal(true)}>Preview</Button>
        <input type="email" aria-label="Send test to" placeholder="Send test to (blank = me)" className="min-w-[10rem] rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-sm" value={testTo} onChange={(e) => setTestTo(e.target.value)} /><Button size="sm" variant="secondary" disabled={pending || blocked} onClick={() => run(() => sendTestAction(tkey, c, testTo), "Test email sent.")}>Send test</Button>
        {canPublish && !locked && (confirmPub ? <><Button size="sm" disabled={pending || blocked} onClick={() => { setConfirmPub(false); run(() => publishAction(tkey, c), "Published. New emails use this version.", () => setSaved(JSON.stringify(c))); }}>Yes, publish</Button><Button size="sm" variant="secondary" onClick={() => setConfirmPub(false)}>Cancel</Button></> : <Button size="sm" disabled={pending || blocked} onClick={() => setConfirmPub(true)}>Publish</Button>)}
        <span className="text-xs">{dirty ? "Unsaved changes" : hasDraft ? "Draft saved" : publishedVersion ? `Live: v${publishedVersion}` : "Live: built-in"}</span>
        {pv && pv.errors.length > 0 && <ul className="w-full rounded-lg bg-red-100 px-3 py-2 text-xs text-red-800">{pv.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {pv && pv.warnings.length > 0 && <ul className="w-full rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">{pv.warnings.map((e) => <li key={e}>{e}</li>)}</ul>}
      </div>

      <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="space-y-3 lg:max-h-[calc(100vh-9rem)] lg:overflow-auto" aria-label="Content blocks">
          <section className="rounded-2xl border border-sand-200 bg-white p-3">
            <h2 className="mb-2 text-sm font-bold text-forest-900">Content blocks</h2>
            <p className="mb-2 text-xs">Drag onto the email, or click to add.</p>
            <ul className="space-y-1.5">{LIBRARY.map((l) => (
              <li key={l.id}><button type="button" draggable onDragStart={(e) => { e.dataTransfer.setData("application/x-lib", l.id); e.dataTransfer.effectAllowed = "copy"; }} onClick={() => insertAt(sel?.kind === "block" ? sel.i + 1 : c.blocks.length, l.make(allowedSet))}
                className="flex w-full cursor-grab items-center justify-between rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-left text-sm hover:bg-sand-100"><span className="font-semibold text-forest-900">{l.label}</span><span className="ml-2 truncate text-[11px]">{l.hint}</span></button></li>
            ))}</ul>
          </section>
          <section className="rounded-2xl border border-sand-200 bg-white p-3">
            <h2 className="mb-1 text-sm font-bold text-forest-900">Variables</h2>
            <p className="mb-2 text-xs">Click inside a text, then pick one.</p>
            <input className={input} placeholder="Search" aria-label="Search variables" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="mt-2 max-h-56 space-y-1 overflow-auto">{filtered.map((v) => <li key={v.key}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVar(v.key)} className="w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-sand-100"><code className="font-semibold text-forest-900">{`{{${v.key}}}`}</code><span className="block">{v.label}, e.g. {v.example}</span></button></li>)}</ul>
          </section>
        </aside>

        <main className="rounded-2xl border border-sand-200 bg-sand-100 p-4" aria-label="Email canvas">
          <p className="mb-3 text-center text-xs">Editing view of &quot;{name}&quot;. Variables show as {"{{names}}"}. Use Preview for the exact email with example values.</p>
          <div className="mx-auto max-w-[600px] rounded-[20px] border border-sand-200 bg-white p-8" onDragOver={(e) => { e.preventDefault(); if (!c.blocks.length) setDropAt(0); }} onDrop={(e) => onDrop(e, c.blocks.length ? undefined : 0)} onDragLeave={() => setDropAt(null)}>
            <div onClick={() => setSel({ kind: "heading" })} className={`mb-5 rounded-lg ${sel?.kind === "heading" ? "ring-2 ring-purple-600" : ""}`}>
              <Inline value={c.heading} label="Email heading" onFocusEl={(el) => { focusEl.current = el; setSel({ kind: "heading" }); }} onCommit={(v) => commit({ ...c, heading: v }, "heading")} style={{ fontSize: 30, lineHeight: 1.15, fontWeight: 800, color: BRAND.forest900 }} />
            </div>
            {c.blocks.map((b, i) => (
              <div key={i} onDragOver={(e) => onDragOverBlock(e, i)} onDrop={(e) => onDrop(e)} className="relative">
                {dropAt === i && <div className="-mt-1 mb-1 h-1 rounded bg-purple-600" />}
                <div onClick={() => setSel({ kind: "block", i })} className={`group relative mb-3 rounded-lg ${sel?.kind === "block" && sel.i === i ? "ring-2 ring-purple-600" : "hover:ring-1 hover:ring-sand-300"}`}>
                  <button type="button" draggable aria-label={`Drag ${BLOCK_NAME[b.t]}`} onDragStart={(e) => { e.dataTransfer.setData("application/x-idx", String(i)); e.dataTransfer.effectAllowed = "move"; }} className="absolute -left-7 top-1 hidden cursor-grab rounded p-1 text-forest-500 hover:bg-sand-100 group-hover:block"><GripVertical className="size-4" /></button>
                  {renderBlock(b, i)}
                </div>
                {dropAt === i + 1 && i === c.blocks.length - 1 && <div className="mb-1 h-1 rounded bg-purple-600" />}
              </div>
            ))}
            {!c.blocks.length && <p className="rounded-xl border-2 border-dashed border-sand-300 p-8 text-center text-sm">Drop a block here.</p>}
            <div onClick={() => setSel({ kind: "cta" })} className={`mb-4 rounded-lg ${sel?.kind === "cta" ? "ring-2 ring-purple-600" : ""}`}>
              {c.cta ? <span className="inline-block rounded-xl px-7 py-3.5 text-base font-bold text-white" style={{ background: BRAND.purple600 }}>{c.cta.label || "Button"}</span> : <span className="text-xs underline">+ Add main button</span>}
            </div>
            <div onClick={() => setSel({ kind: "signoff" })} className={`rounded-lg ${sel?.kind === "signoff" ? "ring-2 ring-purple-600" : ""}`} style={{ color: BRAND.forest700, whiteSpace: "pre-wrap" }}>{c.signoff || <span className="text-xs opacity-60">Sign-off (click to edit)</span>}</div>
            <p className="mt-6 border-t border-sand-200 pt-3 text-[11px]">The branded footer (website, Help Center, Contact, company address) is added automatically.</p>
          </div>
        </main>

        <aside className="rounded-2xl border border-sand-200 bg-white p-3 lg:max-h-[calc(100vh-9rem)] lg:overflow-auto" aria-label="Design properties">
          <h2 className="mb-3 text-sm font-bold text-forest-900">Design properties</h2>
          {props()}
        </aside>
      </div>

      {modal && (
        <div role="dialog" aria-modal="true" aria-label="Email preview" className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/60 p-4" onClick={() => setModal(false)}>
          <div className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(["desktop", "mobile", "text"] as const).map((v) => <button key={v} type="button" onClick={() => setMview(v)} aria-pressed={mview === v} className={`${small} ${mview === v ? "bg-forest-900 text-white hover:bg-forest-900" : ""}`}>{v === "text" ? "Plain text" : v[0].toUpperCase() + v.slice(1)}</button>)}
              <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark appearance</label>
              <button type="button" className={`${small} ml-auto`} onClick={() => setModal(false)}>Close</button>
            </div>
            <p className="mb-2 text-xs">Subject: <strong>{pv?.subject}</strong>. Example values are used, not real customer data.</p>
            {mview === "text" ? <pre className="overflow-auto whitespace-pre-wrap rounded-xl bg-sand-100 p-4 text-xs">{pv?.text}</pre> : <div className="overflow-auto rounded-xl bg-sand-100"><iframe title="Email preview" sandbox="" srcDoc={pv?.html} className="mx-auto block h-[70vh] border-0 bg-white" style={{ width: mview === "mobile" ? 375 : "100%", maxWidth: "100%" }} /></div>}
          </div>
        </div>
      )}
    </div>
  );
}
