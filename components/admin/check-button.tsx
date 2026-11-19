"use client";
import { useState, useTransition } from "react";
import { Badge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { refreshCachesAction, runCheckAction } from "@/app/admin/settings/actions";
import type { CheckResult } from "@/lib/settings/health";

export function CheckButton({ id, initial, label = "Test connection" }: { id: string; initial?: CheckResult | null; label?: string }) {
  const [r, setR] = useState<CheckResult | null>(initial ?? null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { setErr(""); const x = await runCheckAction(id); if ("detail" in x) setR(x); else setErr(x.error); })}>{pending ? "Checking…" : label}</Button>
      {err && <p role="alert" className="text-xs text-red-800">{err}</p>}
      {r && <p className="text-xs" role="status"><Badge tone={r.ok ? "good" : "bad"}>{r.ok ? "Passed" : "Failed"}</Badge> <span>{r.detail}</span>{r.ms !== undefined && <span> ({r.ms} ms)</span>}<span className="block">Last checked {new Date(r.at).toLocaleString()}</span></p>}
    </div>
  );
}

export function RefreshCachesButton() {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await refreshCachesAction(); setMsg({ ok: r.ok, t: r.ok ? "Caches cleared. Public settings and the sitemap will refresh on the next visit." : r.error }); })}>{pending ? "Refreshing…" : "Refresh caches and sitemap"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs ${msg.ok ? "" : "text-red-800"}`}>{msg.t}</p>}
    </div>
  );
}
