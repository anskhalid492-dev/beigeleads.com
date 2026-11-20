"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/admin/ui";

export type Row = { key: string; name: string; audience: "customer" | "admin"; connection: "connected" | "not_connected"; subject: string; state: "built-in" | "published" | "draft"; version: number; updatedAt: number | null; event: string; copy: boolean; category: string; off: boolean };
const sel = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

export function TemplatesTable({ rows, initialState }: { rows: Row[]; initialState?: "draft" | "published" }) {
  const [q, setQ] = useState("");
  const [aud, setAud] = useState("");
  const [con, setCon] = useState("");
  const [cat, setCat] = useState("");
  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows]);
  const [sort, setSort] = useState<"name" | "updated">("name");
  const view = useMemo(() => {
    const s = q.toLowerCase().trim();
    const out = rows.filter((r) => (!initialState || r.state === initialState) && (!aud || r.audience === aud) && (!con || r.connection === con) && (!cat || r.category === cat) && (!s || `${r.name} ${r.subject} ${r.key}`.toLowerCase().includes(s)));
    return out.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (b.updatedAt ?? 0) - (a.updatedAt ?? 0)));
  }, [rows, q, aud, con, cat, sort, initialState]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-sand-200 p-4">
        <input className={`${sel} min-w-[14rem]`} placeholder="Search templates" aria-label="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={sel} aria-label="Audience" value={aud} onChange={(e) => setAud(e.target.value)}><option value="">Customer and admin</option><option value="customer">Customer emails</option><option value="admin">Admin alerts</option></select>
        <select className={sel} aria-label="Connection" value={con} onChange={(e) => setCon(e.target.value)}><option value="">Any connection</option><option value="connected">Connected</option><option value="not_connected">Not connected</option></select>
        {cats.length > 0 && <select className={sel} aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
        <select className={sel} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as "name" | "updated")}><option value="name">Sort by name</option><option value="updated">Sort by last edited</option></select>
      </div>
      {view.length === 0 ? <p className="px-6 py-10 text-center text-sm">No template matches.</p> : (
        <ul className="divide-y divide-sand-200">
          {view.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-bold text-forest-900">{r.name}</p>
                <p className="truncate text-sm">{r.subject}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.category && <Badge tone="info">{r.category}</Badge>}{r.off && <Badge tone="bad">Switched off</Badge>}{r.copy && <Badge tone="mute">Your copy</Badge>}<Badge tone={r.audience === "customer" ? "info" : "mute"}>{r.audience === "customer" ? "Customer" : "Admin alert"}</Badge>
                <Badge tone={r.connection === "connected" ? "good" : "warn"}>{r.connection === "connected" ? "Connected" : "Not connected"}</Badge>
                <Badge tone={r.state === "draft" ? "warn" : r.state === "published" ? "good" : "mute"}>{r.state === "published" ? `Published v${r.version}` : r.state === "draft" ? "Draft waiting" : "Built-in"}</Badge>
                <Link href={`/admin/system-emails/${r.key}`} className="inline-flex h-8 items-center rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100">Edit and preview</Link>
                <Link href={`/admin/system-emails/${r.key}/design`} className="inline-flex h-8 items-center rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100">Designer</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
