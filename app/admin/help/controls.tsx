"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { articleStatusAction, deleteArticleAction, importBuiltInAction, moveArticleAction } from "./actions";

const small = "inline-flex h-8 items-center rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100 disabled:opacity-40";

export function ArticleRowActions({ id, status, first, last }: { id: number; status: "draft" | "published"; first: boolean; last: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    const r = await fn();
    toast(r.ok, r.ok ? ok : (r.error ?? "Failed."));
    if (r.ok) router.refresh();
  });
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`/admin/help/articles/${id}`} className={small}>Edit</Link>
      <button type="button" className={small} disabled={pending} onClick={() => run(() => articleStatusAction(id, status === "published" ? "draft" : "published"), status === "published" ? "Unpublished." : "Published. It can take up to a minute to appear.")}>{status === "published" ? "Unpublish" : "Publish"}</button>
      <button type="button" className={small} aria-label="Move up" disabled={pending || first} onClick={() => run(() => moveArticleAction(id, "up"), "Moved up.")}><ArrowUp className="size-3.5" /></button>
      <button type="button" className={small} aria-label="Move down" disabled={pending || last} onClick={() => run(() => moveArticleAction(id, "down"), "Moved down.")}><ArrowDown className="size-3.5" /></button>
      {confirm ? (
        <>
          <button type="button" className={`${small} border-red-300 text-red-800`} disabled={pending} onClick={() => run(() => deleteArticleAction(id), "Article deleted.")}>Yes, delete</button>
          <button type="button" className={small} onClick={() => setConfirm(false)}>Cancel</button>
        </>
      ) : <button type="button" className={small} onClick={() => setConfirm(true)}>Delete</button>}
    </div>
  );
}

export function ImportButton({ label = "Import the built-in articles" }: { label?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" disabled={pending} onClick={() => start(async () => {
      const r = await importBuiltInAction();
      if (!r.ok) { toast(false, r.error); return; }
      const x = (r as unknown as { result: { categories: number; articles: number; skipped: number } }).result;
      toast(true, `Imported ${x.articles} articles and ${x.categories} topics${x.skipped ? ` (${x.skipped} already existed)` : ""}.`);
      router.refresh();
    })}>{pending ? "Importing…" : label}</Button>
  );
}
