"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeKeyAction, refreshDomainAction, retryAction, saveKeyAction, saveSendersAction, saveWebhookSecretAction, sendTestEmailAction, testConnectionAction, toggleEventAction, type Res } from "./actions";
import type { DomainDetail } from "@/lib/email/resend-api";
import type { Senders } from "@/lib/email/senders";

const inp = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
function Msg({ r }: { r: Res | null }) { return r ? <p role={r.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${r.ok ? "bg-forest-100 text-forest-900" : "bg-red-50 text-red-800"}`}>{r.message}</p> : null; }

export function SecretForm({ kind, hint, canRemove }: { kind: "key" | "hook"; hint: string; canRemove?: boolean }) {
  const [v, setV] = useState(""); const [r, setR] = useState<Res | null>(null); const [p, go] = useTransition(); const router = useRouter();
  const label = kind === "key" ? "New Resend API key" : "New signing secret";
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); go(async () => { setR(null); const x = await (kind === "key" ? saveKeyAction(v) : saveWebhookSecretAction(v)); setR(x); if (x.ok) { setV(""); router.refresh(); } }); }}>
      <label className="block text-sm font-semibold text-forest-900">{label}
        <input type="password" autoComplete="off" spellCheck={false} value={v} onChange={(e) => setV(e.target.value)} placeholder={hint ? `Saved: ${hint} (paste a new one to replace)` : kind === "key" ? "re_..." : "whsec_..."} className={`${inp} mt-1 font-mono`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={p || !v.trim()}>{p ? "Checking with Resend…" : kind === "key" ? "Validate and save" : "Save"}</Button>
        {kind === "key" && canRemove && <Button type="button" variant="secondary" disabled={p} onClick={() => { if (confirm("Remove the saved key? The RESEND_API_KEY variable will be used if it is set.")) go(async () => { setR(await removeKeyAction()); router.refresh(); }); }}>Remove saved key</Button>}
      </div>
      <Msg r={r} />
    </form>
  );
}

export function TestConnection() {
  const [r, setR] = useState<Res | null>(null); const [p, go] = useTransition(); const router = useRouter();
  return <div className="space-y-3"><Button type="button" disabled={p} onClick={() => go(async () => { setR(null); setR(await testConnectionAction()); router.refresh(); })}>{p ? "Testing…" : "Test connection"}</Button><Msg r={r} /></div>;
}

export function TestEmail({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo); const [sub, setSub] = useState("BeigeLeads — Resend Integration Test");
  const [msg, setMsg] = useState("Your BeigeLeads email integration is working. This test email was sent from your admin dashboard.");
  const [r, setR] = useState<(Res & { id?: string }) | null>(null); const [p, go] = useTransition();
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); go(async () => { setR(null); setR(await sendTestEmailAction(to, sub, msg)); }); }}>
      <label className="block text-sm font-semibold">Recipient<input type="email" required value={to} onChange={(e) => setTo(e.target.value)} className={`${inp} mt-1`} /></label>
      <label className="block text-sm font-semibold">Subject<input value={sub} onChange={(e) => setSub(e.target.value)} maxLength={150} className={`${inp} mt-1`} /></label>
      <label className="block text-sm font-semibold">Message (optional)<textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} rows={3} className={`${inp} mt-1`} /></label>
      <Button type="submit" disabled={p}>{p ? "Sending…" : "Send test email"}</Button>
      <Msg r={r} />
      {r?.ok && r.id && <p className="text-xs">Provider message ID: <span className="font-mono">{r.id}</span></p>}
    </form>
  );
}

type Opt = { id: string; label: string };
export function SendersForm({ initial, cats }: { initial: Senders; cats: Opt[] }) {
  const [s, setS] = useState<Senders>(initial); const [r, setR] = useState<Res | null>(null); const [p, go] = useTransition();
  const set = (k: keyof Senders, v: string) => setS({ ...s, [k]: v });
  const ov = (c: string, k: "name" | "email" | "replyTo", v: string) => setS({ ...s, overrides: { ...s.overrides, [c]: { ...s.overrides[c], [k]: v || undefined } } });
  const f = (label: string, k: keyof Senders, ph = "") => <label className="block text-sm font-semibold">{label}<input value={String(s[k])} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={`${inp} mt-1`} /></label>;
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); go(async () => { setR(null); setR(await saveSendersAction(JSON.stringify(s))); }); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        {f("Default sender name", "defaultName", "BeigeLeads")}{f("Default sender email", "defaultEmail", "leave empty to use the configured address")}
        {f("Reply-to email", "replyTo")}{f("Support email", "supportEmail")}{f("Sales email", "salesEmail")}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold text-forest-900">Different sender for a group (optional)</h3>
        <div className="space-y-3">
          {cats.map((c) => (
            <div key={c.id} className="grid items-end gap-2 rounded-xl border border-sand-200 p-3 sm:grid-cols-4">
              <p className="text-sm font-semibold sm:col-span-1">{c.label}</p>
              <input aria-label={`${c.label} sender name`} placeholder="Name" value={s.overrides[c.id]?.name ?? ""} onChange={(e) => ov(c.id, "name", e.target.value)} className={inp} />
              <input aria-label={`${c.label} sender email`} placeholder="Email" value={s.overrides[c.id]?.email ?? ""} onChange={(e) => ov(c.id, "email", e.target.value)} className={inp} />
              <select aria-label={`${c.label} reply-to`} value={s.overrides[c.id]?.replyTo ?? "default"} onChange={(e) => ov(c.id, "replyTo", e.target.value === "default" ? "" : e.target.value)} className={inp}><option value="default">Reply-to: default</option><option value="support">Reply-to: support email</option><option value="sales">Reply-to: sales email</option></select>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={p}>{p ? "Saving…" : "Save sender settings"}</Button>
      <Msg r={r} />
    </form>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="rounded-lg border border-sand-300 px-2 py-0.5 text-xs font-semibold hover:bg-sand-100" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* blocked */ } }}>{done ? "Copied" : label}</button>;
}

export function DomainCard({ id, name, status, region }: { id: string; name: string; status: string; region?: string }) {
  const [d, setD] = useState<DomainDetail | null>(null); const [r, setR] = useState<Res | null>(null); const [p, go] = useTransition();
  const load = () => go(async () => { const x = await refreshDomainAction(id); setR(x); if (x.domain) setD(x.domain); });
  const st = d?.status ?? status;
  return (
    <div className="space-y-3 rounded-xl border border-sand-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-forest-900">{name} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${st === "verified" ? "bg-forest-100 text-forest-900" : "bg-amber-100 text-amber-900"}`}>{st}</span>{region && <span className="ml-2 text-xs">{region}</span>}</p>
        <div className="flex gap-2"><Button type="button" size="sm" variant="secondary" disabled={p} onClick={load}>{p ? "Refreshing…" : "Refresh domain status"}</Button><a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-sand-300 px-3 text-xs font-semibold">Open Resend dashboard</a></div>
      </div>
      <Msg r={r && !r.ok ? r : null} />
      {d && (d.records.length === 0 ? <p className="text-sm">Resend returned no DNS records for this domain.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="text-forest-700"><th className="py-1 pr-3">Record</th><th className="pr-3">Type</th><th className="pr-3">Name</th><th className="pr-3">Value</th><th className="pr-3">Status</th><th /></tr></thead>
          <tbody>{d.records.map((x, i) => <tr key={i} className="border-t border-sand-200 align-top"><td className="py-1 pr-3">{x.record}</td><td className="pr-3">{x.type}</td><td className="max-w-[10rem] break-all pr-3 font-mono">{x.name}</td><td className="max-w-[18rem] break-all pr-3 font-mono">{x.value}</td><td className="pr-3">{x.status ?? "—"}</td><td><CopyButton text={x.value} label="Copy value" /></td></tr>)}</tbody></table></div>
      ))}
    </div>
  );
}

export function EventToggle({ k, enabled, canDisable }: { k: string; enabled: boolean; canDisable: boolean }) {
  const [p, go] = useTransition(); const router = useRouter(); const [err, setErr] = useState("");
  if (!canDisable) return <span className="text-xs">Always on</span>;
  return <><button type="button" disabled={p} aria-pressed={enabled} onClick={() => go(async () => { const r = await toggleEventAction(k, !enabled); setErr(r.ok ? "" : r.message); router.refresh(); })} className={`rounded-full px-3 py-1 text-xs font-bold ${enabled ? "bg-forest-100 text-forest-900" : "bg-sand-200 text-forest-700"}`}>{enabled ? "On" : "Off"}</button>{err && <span role="alert" className="ml-2 text-xs text-red-700">{err}</span>}</>;
}

export function RetryButton({ id, tries }: { id: number; tries: number }) {
  const [open, setOpen] = useState(false); const [why, setWhy] = useState(""); const [r, setR] = useState<Res | null>(null); const [p, go] = useTransition(); const router = useRouter();
  if (!open) return <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>Retry{tries ? ` (tried ${tries})` : ""}</Button>;
  return (
    <div role="dialog" aria-label="Retry this email" className="mt-2 space-y-2 rounded-xl border border-sand-300 bg-sand-50 p-3">
      <p className="text-sm">Sends the same kind of email again. It never recreates the order, payment or discount.</p>
      <input value={why} onChange={(e) => setWhy(e.target.value)} maxLength={200} placeholder="Reason (required)" className={inp} />
      <div className="flex gap-2"><Button type="button" size="sm" disabled={p || why.trim().length < 3} onClick={() => go(async () => { setR(await retryAction(id, why)); router.refresh(); })}>{p ? "Retrying…" : "Confirm retry"}</Button><Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div>
      <Msg r={r} />
    </div>
  );
}
