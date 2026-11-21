"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteAction, duplicateAction, statusAction } from "./actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
type Act = (prev: unknown, form: FormData) => Promise<NonNullable<Res>>;
function One({ action, id, label, extra, confirm, variant = "secondary" }: { action: Act; id: number; label: string; extra?: Record<string, string>; confirm?: string; variant?: "primary" | "secondary" }) {
  const [r, run, pending] = useActionState(action, null as Res);
  return (
    <form action={run} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }} className="inline-block">
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>{pending ? "…" : label}</Button>
      {r && <p role={r.ok ? "status" : "alert"} className={`mt-1 max-w-[16rem] text-xs font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p>}
    </form>
  );
}
export function BundleRowActions({ id, status }: { id: number; status: string }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Button asChild size="sm" variant="secondary"><Link href={`/admin/bundles/${id}`}>Edit</Link></Button>
      <Button asChild size="sm" variant="secondary"><Link href={`/admin/bundles/${id}/preview`}>Preview</Link></Button>
      {status === "published"
        ? <One action={statusAction} id={id} label="Unpublish" extra={{ status: "draft" }} confirm="Unpublish this bundle? It disappears from the site within a minute. Carts already holding it will say it is unavailable." />
        : <One action={statusAction} id={id} label="Publish" extra={{ status: "published" }} variant="primary" confirm="Publish this bundle? It goes live within a minute." />}
      <One action={duplicateAction} id={id} label="Duplicate" />
      <One action={deleteAction} id={id} label="Delete" confirm="Delete this bundle permanently? A bundle that has orders cannot be deleted; unpublish it instead." />
    </div>
  );
}
