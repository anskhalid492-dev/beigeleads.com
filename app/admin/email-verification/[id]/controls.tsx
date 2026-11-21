"use client";
import { useRef, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { noteAction, removeResultAction, resendAction, statusAction } from "../actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const Msg = ({ r }: { r: Res }) => (r ? <p role={r.ok ? "status" : "alert"} className={`mt-2 text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p> : null);

export function StatusControl({ id, options }: { id: string; options: { value: string; label: string }[] }) {
  const [r, run, pending] = useActionState(statusAction, null as Res);
  const [to, setTo] = useState(options[0]?.value ?? "");
  if (options.length === 0) return <p className="text-sm">No manual status change is available from this status.</p>;
  return (
    <form action={run} onSubmit={(e) => { if (to === "completed" && !window.confirm("Mark this job Completed? The customer is emailed a results link. Only do this after uploading the result file.")) e.preventDefault(); if ((to === "cancelled" || to === "refunded") && !window.confirm("This closes the order for good. Continue?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="to" className="text-sm font-semibold text-forest-900">Change status</label>
      <select id="to" name="to" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
      {to === "needs_action" && <><label htmlFor="reason" className="mt-3 block text-sm font-semibold text-forest-900">Reason shown to the customer (required)</label><textarea id="reason" name="reason" rows={3} maxLength={400} required className="mt-1 w-full rounded-xl border border-sand-300 bg-white p-2 text-sm" /></>}
      <Button type="submit" size="sm" className="mt-3" disabled={pending}>{pending ? "Saving…" : "Apply"}</Button>
      <Msg r={r} />
    </form>
  );
}

export function NoteControl({ id, note }: { id: string; note: string }) {
  const [r, run, pending] = useActionState(noteAction, null as Res);
  return (
    <form action={run}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="note" className="text-sm font-semibold text-forest-900">Internal note (never shown to the customer)</label>
      <textarea id="note" name="note" defaultValue={note} rows={4} maxLength={2000} className="mt-1 w-full rounded-xl border border-sand-300 bg-white p-2 text-sm" />
      <Button type="submit" size="sm" variant="secondary" className="mt-2" disabled={pending}>{pending ? "Saving…" : "Save note"}</Button>
      <Msg r={r} />
    </form>
  );
}

export function ResendButton({ id, kind, label }: { id: string; kind: string; label: string }) {
  const [r, run, pending] = useActionState(resendAction, null as Res);
  return <form action={run} onSubmit={(e) => { if (!window.confirm(`Send "${label}" to the customer again?`)) e.preventDefault(); }}><input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} /><Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending ? "…" : label}</Button><Msg r={r} /></form>;
}

export function RemoveResult({ id, fileId }: { id: string; fileId: string }) {
  const [r, run, pending] = useActionState(removeResultAction, null as Res);
  return <form action={run} onSubmit={(e) => { if (!window.confirm("Remove this result file?")) e.preventDefault(); }} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="fileId" value={fileId} /><button type="submit" disabled={pending} className="text-sm font-semibold text-red-800 underline">Remove</button><Msg r={r} /></form>;
}

/** Streams the finished result file to private storage. It does not complete the job. */
export function ResultUpload({ id, disabled }: { id: string; disabled: boolean }) {
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  function go(f: File | undefined) {
    if (!f) return;
    setPct(0); setMsg(null);
    const x = new XMLHttpRequest();
    x.open("PUT", "/api/admin/ev/result");
    x.setRequestHeader("x-ev-id", id); x.setRequestHeader("x-ev-name", encodeURIComponent(f.name));
    x.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => { setPct(null); let j: { ok?: boolean; error?: string } = {}; try { j = JSON.parse(x.responseText); } catch { /* */ } if (j.ok) { setMsg({ ok: true, text: "Result uploaded. Reloading…" }); setTimeout(() => location.reload(), 600); } else setMsg({ ok: false, text: j.error ?? "Upload failed." }); };
    x.onerror = () => { setPct(null); setMsg({ ok: false, text: "The upload was interrupted. Try again." }); };
    x.send(f);
    if (ref.current) ref.current.value = "";
  }
  return (
    <div>
      <label htmlFor="res" className="text-sm font-semibold text-forest-900">Upload result file (CSV, XLSX, TXT or ZIP, up to 100 MB)</label>
      <input id="res" ref={ref} type="file" accept=".csv,.xlsx,.txt,.zip" disabled={disabled || pct !== null} onChange={(e) => go(e.target.files?.[0])} className="mt-2 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-forest-900 file:px-4 file:py-2 file:font-semibold file:text-sand-50" />
      {pct !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-200"><div className="h-full bg-purple-600" style={{ width: `${pct}%` }} /></div>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm font-medium ${msg.ok ? "text-forest-700" : "text-red-800"}`}>{msg.text}</p>}
    </div>
  );
}
