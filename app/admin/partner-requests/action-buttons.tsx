"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { approveAction, declineAction, discountAction, noteAction, resendAction, underReviewAction } from "./actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
type Act = (prev: unknown, form: FormData) => Promise<NonNullable<Res>>;

function Msg({ r }: { r: Res }) {
  if (!r) return null;
  return <p role={r.ok ? "status" : "alert"} className={`mt-2 rounded-xl px-3 py-2 text-sm font-medium ${r.ok ? "bg-forest-100 text-forest-900" : "bg-red-100 text-red-900"}`}>{r.ok ? r.message : r.error}</p>;
}

function One({ action, id, label, variant = "secondary", confirm, extra }: { action: Act; id: number; label: string; variant?: "primary" | "secondary" | "ghost"; confirm?: string; extra?: Record<string, string> }) {
  const [r, run, pending] = useActionState(action, null as Res);
  return (
    <form action={run} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>{pending ? "Working…" : label}</Button>
      <Msg r={r} />
    </form>
  );
}

export function PartnerActions({ id, status, hasCode, codeActive, decisionEmail }: { id: number; status: string; hasCode: boolean; codeActive: boolean; decisionEmail: string | null }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {status === "pending" && <One action={underReviewAction} id={id} label="Mark under review" />}
      {status !== "approved" && <One action={approveAction} id={id} label="Approve" variant="primary" confirm="Approve this partner? A personal 50% code is created and the approval email is sent." />}
      {status !== "declined" && <One action={declineAction} id={id} label="Decline" confirm="Decline this application? The decline email is sent and any partner code is deactivated." />}
      {(status === "approved" || status === "declined") && decisionEmail !== "sent" && <One action={resendAction} id={id} label="Resend decision email" />}
      {hasCode && (codeActive
        ? <One action={discountAction} id={id} label="Deactivate discount" confirm="Deactivate this partner's code? It stops working at checkout immediately." extra={{ active: "0" }} />
        : status === "approved" && <One action={discountAction} id={id} label="Reactivate discount" extra={{ active: "1" }} />)}
    </div>
  );
}

export function NoteForm({ id, note }: { id: number; note: string }) {
  const [r, run, pending] = useActionState(noteAction, null as Res);
  return (
    <form action={run} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="min-w-[14rem] flex-1 text-sm font-semibold text-forest-900">Internal note (never shown to the applicant)
        <textarea name="note" defaultValue={note} rows={2} maxLength={2000} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-base font-normal" />
      </label>
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save note"}</Button>
      <div className="w-full"><Msg r={r} /></div>
    </form>
  );
}
