"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Cand = { index: number; label: string; example: string };
type Reply = { ok?: boolean; error?: string; count?: number; total?: number; limit?: number; notes?: string[]; needColumn?: Cand[]; fileId?: string; over?: { allowed: number; submitted: number; remaining: number } };
const MB = 1024 * 1024;
const fmt = (n: number) => n.toLocaleString("en-US");

export function SubmitForm({ token, limit, used, accepted, formats, maxMb, replace, reason, support }: { token: string; limit: number; used: number; accepted: { name: string; count: number }[]; formats: string[]; maxMb: number; replace: boolean; reason: string; support: string }) {
  const [tab, setTab] = useState<"file" | "paste">("file");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cols, setCols] = useState<{ fileId: string; list: Cand[] } | null>(null);
  const [pick, setPick] = useState(0);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState<{ count: number; total: number } | null>(null);
  const remaining = replace ? limit : Math.max(0, limit - used);

  function handle(r: Reply, status: number) {
    if (r.needColumn && r.fileId) { setCols({ fileId: r.fileId, list: r.needColumn }); setPick(r.needColumn[0]?.index ?? 0); setMsg(null); return; }
    if (r.ok) { setCols(null); setDone({ count: r.count ?? 0, total: r.total ?? 0 }); setMsg({ kind: "ok", text: `We received ${fmt(r.count ?? 0)} emails. Your order is queued for manual processing.${r.notes?.length ? ` ${r.notes.join(" ")}` : ""}` }); return; }
    const over = r.over ? ` Allowed: ${fmt(r.over.allowed)}. This submission: ${fmt(r.over.submitted)}. Remaining: ${fmt(r.over.remaining)}.` : "";
    setMsg({ kind: "err", text: `${r.error ?? (status === 429 ? "Too many attempts. Try again later." : "Something went wrong. Try again.")}${over}` });
  }

  function send(body: Blob, name: string, source: "upload" | "paste") {
    setBusy(true); setPct(0); setMsg(null);
    const x = new XMLHttpRequest();
    x.open("PUT", "/api/ev/upload");
    x.setRequestHeader("x-ev-token", token); x.setRequestHeader("x-ev-name", encodeURIComponent(name)); x.setRequestHeader("x-ev-source", source);
    x.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => { setBusy(false); let r: Reply = {}; try { r = JSON.parse(x.responseText) as Reply; } catch { /* handled below */ } handle(r, x.status); };
    x.onerror = () => { setBusy(false); setMsg({ kind: "err", text: "The upload was interrupted. Check your connection and try again." }); };
    x.send(body);
  }

  function chooseFile(f: File | undefined) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!formats.includes(ext)) { setMsg({ kind: "err", text: `Use a ${formats.map((x) => x.toUpperCase()).join(", ")} file.` }); return; }
    if (f.size > maxMb * MB) { setMsg({ kind: "err", text: `The file is ${(f.size / MB).toFixed(1)} MB. The maximum is ${maxMb} MB.` }); return; }
    if (ext === "xlsx" && f.size > 50 * MB) { setMsg({ kind: "err", text: "Spreadsheets can be up to 50 MB. Save the list as CSV or TXT for larger files." }); return; }
    send(f, f.name, "upload");
  }

  function sendPaste() {
    const b = new Blob([text.trim() + "\n"], { type: "text/plain" });
    if (b.size > maxMb * MB) { setMsg({ kind: "err", text: `The text is too large. The maximum is ${maxMb} MB.` }); return; }
    send(b, "pasted-emails.txt", "paste");
  }

  async function confirmColumn() {
    if (!cols) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/ev/column", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, fileId: cols.fileId, column: pick }) }).catch(() => null);
    setBusy(false);
    if (!res) { setMsg({ kind: "err", text: "No connection. Try again." }); return; }
    handle((await res.json().catch(() => ({}))) as Reply, res.status);
  }
  async function cancelColumn() {
    if (!cols) return;
    await fetch("/api/ev/column", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, fileId: cols.fileId, cancel: true }) }).catch(() => null);
    setCols(null);
  }

  const tabCls = (on: boolean) => `rounded-full px-5 py-2 text-sm font-semibold ${on ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-900 hover:bg-sand-200"}`;
  return (
    <div className="mt-6">
      {reason && <p role="status" className="mb-4 rounded-2xl border border-purple-600 bg-purple-100 p-4 text-sm"><strong>Action required:</strong> {reason} Submitting a new list replaces the earlier one.</p>}
      {accepted.length > 0 && !replace && <p className="mb-4 rounded-2xl bg-forest-100 p-4 text-sm">Already received: {accepted.map((a) => `${a.name} (${fmt(a.count)})`).join(", ")}. You can add more files, but all files together must stay within {fmt(limit)} emails ({fmt(remaining)} left).</p>}
      {done && <p role="status" className="mb-4 rounded-2xl border-2 border-forest-900 bg-forest-100 p-4 font-semibold text-forest-900">Received: {fmt(done.count)} emails. Total on this order: {fmt(done.total)} of {fmt(limit)}.</p>}
      <div role="tablist" aria-label="How to submit" className="flex gap-2">
        <button role="tab" id="t-file" aria-selected={tab === "file"} aria-controls="p-file" className={tabCls(tab === "file")} onClick={() => setTab("file")}>Upload File</button>
        <button role="tab" id="t-paste" aria-selected={tab === "paste"} aria-controls="p-paste" className={tabCls(tab === "paste")} onClick={() => setTab("paste")}>Paste Emails</button>
      </div>
      <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
        {cols ? (
          <div role="group" aria-labelledby="colq">
            <h2 id="colq" className="font-bold text-forest-900">Which column has the email addresses?</h2>
            <p className="mt-1 text-sm">We found more than one column that looks like email addresses. Examples are masked.</p>
            <div className="mt-3 space-y-2">{cols.list.map((c) => <label key={c.index} className="flex cursor-pointer items-center gap-3 rounded-xl border border-sand-300 px-4 py-2.5 text-sm has-[:checked]:border-forest-900 has-[:checked]:bg-forest-100"><input type="radio" name="col" className="accent-forest-900" checked={pick === c.index} onChange={() => setPick(c.index)} /><span className="font-semibold text-forest-900">{c.label || `Column ${c.index + 1}`}</span><span className="text-forest-500">{c.example}</span></label>)}</div>
            <div className="mt-4 flex gap-3"><Button onClick={confirmColumn} disabled={busy}>{busy ? "Checking…" : "Use this column"}</Button><Button variant="secondary" onClick={cancelColumn} disabled={busy}>Cancel upload</Button></div>
          </div>
        ) : tab === "file" ? (
          <div id="p-file" role="tabpanel" aria-labelledby="t-file">
            <label htmlFor="ev-file" className="block text-sm font-semibold text-forest-900">Choose a {formats.map((f) => f.toUpperCase()).join(", ")} file (up to {maxMb} MB)</label>
            <input id="ev-file" ref={fileRef} type="file" accept={formats.map((f) => `.${f}`).join(",")} disabled={busy} onChange={(e) => { chooseFile(e.target.files?.[0]); if (fileRef.current) fileRef.current.value = ""; }} className="mt-2 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-5 file:py-2.5 file:font-semibold file:text-white hover:file:bg-purple-700" />
            <p className="mt-3 text-sm">Spreadsheets: we read the first sheet and the column that holds email addresses. Duplicates count toward your {fmt(limit)} limit.</p>
          </div>
        ) : (
          <div id="p-paste" role="tabpanel" aria-labelledby="t-paste">
            <label htmlFor="ev-text" className="block text-sm font-semibold text-forest-900">Paste emails: one per line, or separated by commas or semicolons</label>
            <textarea id="ev-text" value={text} onChange={(e) => setText(e.target.value)} rows={10} disabled={busy} spellCheck={false} className="mt-2 w-full rounded-xl border border-sand-300 bg-white p-3 font-mono text-sm" />
            <div className="mt-3"><Button onClick={sendPaste} disabled={busy || text.trim().length === 0}>{busy ? "Sending…" : "Submit pasted emails"}</Button></div>
          </div>
        )}
        {busy && <div className="mt-4" role="status" aria-live="polite"><div className="h-2 overflow-hidden rounded-full bg-sand-200"><div className="h-full bg-purple-600 transition-[width]" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-xs">{pct < 100 ? `Uploading… ${pct}%` : "Checking your list…"}</p></div>}
        {msg && <p role={msg.kind === "err" ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm ${msg.kind === "err" ? "bg-sand-100 text-forest-900" : "bg-forest-100 font-semibold text-forest-900"}`}>{msg.text}{msg.kind === "err" && <> {" "}Need more room? <Link className="font-semibold underline" href="/email-verification#pricing">Choose a larger package</Link>{support ? <> or email <a className="font-semibold underline" href={`mailto:${support}`}>{support}</a></> : <> or <Link className="font-semibold underline" href="/contact">contact support</Link></>}.</>}</p>}
      </div>
    </div>
  );
}
