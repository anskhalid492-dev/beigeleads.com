"use client";
import { useRouter } from "next/navigation";
import { KINDS, catHref as catHrefOf, type Kind } from "@/lib/blog/kind";
import { useRef, useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { categoryAction, tagAction } from "../actions";

const input = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";

type Cat = { id: number; name: string; slug: string; description: string; seoTitle: string; metaDescription: string; posts: number };
type Tag = { id: number; name: string; slug: string; posts: number };

export function CategoryManager({ cats, kind = "blog" }: { cats: Cat[]; kind?: Kind }) {
  const base = catHrefOf(kind, "");
  const [edit, setEdit] = useState<Cat | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const run = (fd: FormData, done: string) => start(async () => {
    const r = await categoryAction(fd);
    if (r.ok) { toast(true, done); setEdit(null); ref.current?.reset(); router.refresh(); } else toast(false, r.error);
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white text-sm">
        {cats.length === 0 && <li className="p-6 text-center">No categories yet. Add the first one.</li>}
        {cats.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0"><p className="font-semibold text-forest-900">{c.name}</p><p className="text-xs">{base}{c.slug} · {c.posts} {c.posts === 1 ? KINDS[kind].one : KINDS[kind].many}</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEdit(c)}>Edit</Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => { if (confirm(`Delete the category “${c.name}”?`)) { const fd = new FormData(); fd.set("intent", "delete"); fd.set("id", String(c.id)); run(fd, "Category deleted."); } }}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
      <form key={edit?.id ?? "new"} ref={ref} action={(fd) => run(fd, edit ? "Category saved." : "Category added.")} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4">
        <h2 className="font-bold text-forest-900">{edit ? "Edit category" : "Add a category"}</h2>
        <input type="hidden" name="kind" value={kind} />
        {edit && <input type="hidden" name="id" value={edit.id} />}
        <div><label htmlFor="cn" className="mb-1 block text-sm font-semibold">Name</label><input id="cn" name="name" required defaultValue={edit?.name} className={input} /></div>
        <div><label htmlFor="cs" className="mb-1 block text-sm font-semibold">Slug</label><input id="cs" name="slug" defaultValue={edit?.slug} placeholder="Made from the name if empty" className={input} /></div>
        <div><label htmlFor="cd" className="mb-1 block text-sm font-semibold">Description</label><textarea id="cd" name="description" rows={3} defaultValue={edit?.description} className="w-full rounded-xl border border-sand-300 p-3 text-sm" /></div>
        <div><label htmlFor="ct" className="mb-1 block text-sm font-semibold">SEO title</label><input id="ct" name="seoTitle" defaultValue={edit?.seoTitle} className={input} /></div>
        <div><label htmlFor="cm" className="mb-1 block text-sm font-semibold">Meta description</label><textarea id="cm" name="metaDescription" rows={2} defaultValue={edit?.metaDescription} className="w-full rounded-xl border border-sand-300 p-3 text-sm" /></div>
        <div className="flex gap-2"><Button type="submit" disabled={pending}>{edit ? "Save category" : "Add category"}</Button>{edit && <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>}</div>
      </form>
    </div>
  );
}

export function TagManager({ tags }: { tags: Tag[] }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const run = (fd: FormData, done: string) => start(async () => {
    const r = await tagAction(fd);
    if (r.ok) { toast(true, done); ref.current?.reset(); router.refresh(); } else toast(false, r.error);
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="flex flex-wrap gap-2 rounded-2xl border border-sand-200 bg-white p-5 text-sm">
        {tags.length === 0 && <li>No tags yet.</li>}
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-full border border-sand-300 py-1 pl-3 pr-1">
            <span className="font-semibold text-forest-900">{t.name}</span><span className="text-xs">{t.posts}</span>
            <button type="button" aria-label={`Delete tag ${t.name}`} disabled={pending} className="grid size-6 place-items-center rounded-full hover:bg-sand-100" onClick={() => { if (confirm(`Delete the tag “${t.name}”? It is removed from ${t.posts} article(s).`)) { const fd = new FormData(); fd.set("intent", "delete"); fd.set("id", String(t.id)); run(fd, "Tag deleted."); } }}>×</button>
          </li>
        ))}
      </ul>
      <form ref={ref} action={(fd) => run(fd, "Tag added.")} className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4">
        <h2 className="font-bold text-forest-900">Add a tag</h2>
        <div><label htmlFor="tn" className="mb-1 block text-sm font-semibold">Name</label><input id="tn" name="name" required className={input} /></div>
        <Button type="submit" disabled={pending}>Add tag</Button>
      </form>
    </div>
  );
}
