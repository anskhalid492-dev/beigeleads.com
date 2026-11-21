"use client";
import { useActionState } from "react";
import { dfyAction, dfySettingsAction } from "@/app/admin/dfy/actions";
import { Button } from "@/components/ui/button";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const Msg = ({ r }: { r: Res }) => (r ? <p role={r.ok ? "status" : "alert"} className={`mt-2 text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p> : null);

/** Generic admin form: posts `op` + hidden fields to the single order action. Success is shown only after the server confirms. */
export function DfyForm({ id, op, label, confirm, hidden, children, className = "" }: { id: string; op: string; label: string; confirm?: string; hidden?: Record<string, string>; children?: React.ReactNode; className?: string }) {
  const [r, run, pending] = useActionState(dfyAction, null as Res);
  return (
    <form action={run} className={className} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} />
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <Button type="submit" size="sm" className="mt-2" disabled={pending}>{pending ? "Saving…" : label}</Button>
      <Msg r={r} />
    </form>
  );
}
export function SettingsForm({ children }: { children: React.ReactNode }) {
  const [r, run, pending] = useActionState(dfySettingsAction, null as Res);
  return <form action={run}>{children}<Button type="submit" className="mt-4" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button><Msg r={r} /></form>;
}
export const inp = "mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
