"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { saveSettingsAction } from "@/app/admin/settings/actions";

export type FieldDef = { key: string; label: string; description: string; type: "text" | "longtext" | "boolean" | "url"; max: number; usedBy: string };
const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

/** Generic form for one settings category: validation by the server, unsaved-changes guard, conflict message. */
export function SettingsForm({ category, fields, initial, stamp }: { category: string; fields: FieldDef[]; initial: Record<string, string>; stamp: number }) {
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState(initial);
  const [err, setErr] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const dirty = useMemo(() => fields.some((f) => v[f.key] !== saved[f.key]), [v, saved, fields]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const save = () => start(async () => {
    setErr(null);
    const r = await saveSettingsAction(category, v, stamp);
    if (r.ok) { setSaved(v); toast(true, r.changed ? "Settings saved" : "No changes to save"); router.refresh(); }
    else { setErr({ text: r.error, conflict: r.conflict }); toast(false, r.error); }
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5 p-5">
      {fields.map((f) => (
        <div key={f.key}>
          {f.type === "boolean" ? (
            <label className="flex cursor-pointer items-start gap-3">
              <button type="button" role="switch" aria-checked={v[f.key] === "true"} aria-label={f.label} onClick={() => setV((p) => ({ ...p, [f.key]: p[f.key] === "true" ? "false" : "true" }))}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${v[f.key] === "true" ? "bg-forest-500" : "bg-sand-300"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${v[f.key] === "true" ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <span><span className="block text-sm font-semibold text-forest-900">{f.label}</span><span className="block text-xs">{f.description}</span></span>
            </label>
          ) : (
            <>
              <label htmlFor={`s-${f.key}`} className="mb-1 block text-sm font-semibold text-forest-900">{f.label}</label>
              {f.type === "longtext" ? <textarea id={`s-${f.key}`} rows={3} maxLength={f.max} value={v[f.key]} onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))} className={input} />
                : <input id={`s-${f.key}`} maxLength={f.max} value={v[f.key]} onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))} className={input} />}
              <p className="mt-1 text-xs">{f.description} {v[f.key].length}/{f.max}</p>
            </>
          )}
          <p className="mt-1 text-xs"><span className="font-semibold">Used by:</span> {f.usedBy}</p>
        </div>
      ))}
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{err.text}{err.conflict && <> <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>Reload</button></>}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !dirty}>{pending ? "Saving…" : "Save changes"}</Button>
        <Button type="button" variant="secondary" disabled={pending || !dirty} onClick={() => { setV(saved); setErr(null); }}>Cancel changes</Button>
        {dirty && <span role="status" className="text-xs font-semibold text-amber-900">Unsaved changes</span>}
      </div>
    </form>
  );
}
