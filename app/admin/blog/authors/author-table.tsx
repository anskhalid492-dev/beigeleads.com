"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, Empty, Panel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { AuthorAvatar } from "@/components/blog/avatar";
import { Button } from "@/components/ui/button";
import { authorUsageAction, deleteAuthorAction } from "./actions";

export type AuthorTableRow = { id: number; name: string; fullName: string; title: string; email: string; photo: string | null; status: "draft" | "published"; published: number; slug: string; updated: string };
const field = "h-10 rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";
type Sort = "name" | "role" | "status" | "updated" | "articles";

export function AuthorTable(p: { everyone: Option[]; rows: AuthorTableRow[]; total: number; page: number; per: number; q: string; sort: Sort; dir: "asc" | "desc" }) {
  const pages = Math.max(1, Math.ceil(p.total / p.per));
  const href = (o: { sort?: Sort; page?: number }) => {
    const u = new URLSearchParams();
    if (p.q) u.set("q", p.q);
    const sort = o.sort ?? p.sort;
    const dir = o.sort ? (o.sort === p.sort && p.dir === "asc" ? "desc" : o.sort === p.sort ? "asc" : o.sort === "updated" || o.sort === "articles" ? "desc" : "asc") : p.dir;
    u.set("sort", sort); u.set("dir", dir);
    if ((o.page ?? 1) > 1) u.set("page", String(o.page));
    return `?${u.toString()}`;
  };
  const th = (label: string, s: Sort, cls = "") => (
    <th scope="col" aria-sort={p.sort === s ? (p.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-4 py-3 text-left font-bold ${cls}`}>
      <Link href={href({ sort: s })} prefetch={false} className="inline-flex items-center gap-1 hover:underline">{label}{p.sort === s && <span aria-hidden>{p.dir === "asc" ? "↑" : "↓"}</span>}</Link>
    </th>
  );
  const [del, setDel] = useState<AuthorTableRow | null>(null);

  return (
    <Panel>
      <form method="get" className="flex flex-wrap items-center gap-2 border-b border-sand-200 p-4">
        <label htmlFor="aq" className="sr-only">Search authors</label>
        <input id="aq" name="q" defaultValue={p.q} placeholder="Search name, title or email" className={`${field} w-full sm:w-72`} />
        <input type="hidden" name="sort" value={p.sort} /><input type="hidden" name="dir" value={p.dir} />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
        {p.q && <Button asChild variant="secondary" size="sm"><Link href="/admin/blog/authors">Clear</Link></Button>}
        <span className="ml-auto text-sm">{p.total} author{p.total === 1 ? "" : "s"}</span>
      </form>
      {p.rows.length === 0 ? (
        <Empty title={p.q ? "No author matches your search" : "No authors yet"} text={p.q ? "Try a different name." : "Add the first author, then choose them on an article."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-sand-200 bg-sand-50 text-forest-900">
              <tr>{th("Author", "name")}{th("Role", "role")}<th scope="col" className="px-4 py-3 text-left font-bold">Email</th>{th("Articles", "articles")}{th("Status", "status")}{th("Updated", "updated")}<th scope="col" className="px-4 py-3 text-right font-bold">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {p.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AuthorAvatar photo={r.photo} name={r.name} size={40} /><div className="min-w-0"><Link href={`/admin/blog/authors/${r.id}/edit`} prefetch={false} className="font-semibold text-forest-900 hover:underline">{r.name}</Link>{r.fullName !== r.name && <p className="truncate text-xs">{r.fullName}</p>}</div></div></td>
                  <td className="px-4 py-3">{r.title || <span className="text-forest-500">Not set</span>}</td>
                  <td className="px-4 py-3">{r.email ? <span className="break-all">{r.email}</span> : <span className="text-forest-500">None</span>}</td>
                  <td className="px-4 py-3 tabular-nums">{r.published}</td>
                  <td className="px-4 py-3"><Badge tone={r.status === "published" ? "good" : "mute"}>{r.status === "published" ? "Published" : "Draft"}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3">{r.updated}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    {r.status === "published" && <Button asChild size="sm" variant="secondary"><Link href={`/blog/author/${r.slug}`} target="_blank" rel="noopener">View</Link></Button>}
                    <Button asChild size="sm" variant="secondary"><Link href={`/admin/blog/authors/${r.id}/edit`} prefetch={false}>Edit</Link></Button>
                    <Button size="sm" variant="secondary" onClick={() => setDel(r)} aria-label={`Delete ${r.name}`}>Delete</Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between border-t border-sand-200 p-4 text-sm">
          {p.page > 1 ? <Link href={href({ page: p.page - 1 })} className="font-semibold underline">Previous</Link> : <span />}
          <span>Page {p.page} of {pages}</span>
          {p.page < pages ? <Link href={href({ page: p.page + 1 })} className="font-semibold underline">Next</Link> : <span />}
        </nav>
      )}
      {del && <DeleteDialog author={del} options={p.everyone.filter((o) => o.id !== del.id)} onClose={() => setDel(null)} />}
    </Panel>
  );
}

type Option = { id: number; name: string };
type Usage = { total: number; published: number; titles: string[] };
function DeleteDialog({ author, options, onClose }: { author: AuthorTableRow; options: Option[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    ref.current?.showModal();
    let live = true;
    authorUsageAction(author.id).then(async (r) => {
      if (!live) return;
      if (r.ok) setUsage(r); else setErr(r.error);
    });
    return () => { live = false; };
  }, [author.id]);

  const needsTarget = !!usage && usage.total > 0;
  const confirm = () => start(async () => {
    setErr("");
    const r = await deleteAuthorAction(author.id, needsTarget ? Number(target) || null : null);
    if (r.ok) { toast(true, needsTarget ? "Articles reassigned and author deleted." : "Author deleted."); onClose(); router.refresh(); } else setErr(r.error);
  });

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="del-title" className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-sand-200 bg-white p-0 text-forest-700 shadow-xl backdrop:bg-forest-900/50">
      <div className="space-y-4 p-6">
        <h2 id="del-title" className="text-lg font-bold text-forest-900">Delete {author.name}?</h2>
        {!usage && !err && <p className="text-sm">Checking which articles use this author…</p>}
        {usage && usage.total === 0 && <p className="text-sm">No article uses this profile. Deleting it also removes its public page. This cannot be undone.</p>}
        {needsTarget && usage && (
          <div className="space-y-3 text-sm">
            <p><strong className="text-forest-900">{usage.total} article{usage.total === 1 ? "" : "s"}</strong> use this author ({usage.published} published). Choose who takes them over. Their public bylines update right away.</p>
            <ul className="list-disc pl-5">{usage.titles.map((t, i) => <li key={i}>{t}</li>)}{usage.total > usage.titles.length && <li>and {usage.total - usage.titles.length} more</li>}</ul>
            <div>
              <label htmlFor="reassign" className="mb-1 block font-semibold text-forest-900">New author</label>
              <select id="reassign" value={target} onChange={(e) => setTarget(e.target.value)} className="h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm">
                <option value="">Choose an author</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {options.length === 0 && <p className="mt-1 text-xs">There is no other author. Add another author first.</p>}
            </div>
          </div>
        )}
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => ref.current?.close()}>Cancel</Button>
          <Button type="button" disabled={pending || !usage || (needsTarget && !target)} onClick={confirm}>{needsTarget ? "Reassign and delete" : "Delete author"}</Button>
        </div>
      </div>
    </dialog>
  );
}
