"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/admin/ui";

export type Section = { id: string; label: string; text: string; href: string | null };
export type FieldHit = { key: string; label: string; description: string; sectionLabel: string; href: string };

export function SettingsSearch({ sections, fields }: { sections: Section[]; fields: FieldHit[] }) {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const secs = useMemo(() => sections.filter((s) => !n || `${s.label} ${s.text}`.toLowerCase().includes(n)), [sections, n]);
  const hits = useMemo(() => (n ? fields.filter((f) => `${f.label} ${f.description} ${f.key}`.toLowerCase().includes(n)) : []), [fields, n]);
  return (
    <div>
      <label htmlFor="ss" className="sr-only">Search settings</label>
      <input id="ss" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings, for example banner or website name" className="mb-6 w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm" />
      {hits.length > 0 && (
        <ul className="mb-6 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white" aria-label="Matching settings">
          {hits.map((f) => <li key={f.key}><Link href={f.href} className="block px-5 py-3 hover:bg-sand-100"><span className="font-semibold text-forest-900">{f.label}</span> <span className="text-xs">in {f.sectionLabel}</span><span className="block text-xs">{f.description}</span></Link></li>)}
        </ul>
      )}
      {secs.length === 0 && hits.length === 0 ? <p className="text-sm" role="status">No setting matches &ldquo;{q}&rdquo;.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {secs.map((s) => {
            const body = (<><span className="flex items-center justify-between gap-2"><span className="font-bold text-forest-900">{s.label}</span>{!s.href && <Badge tone="mute">Coming soon</Badge>}</span><span className="mt-1 block text-sm">{s.text}</span></>);
            return <li key={s.id}>{s.href ? <Link href={s.href} className="block h-full rounded-2xl border border-sand-200 bg-white p-5 hover:border-forest-500">{body}</Link> : <div className="h-full rounded-2xl border border-dashed border-sand-300 p-5 opacity-80">{body}</div>}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
