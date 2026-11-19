"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Empty, Panel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { excludePathAction, includePathAction } from "../actions";

export function SitemapManager({ excluded }: { excluded: string[] }) {
  const [path, setPath] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const fin = (r: { ok: boolean; error?: string }, m: string) => { toast(r.ok, r.ok ? m : (r.error ?? "Failed")); if (r.ok) router.refresh(); return r.ok; };
  return (
    <Panel title="Excluded pages" className="mt-6">
      <form className="flex flex-wrap items-end gap-3 p-5" onSubmit={(e) => { e.preventDefault(); start(async () => { if (fin(await excludePathAction(path), "Page excluded from the sitemap")) setPath(""); }); }}>
        <div className="min-w-60 flex-1"><label htmlFor="ep" className="mb-1 block text-sm font-semibold text-forest-900">Page path</label><input id="ep" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/compare/beigeleads-vs-apollo" className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" required /></div>
        <Button type="submit" disabled={pending}>Exclude page</Button>
      </form>
      {excluded.length === 0 ? <Empty title="Nothing excluded" text="Every eligible page is in the sitemap." /> : (
        <ul className="divide-y divide-sand-200 border-t border-sand-200 text-sm">{excluded.map((p) => (
          <li key={p} className="flex items-center justify-between gap-3 px-5 py-3"><span className="font-mono text-xs">{p}</span><Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { fin(await includePathAction(p), "Page added back"); })}>Add back</Button></li>
        ))}</ul>
      )}
    </Panel>
  );
}
