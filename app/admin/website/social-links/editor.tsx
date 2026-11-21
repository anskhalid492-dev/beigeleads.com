"use client";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Glyph } from "@/components/site-links/icons";
import { SOCIAL_PLATFORMS, socialName, type SocialLink, type SocialKey } from "@/lib/site-links/types";
import { saveSocialAction } from "../actions";

const inp = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";

export function SocialEditor({ initial }: { initial: SocialLink[] }) {
  const [rows, setRows] = useState<SocialLink[]>(initial);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (i: number, p: Partial<SocialLink>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const add = () => setRows((r) => [...r, { id: `new${Date.now().toString(36)}`, platform: "linkedin", label: "", url: "", enabled: true, order: r.length, createdAt: 0, updatedAt: 0 }]);
  const save = () => start(async () => { setNote(null); const r = await saveSocialAction(rows); setNote(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); });

  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="rounded-xl bg-sand-100 p-4 text-sm text-forest-700">No social links yet. The footer shows none until you add a link with its real address.</p>}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.id} className="grid gap-3 rounded-xl border border-sand-200 bg-white p-3 md:grid-cols-[3rem_11rem_1fr_9rem_auto] md:items-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-900 text-white" title="Footer icon preview"><Glyph name={r.platform} /></span>
            <label className="text-xs font-semibold">Platform
              <select value={r.platform} onChange={(e) => set(i, { platform: e.target.value as SocialKey })} className={`${inp} mt-1`}>{SOCIAL_PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select>
            </label>
            <label className="text-xs font-semibold">Address (https://)
              <input value={r.url} onChange={(e) => set(i, { url: e.target.value })} inputMode="url" placeholder="https://" className={`${inp} mt-1`} aria-label={`${socialName(r)} address`} />
            </label>
            <label className="text-xs font-semibold">{r.platform === "custom" ? "Label (required)" : "Label (optional)"}
              <input value={r.label} maxLength={40} onChange={(e) => set(i, { label: e.target.value })} className={`${inp} mt-1`} />
            </label>
            <div className="flex items-center gap-1">
              <label className="mr-1 flex items-center gap-1 text-xs font-semibold"><input type="checkbox" checked={r.enabled} onChange={(e) => set(i, { enabled: e.target.checked })} />On</label>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded-lg p-2 hover:bg-sand-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down" className="rounded-lg p-2 hover:bg-sand-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => { if (confirm(`Remove ${socialName(r)}?`)) setRows((x) => x.filter((_, j) => j !== i)); }} aria-label="Remove" className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={add} disabled={rows.length >= 20} className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-sand-100"><Plus className="h-4 w-4" />Add link</button>
        <button type="button" onClick={save} disabled={pending} className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{pending ? "Saving..." : "Save changes"}</button>
        {note && <p role={note.ok ? "status" : "alert"} className={`text-sm ${note.ok ? "text-forest-700" : "text-red-700"}`}>{note.text}</p>}
      </div>
      <p className="text-xs text-forest-700">Order here is the order in the footer. Links open in a new tab with rel=&quot;noopener noreferrer&quot;. Only https addresses are accepted.</p>
    </div>
  );
}
