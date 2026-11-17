"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveLinkAction, type ActionState } from "./actions";

export function LinkForm({ product, pkg, label, current }: { product: string; pkg: string; label: string; current: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveLinkAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 py-3">
      <input type="hidden" name="product" value={product} />
      <input type="hidden" name="pkg" value={pkg} />
      <label className="w-40 shrink-0 text-sm font-semibold text-forest-900" htmlFor={`u-${product}-${pkg}`}>{label}</label>
      <input id={`u-${product}-${pkg}`} name="url" type="url" defaultValue={current} placeholder="https://..." className="min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" />
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      {state && <span role="status" className={`w-full text-sm ${state.ok ? "text-forest-500" : "text-red-700"}`}>{state.message}</span>}
    </form>
  );
}
