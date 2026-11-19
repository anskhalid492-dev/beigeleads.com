"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/help/icons";
import { deleteCategoryAction, moveCategoryAction, saveCategoryAction } from "../actions";

export type Topic = { id?: number; slug: string; name: string; description: string; icon: string; status: "published" | "hidden"; articles: number };
const ICONS = ["rocket", "database", "tag", "wallet", "download", "shield", "list", "scale", "life-buoy"];
const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function TopicManager({ topics }: { topics: Topic[] }) {
  return (
    <div className="space-y-4">
      {topics.map((t, i) => <TopicForm key={t.id} topic={t} first={i === 0} last={i === topics.length - 1} />)}
      <TopicForm topic={{ slug: "", name: "", description: "", icon: "rocket", status: "published", articles: 0 }} fresh />
    </div>
  );
}

function TopicForm({ topic, first, last, fresh }: { topic: Topic; first?: boolean; last?: boolean; fresh?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [t, setT] = useState(topic);
  const [touched, setTouched] = useState(!fresh);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const p = (x: Partial<Topic>) => setT((c) => ({ ...c, ...x }));
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    const r = await fn();
    toast(r.ok, r.ok ? ok : (r.error ?? "Failed."));
    if (r.ok) { after?.(); router.refresh(); }
  });
  const dirty = JSON.stringify(t) !== JSON.stringify(topic);
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-5" aria-label={fresh ? "Add a topic" : `Topic ${topic.name}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-forest-900">{fresh ? "Add a topic" : <><span className="grid size-8 place-items-center rounded-lg bg-forest-100 text-forest-700"><CategoryIcon name={t.icon} className="size-4" /></span>{topic.name}<span className="text-xs font-normal">{topic.articles} articles</span></>}</h2>
        {!fresh && <span className="flex gap-1.5">
          <button type="button" aria-label="Move topic up" disabled={pending || first} onClick={() => act(() => moveCategoryAction(topic.id!, "up"), "Moved up.")} className="grid size-8 place-items-center rounded-lg border border-sand-300 hover:bg-sand-100 disabled:opacity-40"><ArrowUp className="size-4" /></button>
          <button type="button" aria-label="Move topic down" disabled={pending || last} onClick={() => act(() => moveCategoryAction(topic.id!, "down"), "Moved down.")} className="grid size-8 place-items-center rounded-lg border border-sand-300 hover:bg-sand-100 disabled:opacity-40"><ArrowDown className="size-4" /></button>
        </span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-semibold text-forest-900">Name<input className={`${input} mt-1 font-normal`} maxLength={80} value={t.name} onChange={(e) => p({ name: e.target.value, ...(touched ? {} : { slug: slugify(e.target.value) }) })} /></label></div>
        <div><label className="mb-1 block text-sm font-semibold text-forest-900">Slug<input className={`${input} mt-1 font-normal`} disabled={!fresh && topic.articles > 0} value={t.slug} onChange={(e) => { setTouched(true); p({ slug: slugify(e.target.value) }); }} /></label></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold text-forest-900">Description<input className={`${input} mt-1 font-normal`} maxLength={240} value={t.description} onChange={(e) => p({ description: e.target.value })} /></label></div>
        <div><label className="mb-1 block text-sm font-semibold text-forest-900">Icon<select className={`${input} mt-1 font-normal`} value={t.icon} onChange={(e) => p({ icon: e.target.value })}>{ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></label></div>
        <div><label className="mb-1 block text-sm font-semibold text-forest-900">Visibility<select className={`${input} mt-1 font-normal`} value={t.status} onChange={(e) => p({ status: e.target.value as Topic["status"] })}><option value="published">Visible on the site</option><option value="hidden">Hidden (its articles disappear too)</option></select></label></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={pending || (!fresh && !dirty)} onClick={() => act(() => saveCategoryAction({ id: topic.id, slug: t.slug, name: t.name, description: t.description, icon: t.icon, status: t.status }), fresh ? "Topic added." : "Topic saved.", () => { if (fresh) { setT(topic); setTouched(false); } })}>{fresh ? "Add topic" : "Save"}</Button>
        {!fresh && (confirm ? (
          <>
            <button type="button" disabled={pending} onClick={() => act(() => deleteCategoryAction(topic.id!), "Topic deleted.")} className="inline-flex h-9 items-center rounded-full border border-red-300 px-4 text-sm font-semibold text-red-800">Yes, delete</button>
            <button type="button" onClick={() => setConfirm(false)} className="inline-flex h-9 items-center rounded-full border border-sand-300 px-4 text-sm font-semibold">Cancel</button>
          </>
        ) : <button type="button" onClick={() => setConfirm(true)} className="inline-flex h-9 items-center rounded-full border border-sand-300 px-4 text-sm font-semibold hover:bg-sand-100">Delete</button>)}
        {!fresh && topic.articles > 0 && <span className="text-xs">A topic with articles cannot be deleted or renamed in the address.</span>}
      </div>
    </section>
  );
}
