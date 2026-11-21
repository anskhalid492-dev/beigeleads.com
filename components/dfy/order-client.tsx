"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const field = "mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
async function post(action: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; message?: string; redirect?: string }> {
  try { const r = await fetch(`/api/dfy/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return (await r.json()) as never; }
  catch { return { ok: false, error: "Network error. Try again." }; }
}

export function Msg({ m }: { m: { ok: boolean; text: string } | null }) { return m ? <p role={m.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-3 py-2 text-sm ${m.ok ? "bg-forest-100 text-forest-900" : "bg-red-50 text-red-800"}`}>{m.text}</p> : null; }

function T({ n, l, rows = 1, req = false }: { n: string; l: string; rows?: number; req?: boolean }) { return <label className="block text-sm font-medium text-forest-900">{l}{rows > 1 ? <textarea name={n} rows={rows} required={req} className={field} /> : <input name={n} required={req} className={field} />}</label> }

export function OnboardingForm({ token }: { token: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false); const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setM(null);
    const f = new FormData(e.currentTarget); const v = (k: string) => String(f.get(k) ?? "");
    const res = await post("onboarding", { token, website2: v("website2"), form: { contactName: v("contactName"), businessName: v("businessName"), website: v("website"), offer: v("offer"), icp: v("icp"), countries: v("countries"), exclusions: v("exclusions"), goals: v("goals"), infrastructure: v("infrastructure"), senderNames: v("senderNames"), jurisdictions: v("jurisdictions"), lawfulBasis: v("lawfulBasis"), suppression: v("suppression"), authorized: f.get("authorized") === "on", lawful: f.get("lawful") === "on" } });
    setBusy(false);
    if (res.ok) r.refresh(); else setM({ ok: false, text: res.error ?? "Check the form." });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="hidden" aria-hidden><input name="website2" tabIndex={-1} autoComplete="off" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><T n="contactName" l="Your name" req /><T n="businessName" l="Business name" req /><T n="website" l="Website" req /><T n="countries" l="Countries to target" req /></div>
      <T n="offer" l="What do you sell?" rows={3} req /><T n="icp" l="Who do you want to reach? (industries, roles, company size)" rows={3} req />
      <T n="exclusions" l="Exclusions (companies, industries, regions to avoid)" rows={2} /><T n="goals" l="Campaign requirements or goals" rows={2} />
      <T n="infrastructure" l="Infrastructure preferences (domain naming ideas)" rows={2} /><T n="senderNames" l="Sender names to use" />
      <T n="jurisdictions" l="Where you operate and where recipients are" req /><T n="lawfulBasis" l="Your lawful basis / permission for B2B outreach" rows={2} req /><T n="suppression" l="Suppression lists (paste a few domains, or say you will email the file)" rows={2} />
      <p className="rounded-xl bg-sand-100 p-3 text-sm">Never put passwords or keys in this form. We never need them here.</p>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="authorized" required className="mt-1 accent-purple-600" />I am authorised to use this business and website for outreach.</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="lawful" required className="mt-1 accent-purple-600" />Outreach will follow anti-spam laws: honest sender details and an opt-out in every message.</label>
      <button disabled={busy} className="inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send onboarding details"}</button>
      <Msg m={m} />
    </form>
  );
}

export function CopyReview({ token }: { token: string }) {
  const r = useRouter(); const [note, setNote] = useState(""); const [m, setM] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function go(decision: "approve" | "changes") { setBusy(true); const res = await post("copy", { token, decision, note }); setBusy(false); if (res.ok) r.refresh(); else setM({ ok: false, text: res.error ?? "Try again." }); }
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-forest-900">Changes you want (needed only if you ask for changes)<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={field} /></label>
      <div className="mt-3 flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => go("approve")} className="inline-flex h-11 items-center rounded-full bg-purple-600 px-6 font-semibold text-white disabled:opacity-60">Approve copy</button>
        <button disabled={busy} onClick={() => go("changes")} className="inline-flex h-11 items-center rounded-full border border-forest-700 px-6 font-semibold text-forest-900 disabled:opacity-60">Request changes</button>
      </div>
      <Msg m={m} />
    </div>
  );
}

export function RenewCancel({ token, canRenew, options, cancelRequested }: { token: string; canRenew: boolean; options: { id: string; label: string }[]; cancelRequested: boolean }) {
  const r = useRouter(); const [coin, setCoin] = useState(options[0]?.id ?? ""); const [m, setM] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function renew() { setBusy(true); const res = await post("renew", { token, coin }); setBusy(false); if (res.ok && res.redirect) r.push(res.redirect); else setM({ ok: false, text: res.error ?? "Try again." }); }
  async function cancel() { if (!confirm("Cancel this service? No further renewals will be invoiced.")) return; setBusy(true); const res = await post("cancel", { token }); setBusy(false); setM({ ok: !!res.ok, text: res.message ?? res.error ?? "" }); if (res.ok) r.refresh(); }
  return (
    <div className="space-y-4">
      {canRenew && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-forest-900">Pay with<select value={coin} onChange={(e) => setCoin(e.target.value)} className="mt-1 block rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm">{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
          <button disabled={busy} onClick={renew} className="inline-flex h-11 items-center rounded-full bg-purple-600 px-6 font-semibold text-white disabled:opacity-60">Pay next month</button>
        </div>
      )}
      {!cancelRequested && <button disabled={busy} onClick={cancel} className="text-sm font-semibold text-forest-700 underline underline-offset-2">Request cancellation</button>}
      <Msg m={m} />
    </div>
  );
}
