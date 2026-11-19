"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { createStarterAction } from "./actions";

export function StarterRow(p: { kind: "blog" | "guide"; slug: string; title: string; excerpt: string; category: string; existingId: number | null; authors: { id: number; name: string; title: string }[] }) {
  const [author, setAuthor] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const add = () => start(async () => {
    const r = await createStarterAction(p.slug, author ? Number(author) : null);
    if (!r.ok) return toast(false, r.error);
    toast(true, "Draft created.");
    router.push(`/admin/${p.kind === "guide" ? "guides" : "blog"}/${r.id}/edit`);
  });
  return (
    <div className="space-y-3 p-5">
      <div><p className="text-lg font-bold text-forest-900">{p.title}</p><p className="text-xs">/{p.kind === "guide" ? "guides" : "blog"}/{p.slug} · {p.category}</p><p className="mt-2 text-sm">{p.excerpt}</p></div>
      {p.existingId ? (
        <p className="text-sm">Already added. <Link className="font-semibold underline" href={`/admin/${p.kind === "guide" ? "guides" : "blog"}/${p.existingId}/edit`}>Open it in the editor</Link>.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={`a-${p.slug}`} className="mb-1 block text-sm font-semibold text-forest-900">Author (a real profile)</label>
            <select id={`a-${p.slug}`} value={author} onChange={(e) => setAuthor(e.target.value)} className="h-10 w-72 max-w-full rounded-xl border border-sand-300 bg-white px-3 text-sm">
              <option value="">Choose later in the editor</option>
              {p.authors.map((a) => <option key={a.id} value={a.id}>{a.name}{a.title ? `, ${a.title}` : ""}</option>)}
            </select>
          </div>
          <Button type="button" disabled={pending} onClick={add}>{pending ? "Creating…" : "Create draft"}</Button>
        </div>
      )}
    </div>
  );
}
