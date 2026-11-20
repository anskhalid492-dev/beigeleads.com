"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveEntryAction } from "../actions";
import type { Entry } from "@/lib/beigepilot/knowledge";

const inp = "mt-1 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
export function EntryEditor({ entry, preset }: { entry: Entry | null; preset?: { title: string; from: number } }) {
  const [r, act, pending] = useActionState(saveEntryAction, null);
  const [kind, setKind] = useState(entry?.kind ?? "faq");
  const [title, setTitle] = useState(entry?.title ?? preset?.title ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [kw, setKw] = useState(entry?.keywords ?? "");
  const [status, setStatus] = useState(entry?.status ?? "draft");
  const faq = kind === "faq";
  return (
    <form action={act} className="grid gap-4 rounded-2xl border border-sand-200 bg-white p-5">
      <input type="hidden" name="id" value={entry?.id ?? ""} /><input type="hidden" name="fromUnanswered" value={preset?.from ?? ""} />
      <label className="text-sm font-semibold text-forest-900">Type
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as "faq" | "restricted")} className={inp}>
          <option value="faq">Answer BeigePilot may use</option><option value="restricted">Claim BeigePilot must never make</option></select></label>
      <label className="text-sm font-semibold text-forest-900">{faq ? "Question" : "The claim to block"}<input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={inp} /></label>
      <label className="text-sm font-semibold text-forest-900">{faq ? "Answer (max 1,500)" : "What it should say instead (max 1,500)"}<textarea name="answer" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={1500} className={inp} />
        <span className="mt-1 block text-xs font-normal">Write only facts that are true today. No invented prices, counts or guarantees. Only beigeleads.com links are allowed.</span></label>
      {faq && <label className="text-sm font-semibold text-forest-900">Search words (comma separated, optional)<input name="keywords" value={kw} onChange={(e) => setKw(e.target.value)} maxLength={200} className={inp} /></label>}
      <label className="text-sm font-semibold text-forest-900">Status
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className={inp}><option value="draft">Draft (not used)</option><option value="published">Published (used by BeigePilot)</option></select></label>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>{r && <p role="status" className={`text-sm font-semibold ${r.ok ? "text-forest-700" : "text-red-700"}`}>{r.message}</p>}</div>
    </form>
  );
}
