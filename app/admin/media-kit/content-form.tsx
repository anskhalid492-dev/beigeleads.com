"use client";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { FIELDS, type FieldKey, type KitContent } from "@/lib/media-kit/fields";
import { discardDraftAction, publishAction, saveDraftAction } from "./actions";

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

export function ContentForm({ draft, hasDraft }: { draft: KitContent; hasDraft: boolean }) {
  const [v, setV] = useState<KitContent>(draft);
  const [pending, start] = useTransition();
  const toast = useToast();
  const set = (k: FieldKey) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => start(async () => { const r = await fn(); toast(r.ok, r.ok ? done : r.error); });
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5 p-5">
      {hasDraft && <p className="rounded-xl bg-purple-100 p-3 text-sm text-forest-900">You have unpublished changes. Visitors still see the published text.</p>}
      {(Object.keys(FIELDS) as FieldKey[]).map((k) => (
        <div key={k}>
          <label htmlFor={`f-${k}`} className="mb-1 block text-sm font-semibold text-forest-900">{FIELDS[k].label}</label>
          {FIELDS[k].rows === 1
            ? <input id={`f-${k}`} value={v[k]} maxLength={FIELDS[k].max} onChange={set(k)} className={input} />
            : <textarea id={`f-${k}`} rows={FIELDS[k].rows} value={v[k]} maxLength={FIELDS[k].max} onChange={set(k)} className={input} />}
          <p className="mt-1 text-xs">{v[k].length}/{FIELDS[k].max}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => saveDraftAction(v), "Draft saved")}>Save draft</Button>
        <Button type="button" disabled={pending} onClick={() => { if (confirm("Publish this text on the public Media Kit page?")) run(() => publishAction(v), "Published. It can take up to a minute to appear."); }}>{pending ? "Working…" : "Publish"}</Button>
        {hasDraft && <Button type="button" variant="ghost" disabled={pending} onClick={() => { if (confirm("Discard the draft and go back to the published text?")) run(async () => { const r = await discardDraftAction(); if (r.ok) location.reload(); return r; }, "Draft discarded"); }}>Discard draft</Button>}
      </div>
    </form>
  );
}
