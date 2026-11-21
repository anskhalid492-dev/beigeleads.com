"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type F = { id: string; name: string; size: number; url: string };
/** The customer confirms the order email, then gets short-lived download links (valid about 10 minutes). */
export function ResultsAccess({ token, days }: { token: string; days: number }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [files, setFiles] = useState<F[] | null>(null);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/ev/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, email }) }).catch(() => null);
    setBusy(false);
    if (!r) { setErr("No connection. Try again."); return; }
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; files?: F[] };
    if (j.ok && j.files) setFiles(j.files); else setErr(j.error ?? "Something went wrong.");
  }
  return (
    <div className="mt-6 rounded-2xl border-2 border-forest-900 bg-forest-100 p-5">
      <h2 className="text-lg font-bold text-forest-900">Your results are ready</h2>
      <p className="mt-1 text-sm">Confirm the email address used for this order to download. Results stay available for {days} days after completion.</p>
      {files ? (
        <ul className="mt-4 space-y-2">{files.map((f) => <li key={f.id}><a href={f.url} className="inline-flex rounded-full bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700">Download {f.name}</a> <span className="text-xs">({(f.size / 1024 / 1024).toFixed(1)} MB; link valid about 10 minutes)</span></li>)}</ul>
      ) : (
        <form onSubmit={go} className="mt-4 flex flex-wrap gap-2">
          <label htmlFor="ev-email" className="sr-only">Order email</label>
          <input id="ev-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" className="h-11 min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-3" />
          <Button type="submit" disabled={busy}>{busy ? "Checking…" : "Show downloads"}</Button>
        </form>
      )}
      {err && <p role="alert" className="mt-3 rounded-xl bg-white px-3 py-2 text-sm">{err}</p>}
    </div>
  );
}
