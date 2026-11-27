"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import type { Block, Content } from "@/lib/system-emails/types";
import { discardDraftAction, previewAction, publishAction, restoreVersionAction, saveDraftAction, sendTestAction, type Preview } from "../actions";

type Var = { key: string; label: string; description: string; example: string };
type Version = { version: number; note: string; actor: string; at: number };
type Props = { tkey: string; initial: Content; publishedVersion: number; hasDraft: boolean; vars: Var[]; versions: Version[]; senderName: string; locked: boolean; admin: boolean };

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
const small = "inline-flex h-8 items-center gap-1 rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100 disabled:opacity-40";

type Path = string; // "subject" | "b.2.text" | "b.2.rows.1.label" | "cta.url" ...
const getAt = (c: Content, path: Path): string => {
  const p = path.split(".");
  let cur: unknown = p[0] === "b" ? c.blocks : p[0] === "cta" ? c.cta : c;
  for (const k of p.slice(p[0] === "b" || p[0] === "cta" ? 1 : 0)) cur = (cur as Record<string, unknown>)?.[k];
  return typeof cur === "string" ? cur : "";
};
const setAt = (c: Content, path: Path, v: string): Content => {
  const n = structuredClone(c);
  const p = path.split(".");
  let cur: Record<string, unknown> = (p[0] === "b" ? n.blocks : p[0] === "cta" ? (n.cta ??= { label: "", url: "" }) : n) as unknown as Record<string, unknown>;
  const rest = p[0] === "b" || p[0] === "cta" ? p.slice(1) : p;
  for (const k of rest.slice(0, -1)) cur = cur[k] as Record<string, unknown>;
  cur[rest[rest.length - 1]] = v;
  return n;
};

export function Editor({ tkey, initial, publishedVersion, hasDraft, vars, versions, senderName, locked, admin }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [c, setC] = useState<Content>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [pending, start] = useTransition();
  const [pv, setPv] = useState<Preview | null>(null);
  const [view, setView] = useState<"desktop" | "mobile" | "text" | "inbox">("desktop");
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");
  const [confirmPub, setConfirmPub] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [active, setActive] = useState<{ path: Path; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);
  const dirty = JSON.stringify(c) !== saved;

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (JSON.stringify(c) !== saved) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [c, saved]);

  useEffect(() => {
    const t = setTimeout(async () => { const r = await previewAction(tkey, c, dark); if (r.ok) setPv(r.preview); }, 350);
    return () => clearTimeout(t);
  }, [c, dark, tkey]);

  const f = (path: Path) => ({
    value: getAt(c, path),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC((x) => setAt(x, path, e.target.value)),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => setActive({ path, el: e.target }),
    disabled: locked,
  });
  const insert = (key: string) => {
    const a = active;
    if (!a) { toast(false, "Click inside a field first, then pick a variable."); return; }
    const isList = a.path.startsWith("__list.");
    const cur = isList ? a.el.value : getAt(c, a.path);
    const s = a.el.selectionStart ?? cur.length, e = a.el.selectionEnd ?? cur.length;
    const next = `${cur.slice(0, s)}{{${key}}}${cur.slice(e)}`;
    if (isList) { const i = Number(a.path.split(".")[1]); setBlocks((x) => { (x[i] as { items: string[] }).items = next.split("\n"); return x; }); }
    else setC((x) => setAt(x, a.path, next));
    requestAnimationFrame(() => { a.el.focus(); const pos = s + key.length + 4; a.el.setSelectionRange(pos, pos); });
  };
  const setBlocks = (fn: (b: Block[]) => Block[]) => setC((x) => ({ ...x, blocks: fn(structuredClone(x.blocks)) }));
  const move = (i: number, d: -1 | 1) => setBlocks((b) => { const j = i + d; if (j < 0 || j >= b.length) return b; [b[i], b[j]] = [b[j], b[i]]; return b; });

  const run = useCallback((fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    const r = await fn();
    toast(r.ok, r.ok ? ok : (r.error ?? "Failed."));
    if (r.ok) { after?.(); router.refresh(); }
  }), [router, toast]);

  const filtered = vars.filter((v) => `${v.key} ${v.label} ${v.description}`.toLowerCase().includes(q.toLowerCase()));
  const blocked = (pv?.errors.length ?? 0) > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        {locked && <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Editing needs migration 0022 in D1. You can preview and test the built-in version below.</p>}
        <section className="rounded-2xl border border-sand-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-forest-900">Subject and preview text</h2>
            <span className="text-xs">{c.subject.length} characters</span>
          </div>
          <label className="block text-sm font-semibold text-forest-900">Subject<input className={`${input} mt-1`} {...f("subject")} /></label>
          <label className="mt-3 block text-sm font-semibold text-forest-900">Preheader (the grey text next to the subject)<input className={`${input} mt-1`} {...f("preheader")} /></label>
          {pv && pv.ideas.length > 0 && !locked && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-forest-900">Subject line suggestions</p>
              <p className="text-xs">Built from this email&apos;s own event and variables. They are wording options, not a promise of better results.</p>
              <ul className="mt-2 space-y-2">
                {pv.ideas.map((i) => (
                  <li key={i.style} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-100 px-3 py-2 text-sm">
                    <span><span className="block text-xs font-semibold text-forest-500">{i.style}</span><code className="text-forest-900">{i.subject}</code></span>
                    <button type="button" className={small} onClick={() => setC((x) => ({ ...x, subject: i.subject }))}>Use this</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-forest-900">Content</h2>
          <label className="block text-sm font-semibold text-forest-900">Heading<input className={`${input} mt-1`} {...f("heading")} /></label>
          <div className="mt-4 space-y-3">
            {c.blocks.map((b, i) => (
              <div key={i} className="rounded-xl border border-sand-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone="mute">{b.t === "p" ? "Paragraph" : b.t === "list" ? "Bullet list" : b.t === "kv" ? "Details table" : "Highlighted note"}</Badge>
                  {!locked && <div className="flex gap-1">
                    <button type="button" className={small} aria-label="Move block up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-3.5" /></button>
                    <button type="button" className={small} aria-label="Move block down" disabled={i === c.blocks.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-3.5" /></button>
                    <button type="button" className={small} aria-label="Remove block" onClick={() => setBlocks((x) => x.filter((_, k) => k !== i))}><Trash2 className="size-3.5" /></button>
                  </div>}
                </div>
                {(b.t === "p" || b.t === "note") && <textarea rows={3} className={input} aria-label="Text" {...f(`b.${i}.text`)} />}
                {b.t === "list" && <textarea rows={Math.max(3, b.items.length)} className={input} aria-label="One bullet per line" value={b.items.join("\n")} disabled={locked}
                  onFocus={(e) => setActive({ path: `__list.${i}`, el: e.target })}
                  onChange={(e) => setBlocks((x) => { (x[i] as { items: string[] }).items = e.target.value.split("\n"); return x; })} />}
                {b.t === "kv" && <div className="space-y-2">
                  {b.rows.map((r, k) => (
                    <div key={k} className="flex gap-2">
                      <input className={`${input} w-2/5`} aria-label="Label" {...f(`b.${i}.rows.${k}.label`)} />
                      <input className={input} aria-label="Value" {...f(`b.${i}.rows.${k}.value`)} />
                      {!locked && <button type="button" className={small} aria-label="Remove row" onClick={() => setBlocks((x) => { (x[i] as { rows: unknown[] }).rows.splice(k, 1); return x; })}><Trash2 className="size-3.5" /></button>}
                    </div>
                  ))}
                  {!locked && <button type="button" className={small} onClick={() => setBlocks((x) => { (x[i] as { rows: { label: string; value: string }[] }).rows.push({ label: "Label:", value: "" }); return x; })}><Plus className="size-3.5" /> Add row</button>}
                  <p className="text-xs">A row whose value is empty is left out of the email automatically.</p>
                </div>}
              </div>
            ))}
          </div>
          {!locked && <div className="mt-3 flex flex-wrap gap-2">
            {([["p", "Paragraph"], ["list", "Bullet list"], ["kv", "Details table"], ["note", "Highlighted note"]] as const).map(([t, label]) => (
              <button key={t} type="button" className={small} onClick={() => setBlocks((x) => [...x, t === "p" || t === "note" ? { t, text: "" } : t === "list" ? { t, items: [""] } : { t, rows: [{ label: "Label:", value: "" }] }])}><Plus className="size-3.5" /> {label}</button>
            ))}
          </div>}
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-forest-900">Button and sign-off</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-forest-900">Button text<input className={`${input} mt-1`} {...f("cta.label")} /></label>
            <label className="text-sm font-semibold text-forest-900">Button link (https or a site path)<input className={`${input} mt-1`} {...f("cta.url")} /></label>
          </div>
          {!locked && c.cta && <button type="button" className={`${small} mt-2`} onClick={() => setC((x) => ({ ...x, cta: undefined }))}>Remove button</button>}
          {!locked && !c.cta && <button type="button" className={`${small} mt-2`} onClick={() => setC((x) => ({ ...x, cta: { label: "Open", url: "/" } }))}>Add button</button>}
          <label className="mt-4 block text-sm font-semibold text-forest-900">Sign-off<textarea rows={3} className={`${input} mt-1`} {...f("signoff")} /></label>
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Variables</h2>
          <p className="mb-2 text-xs">Click inside a field, then pick a variable to insert it. Only variables this email&apos;s event can supply are listed.</p>
          <input className={input} placeholder="Search variables" aria-label="Search variables" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
            {filtered.map((v) => (
              <li key={v.key}><button type="button" disabled={locked} onClick={() => insert(v.key)} className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-sand-100 disabled:opacity-50">
                <span><code className="font-semibold text-forest-900">{`{{${v.key}}}`}</code><span className="block text-xs">{v.description}</span></span>
                <span className="shrink-0 text-xs">e.g. {v.example}</span>
              </button></li>
            ))}
            {!filtered.length && <li className="px-3 py-2 text-sm">No variable matches.</li>}
          </ul>
          {pv && pv.used.length > 0 && <div className="mt-4 border-t border-sand-200 pt-3">
            <p className="text-sm font-semibold text-forest-900">Used in this email</p>
            <ul className="mt-1 space-y-1 text-xs">{pv.used.map((u) => <li key={u.key}><code>{`{{${u.key}}}`}</code> {u.required ? <Badge tone="warn">required: the email is not sent without it</Badge> : <span>optional, {u.fallback}</span>}</li>)}</ul>
          </div>}
        </section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            {!locked && <Button size="sm" variant="secondary" disabled={pending || !dirty} onClick={() => run(() => saveDraftAction(tkey, c), "Draft saved. Nothing changed for customers.", () => setSaved(JSON.stringify(c)))}>Save draft</Button>}
            {admin && !locked && (confirmPub
              ? <><Button size="sm" disabled={pending || blocked} onClick={() => { setConfirmPub(false); run(() => publishAction(tkey, c), "Published. New emails use this version.", () => setSaved(JSON.stringify(c))); }}>Yes, publish now</Button><Button size="sm" variant="secondary" onClick={() => setConfirmPub(false)}>Cancel</Button></>
              : <Button size="sm" disabled={pending || blocked} onClick={() => setConfirmPub(true)}>Publish</Button>)}
            <input type="email" aria-label="Send test to" placeholder="Send test to (blank = me)" className="min-w-[12rem] rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-sm" value={testTo} onChange={(e) => setTestTo(e.target.value)} /><Button size="sm" variant="secondary" disabled={pending || blocked} onClick={() => run(() => sendTestAction(tkey, c, testTo), "Test email sent.")}>Send test</Button>
            {hasDraft && !locked && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => discardDraftAction(tkey), "Draft discarded.", () => { setC(initial); })}>Discard draft</Button>}
            <span className="ml-auto text-xs">{dirty ? "Unsaved changes" : hasDraft ? "Draft saved" : publishedVersion ? `Live: version ${publishedVersion}` : "Live: built-in version"}</span>
          </div>
          {pv && pv.errors.length > 0 && <ul className="mt-3 space-y-1 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-800">{pv.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          {pv && pv.warnings.length > 0 && <ul className="mt-3 space-y-1 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900">{pv.warnings.map((e) => <li key={e}>{e}</li>)}</ul>}
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(["desktop", "mobile", "text", "inbox"] as const).map((v) => <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`${small} ${view === v ? "bg-forest-900 text-white hover:bg-forest-900" : ""}`}>{v === "text" ? "Plain text" : v[0].toUpperCase() + v.slice(1)}</button>)}
            <label className="ml-auto flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark appearance</label>
          </div>
          <p className="mb-3 text-xs">Preview uses example values (clearly not real customers). Real sends use the customer&apos;s real details.</p>
          {!pv && <p className="py-10 text-center text-sm">Rendering…</p>}
          {pv && !pv.html && <p className="py-10 text-center text-sm">Fix the problems above to see the preview.</p>}
          {pv?.html && view === "inbox" && (
            <div className="rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm">
              <p className="font-bold text-forest-900">{senderName}</p>
              <p className="mt-1 font-semibold text-forest-900">{pv.subject}</p>
              <p className="truncate text-forest-500">{pv.preheader}</p>
              <p className="mt-2 text-xs">Inboxes cut long subjects (often after about 60 to 70 characters). This one is {pv.subject.length}.</p>
            </div>
          )}
          {pv?.html && view === "text" && <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap rounded-xl bg-sand-100 p-4 text-xs text-forest-900">{pv.text}</pre>}
          {pv?.html && (view === "desktop" || view === "mobile") && (
            <div className="overflow-auto rounded-xl border border-sand-200 bg-sand-100">
              <iframe title="Email preview" sandbox="" srcDoc={pv.html} className="mx-auto block h-[36rem] border-0 bg-white" style={{ width: view === "mobile" ? 375 : "100%", maxWidth: "100%" }} />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-sand-200 bg-white p-4">
          <h2 className="text-base font-bold text-forest-900">Versions</h2>
          <p className="mb-2 text-xs">Restoring loads a version into the draft. Nothing goes live until you publish it.</p>
          <ul className="space-y-1 text-sm">
            {versions.map((v) => (
              <li key={v.version} className="flex items-center justify-between gap-2 rounded-xl bg-sand-100 px-3 py-2">
                <span>Version {v.version}{v.version === publishedVersion && " (live)"} <span className="text-xs">{new Date(v.at).toISOString().slice(0, 16).replace("T", " ")} UTC, {v.actor}{v.note ? `, ${v.note}` : ""}</span></span>
                {!locked && <button type="button" className={small} disabled={pending} onClick={() => run(() => restoreVersionAction(tkey, v.version), `Version ${v.version} loaded into the draft.`, () => router.refresh())}>Restore to draft</button>}
              </li>
            ))}
            <li className="flex items-center justify-between gap-2 rounded-xl bg-sand-100 px-3 py-2"><span>Built-in version {publishedVersion === 0 && "(live)"}</span>
              {!locked && <button type="button" className={small} disabled={pending} onClick={() => run(() => restoreVersionAction(tkey, 0), "Built-in version loaded into the draft.")}>Restore to draft</button>}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
