"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/admin/ui";
import { bulkAction } from "./actions";

type Row = { id: number; term: string; slug: string; category: string; status: "draft" | "published"; featured: boolean; thin: boolean; updated: string };
export function ListTable({ rows, categories, back }: { rows: Row[]; categories: { slug: string; name: string }[]; back: string }) {
  const [sel, setSel] = useState<number[]>([]);
  const [action, setAction] = useState("publish");
  const all = rows.length > 0 && sel.length === rows.length;
  const name = new Map(categories.map((c) => [c.slug, c.name]));
  return (
    <form action={bulkAction}>
      <input type="hidden" name="back" value={back} />
      <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 px-5 py-3 text-sm">
        <span className="font-semibold text-forest-900">{sel.length ? `${sel.length} selected` : "Bulk actions"}</span>
        <select name="action" value={action} onChange={(e) => setAction(e.target.value)} className="rounded-xl border border-sand-300 bg-white px-3 py-1.5" aria-label="Bulk action">
          <option value="publish">Publish</option><option value="draft">Unpublish (draft)</option><option value="category">Change category</option><option value="feature">Add to “Start here”</option><option value="unfeature">Remove from “Start here”</option><option value="delete">Delete</option>
        </select>
        {action === "category" && <select name="category" className="rounded-xl border border-sand-300 bg-white px-3 py-1.5" aria-label="Category">{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>}
        {action === "delete" && <label className="flex items-center gap-2"><input type="checkbox" name="confirm" value="1" /> I confirm</label>}
        <button type="submit" disabled={!sel.length} className="rounded-full bg-forest-900 px-4 py-1.5 font-semibold text-sand-50 disabled:opacity-40">Apply</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-forest-500"><tr className="border-b border-sand-200"><th className="w-10 px-5 py-2"><input type="checkbox" aria-label="Select all on this page" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} /></th><th className="px-2 py-2">Term</th><th className="px-2 py-2">Category</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Updated</th><th className="px-5 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-sand-200 last:border-0 hover:bg-sand-50">
                <td className="px-5 py-3"><input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.term}`} checked={sel.includes(r.id)} onChange={() => setSel((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))} /></td>
                <td className="px-2 py-3"><Link href={`/admin/glossary/${r.id}`} className="font-semibold text-forest-900 hover:underline">{r.term}</Link><p className="font-mono text-xs text-forest-500">/{r.slug}</p></td>
                <td className="px-2 py-3">{name.get(r.category) ?? (r.category ? r.category : "—")}</td>
                <td className="px-2 py-3"><div className="flex flex-wrap gap-1"><Badge tone={r.status === "published" ? "good" : "mute"}>{r.status === "published" ? "Published" : "Draft"}</Badge>{r.featured && <Badge tone="info">Start here</Badge>}{r.thin && <Badge tone="warn">Thin</Badge>}</div></td>
                <td className="px-2 py-3 text-xs">{r.updated}</td>
                <td className="px-5 py-3 text-right"><Link href={`/admin/glossary/${r.id}/preview`} className="mr-3 underline">Preview</Link><Link href={`/admin/glossary/${r.id}`} className="underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
