"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveBuilderAction } from "../actions";
export function BuilderForm({ enabled, excluded }: { enabled: boolean; excluded: string }) {
  const [r, run, p] = useActionState(saveBuilderAction, null as { ok: true; message: string } | { ok: false; error: string } | null);
  return (
    <form action={run} className="max-w-xl space-y-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" name="enabled" defaultChecked={enabled} /> Show the builder on /bundles</label>
      <label className="block text-sm font-semibold text-forest-900">Products visitors cannot pick (URL names, one per line)
        <textarea name="excluded" rows={6} defaultValue={excluded} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" /></label>
      <Button type="submit" disabled={p}>{p ? "Saving…" : "Save"}</Button>
      {r && <p role={r.ok ? "status" : "alert"} className={`text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p>}
    </form>
  );
}
