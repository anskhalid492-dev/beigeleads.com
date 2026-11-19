"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Empty, Panel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { bulkAction, deleteAction, duplicateAction, transitionAction } from "./actions";

type Status = "draft" | "scheduled" | "published" | "archived";
export type PostRow = { id: number; title: string; slug: string; status: Status; author: string; image: string | null; category: string | null; published: string; scheduled: string; updated: string };
const TONE = { draft: "mute", scheduled: "info", published: "good", archived: "warn" } as const;
const field = "h-10 rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";

export function PostTable(p: { kind?: "blog" | "guide"; role: "admin" | "editor"; rows: PostRow[]; total: number; page: number; per: number; cats: { id: number; name: string }[]; authors: string[]; q: string; status: string; category: string; author: string; sort: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<null | { text: string; run: () => Promise<void> }>(null);
  const admin = p.role === "admin";
  const A = p.kind === "guide" ? "/admin/guides" : "/admin/blog";
  const P = p.kind === "guide" ? "/guides" : "/blog";
  const N = p.kind === "guide" ? "guide" : "article";
  const pages = Math.max(1, Math.ceil(p.total / p.per));
  const qs = (n: number) => { const u = new URLSearchParams(); if (p.q) u.set("q", p.q); if (p.status) u.set("status", p.status); if (p.category) u.set("category", p.category); if (p.author) u.set("author", p.author); if (p.sort !== "updated") u.set("sort", p.sort); if (n > 1) u.set("page", String(n)); const s = u.toString(); return s ? `?${s}` : "?"; };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => start(async () => {
    const r = await fn();
    if (r.ok) { toast(true, done); setSel([]); router.refresh(); } else toast(false, r.error ?? "Failed.");
  });
  const ask = (text: string, fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => setConfirm({ text, run: async () => { setConfirm(null); run(fn, done); } });
  const allOn = p.rows.length > 0 && p.rows.every((r) => sel.includes(r.id));

  const bulk = (action: "publish" | "archive" | "delete", label: string) => ask(
    `${label} ${sel.length} ${N}${sel.length === 1 ? "" : "s"}?${action === "delete" ? " This also deletes their bodies and revisions and cannot be undone." : ""}`,
    async () => { const r = await bulkAction(sel, action); if (r.ok && r.failed.length) return { ok: false, error: `${r.done} done. ${r.failed.join("; ")}` }; return r; },
    `${label} done.`,
  );

  return (
    <Panel>
      <form method="get" className="flex flex-wrap items-center gap-2 border-b border-sand-200 p-4">
        <input name="q" defaultValue={p.q} placeholder="Search title, slug or excerpt" aria-label={`Search ${N}s`} className={`${field} min-w-52 flex-1`} />
        <select name="status" defaultValue={p.status} aria-label="Status" className={field}><option value="">All statuses</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select>
        <select name="category" defaultValue={p.category} aria-label="Category" className={field}><option value="">All categories</option>{p.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="author" defaultValue={p.author} aria-label="Author" className={field}><option value="">All authors</option>{p.authors.map((a) => <option key={a}>{a}</option>)}</select>
        <select name="sort" defaultValue={p.sort} aria-label="Sort" className={field}><option value="updated">Recently updated</option><option value="published">Publish date</option><option value="title">Title A–Z</option></select>
        <Button type="submit" variant="secondary">Apply</Button>
      </form>

      {admin && sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-sand-200 bg-sand-100 px-4 py-2 text-sm">
          <span className="font-semibold text-forest-900">{sel.length} selected</span>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk("publish", "Publish")}>Publish</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk("archive", "Archive")}>Archive</Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => bulk("delete", "Delete")}>Delete</Button>
          <button type="button" className="ml-auto underline" onClick={() => setSel([])}>Clear</button>
        </div>
      )}

      {p.rows.length === 0 ? <Empty title={`No ${N}s found`} text={`Change the filters or create a new ${N}.`} /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-sand-200 text-xs text-forest-700">
              <tr>
                <th className="w-10 px-4 py-3">{admin && <input type="checkbox" aria-label="Select all on this page" checked={allOn} onChange={() => setSel(allOn ? [] : p.rows.map((r) => r.id))} />}</th>
                <th className="px-2 py-3">Article</th><th className="px-2 py-3">Status</th><th className="px-2 py-3">Category</th><th className="px-2 py-3">Author</th><th className="px-2 py-3">Dates (UTC)</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {p.rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">{admin && <input type="checkbox" aria-label={`Select ${r.title}`} checked={sel.includes(r.id)} onChange={() => setSel((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))} />}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-start gap-3">
                      {r.image ?   <img src={r.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-16 shrink-0 rounded-lg bg-sand-100" aria-hidden />}
                      <div className="min-w-0">
                        <Link href={`${A}/${r.id}/edit`} className="font-semibold text-forest-900 hover:underline">{r.title || "Untitled"}</Link>
                        <p className="truncate text-xs">{P}/{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3"><Badge tone={TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge></td>
                  <td className="px-2 py-3">{r.category ?? "—"}</td>
                  <td className="px-2 py-3">{r.author || "—"}</td>
                  <td className="px-2 py-3 text-xs">
                    <p>Updated {r.updated}</p>
                    {r.published && <p>Published {r.published}</p>}
                    {r.status === "scheduled" && r.scheduled && <p>Goes live {r.scheduled}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button asChild size="sm" variant="secondary"><Link href={`${A}/${r.id}/edit`}>Edit</Link></Button>
                      <Button asChild size="sm" variant="secondary"><Link href={r.status === "published" ? `${P}/${r.slug}` : `${A}/${r.id}/preview`} target="_blank">{r.status === "published" ? "View" : "Preview"}</Link></Button>
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { const x = await duplicateAction(r.id); if (x.ok) { toast(true, "Duplicated as a draft."); router.push(`${A}/${x.id}/edit`); } else toast(false, x.error); })}>Duplicate</Button>
                      {admin && (<>
                      {r.status === "published" || r.status === "scheduled"
                        ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => ask(`Unpublish “${r.title}”? It disappears from the public blog and returns to draft.`, () => transitionAction(r.id, "unpublish"), "Unpublished.")}>Unpublish</Button>
                        : r.status === "archived"
                          ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => transitionAction(r.id, "restore"), "Restored to draft.")}>Restore</Button>
                          : <Button size="sm" disabled={pending} onClick={() => ask(`Publish “${r.title}” now?`, () => transitionAction(r.id, "publish"), "Published.")}>Publish</Button>}
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => ask(`Delete “${r.title}”? Its body, revisions and tag links are removed. This cannot be undone.`, () => deleteAction(r.id), "Deleted.")}>Delete</Button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-sand-200 px-4 py-3 text-sm">
        <span>{p.total} {N}{p.total === 1 ? "" : "s"} · page {p.page} of {pages}</span>
        <div className="flex gap-2">
          {p.page > 1 && <Button asChild size="sm" variant="secondary"><Link href={qs(p.page - 1)}>Previous</Link></Button>}
          {p.page < pages && <Button asChild size="sm" variant="secondary"><Link href={qs(p.page + 1)}>Next</Link></Button>}
        </div>
      </div>

      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm" className="fixed inset-0 z-[80] grid place-items-center bg-forest-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <p className="text-forest-900">{confirm.text}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button onClick={() => void confirm.run()}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
