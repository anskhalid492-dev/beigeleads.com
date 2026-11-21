"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { quoteStatusAction } from "../actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
export function QuoteRow({ id, status, note }: { id: number; status: string; note: string }) {
  const [r, run, pending] = useActionState(quoteStatusAction, null as Res);
  return (
    <form action={run} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="text-xs font-semibold">Status<select name="status" defaultValue={status} className="mt-1 block rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm"><option value="new">New</option><option value="replied">Replied</option><option value="closed">Closed</option></select></label>
      <label className="min-w-[14rem] flex-1 text-xs font-semibold">Internal note<input name="note" defaultValue={note} maxLength={1000} className="mt-1 block w-full rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm" /></label>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending ? "…" : "Save"}</Button>
      {r && <span role={r.ok ? "status" : "alert"} className="text-xs font-medium">{r.ok ? r.message : r.error}</span>}
    </form>
  );
}
