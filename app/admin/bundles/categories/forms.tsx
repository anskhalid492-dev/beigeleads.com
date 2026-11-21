"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction, saveCategoryAction } from "../actions";
type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const inp = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
function Msg({ r }: { r: Res }) { return r ? <p role={r.ok ? "status" : "alert"} className={`text-xs font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p> : null; }
function Row({ c }: { c?: { id: number; name: string; sortOrder: number } }) {
  const [r, run, p] = useActionState(saveCategoryAction, null as Res);
  const [d, del, dp] = useActionState(deleteCategoryAction, null as Res);
  return (
    <li className="flex flex-wrap items-start gap-2 py-3">
      <form action={run} className="flex flex-wrap items-center gap-2">
        {c && <input type="hidden" name="id" value={c.id} />}
        <input name="name" required defaultValue={c?.name ?? ""} placeholder="Category name" aria-label="Category name" maxLength={40} className={inp} />
        <input name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} aria-label="Order" className={`${inp} w-20`} />
        <Button type="submit" size="sm" disabled={p}>{c ? "Save" : "Add category"}</Button>
        <Msg r={r} />
      </form>
      {c && <form action={del} onSubmit={(e) => { if (!window.confirm("Delete this category? Bundles in it become uncategorised.")) e.preventDefault(); }}><input type="hidden" name="id" value={c.id} /><Button type="submit" size="sm" variant="secondary" disabled={dp}>Delete</Button><Msg r={d} /></form>}
    </li>
  );
}
export function CategoryForms({ cats }: { cats: { id: number; name: string; sortOrder: number }[] }) {
  return <ul className="divide-y divide-sand-200">{cats.map((c) => <Row key={c.id} c={c} />)}<Row /></ul>;
}
