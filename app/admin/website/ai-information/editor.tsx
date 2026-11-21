"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/admin/ui";
import { checkLlms, LLMS_MAX } from "@/lib/site-links/store-rules";
import { publishLlmsAction, restoreLlmsAction, saveLlmsDraftAction } from "../actions";

type Rev = { at: number; by: string; size: number };

export function LlmsEditor({ draft, published, publishedAt, publishedBy, revisions }: { draft: string; published: string; publishedAt: number; publishedBy: string; revisions: Rev[] }) {
  const router = useRouter();
  const [text, setText] = useState(draft);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const check = checkLlms(text);
  const dirty = text !== draft; const live = text.trim() + "\n" === published.trim() + "\n";
  const run = (f: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) => start(async () => { setNote(null); const r = await f(); setNote(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); setConfirm(false); if (r.ok) router.refresh(); });
  return (
    <div className="space-y-5">
      <Panel title="Edit">
        <label className="block text-xs font-semibold">File text (plain text / Markdown, {text.length.toLocaleString("en-US")} of {LLMS_MAX.toLocaleString("en-US")} characters)
          <textarea value={text} onChange={(e) => { setText(e.target.value); setConfirm(false); }} rows={26} spellCheck className="mt-1 w-full rounded-lg border border-sand-300 bg-white p-3 font-mono text-xs leading-relaxed" />
        </label>
        {!check.ok && <p role="alert" className="mt-2 text-sm text-red-700">{check.error}</p>}
        <p className="mt-2 text-xs text-forest-700">Only claims the website itself supports belong here: no invented certifications, accuracy rates, testimonials, customer counts or guarantees. HTML, scripts, secrets and non-https links are refused.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending || !check.ok || !dirty} onClick={() => run(() => saveLlmsDraftAction(text))} className="rounded-xl border border-sand-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-sand-100 disabled:opacity-50">Save draft</button>
          {!confirm ? (
            <button type="button" disabled={pending || !check.ok || live} onClick={() => setConfirm(true)} className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">Publish</button>
          ) : (
            <span className="flex items-center gap-2 text-sm">Replace the public /llms.txt with this text?
              <button type="button" disabled={pending} onClick={() => run(() => publishLlmsAction(text))} className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white">Yes, publish</button>
              <button type="button" onClick={() => setConfirm(false)} className="underline">Cancel</button></span>
          )}
          {note && <p role={note.ok ? "status" : "alert"} className={`text-sm ${note.ok ? "text-forest-700" : "text-red-700"}`}>{note.text}</p>}
        </div>
      </Panel>
      <Panel title="Published version">
        <p className="text-sm">{publishedAt ? `Published ${new Date(publishedAt).toUTCString()} by ${publishedBy}.` : "The built-in text is live: nobody has published a change yet."} <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="underline">Open /llms.txt</a></p>
        <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Preview of what is live</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-sand-100 p-3 text-xs">{published}</pre></details>
      </Panel>
      <Panel title="Revisions">
        <p className="mb-2 text-xs text-forest-700">Each publish keeps the version it replaced (20 kept). Restoring only loads it into the draft.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3"><span>Built-in text (version shipped with the site)</span><button type="button" disabled={pending} onClick={() => run(() => restoreLlmsAction(-1))} className="underline">Load into draft</button></li>
          {revisions.map((r, i) => (
            <li key={`${r.at}-${i}`} className="flex items-center justify-between gap-3"><span>{new Date(r.at).toUTCString()} by {r.by} ({r.size.toLocaleString("en-US")} characters)</span><button type="button" disabled={pending} onClick={() => run(() => restoreLlmsAction(i))} className="underline">Load into draft</button></li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
