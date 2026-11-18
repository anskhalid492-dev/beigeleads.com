"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AuthorAvatar } from "@/components/blog/avatar";
import { Button } from "@/components/ui/button";
import { quickCreateAuthorAction } from "../../authors/actions";

export type AuthorOption = { id: number; name: string; title: string; photo: string | null; status: "draft" | "published" };
const input = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";

/** Searchable author list. Creating an author here only adds a draft profile; the article being written is untouched. */
export function AuthorPicker({ authors, authorId, legacyName, canCreate, onPick, onLegacy }: {
  authors: AuthorOption[]; authorId: number | null; legacyName: string; canCreate: boolean;
  onPick: (a: AuthorOption | null) => void; onLegacy: (name: string) => void;
}) {
  const [list, setList] = useState(authors);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const current = list.find((a) => a.id === authorId) ?? null;
  const shown = list.filter((a) => `${a.name} ${a.title}`.toLowerCase().includes(q.trim().toLowerCase()));

  const create = () => start(async () => {
    setErr("");
    const r = await quickCreateAuthorAction(name, title);
    if (!r.ok) return setErr(r.error);
    setList((l) => [...l, r.author].sort((a, b) => a.name.localeCompare(b.name)));
    onPick(r.author);
    setName(""); setTitle(""); setOpen(false);
  });

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="author-search" className="mb-1 block text-sm font-semibold text-forest-900">Author</label>
        {current ? (
          <div className="flex items-center gap-3 rounded-xl border border-forest-500 bg-forest-100 p-2">
            <AuthorAvatar photo={current.photo} name={current.name} size={36} />
            <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold text-forest-900">{current.name}</p><p className="truncate text-xs">{current.title || "No title"}{current.status === "draft" && " · profile is a draft (no public page yet)"}</p></div>
            <Button type="button" size="sm" variant="secondary" onClick={() => onPick(null)}>Change</Button>
          </div>
        ) : (
          <>
            <input id="author-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search authors" className={input} autoComplete="off" />
            <ul aria-label="Authors" className="mt-2 max-h-52 divide-y divide-sand-200 overflow-auto rounded-xl border border-sand-200 bg-white text-sm">
              {shown.length === 0 && <li className="p-3 text-xs">{list.length === 0 ? "No authors yet." : "No author matches."}</li>}
              {shown.map((a) => (
                <li key={a.id}><button type="button" onClick={() => onPick(a)} className="flex w-full items-center gap-3 p-2 text-left hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-purple-600">
                  <AuthorAvatar photo={a.photo} name={a.name} size={32} /><span className="min-w-0"><span className="block truncate font-semibold text-forest-900">{a.name}</span><span className="block truncate text-xs">{a.title || "No title"}</span></span>
                </button></li>
              ))}
            </ul>
          </>
        )}
      </div>

      {!current && (
        <div>
          <label htmlFor="author-legacy" className="mb-1 block text-xs font-semibold text-forest-900">Byline name without a profile</label>
          <input id="author-legacy" value={legacyName} maxLength={120} onChange={(e) => onLegacy(e.target.value)} className={input} />
          <p className="mt-1 text-xs">{legacyName ? "This article keeps its older plain-text name. Choose an author above to link it to a profile." : "No author set. Choose one above."}</p>
        </div>
      )}

      {canCreate && (
        <div className="rounded-xl border border-sand-200 p-3">
          {!open ? <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold underline">Add a new author</button> : (
            <div className="space-y-2">
              <p className="text-xs">Creates a draft profile and keeps your article as it is. Add the photo and bio later under <Link href="/admin/blog/authors" target="_blank" className="underline">Authors</Link>.</p>
              <div><label htmlFor="qa-name" className="mb-1 block text-xs font-semibold text-forest-900">Full name</label><input id="qa-name" value={name} onChange={(e) => setName(e.target.value)} className={input} maxLength={120} /></div>
              <div><label htmlFor="qa-title" className="mb-1 block text-xs font-semibold text-forest-900">Professional title</label><input id="qa-title" value={title} onChange={(e) => setTitle(e.target.value)} className={input} maxLength={120} /></div>
              {err && <p role="alert" className="text-xs font-semibold text-red-800">{err}</p>}
              <div className="flex gap-2"><Button type="button" size="sm" disabled={pending || name.trim().length < 2} onClick={create}>{pending ? "Adding…" : "Add author"}</Button><Button type="button" size="sm" variant="secondary" onClick={() => { setOpen(false); setErr(""); }}>Cancel</Button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
