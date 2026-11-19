"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { importGeoAction, type ImportState } from "./actions";

export function ImportForm({ countries }: { countries: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importGeoAction, null);
  return (
    <form action={action} className="space-y-4 p-5">
      <div><label htmlFor="g-c" className="mb-1 block text-xs font-bold text-forest-900">Country</label>
        <select id="g-c" name="country" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm">{countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div><label htmlFor="g-t" className="mb-1 block text-xs font-bold text-forest-900">CSV (first line: region,city,category,records)</label>
        <textarea id="g-t" name="csv" rows={8} className="w-full rounded-xl border border-sand-300 bg-white p-3 font-mono text-xs" placeholder={"region,city,category,records\nAlabama,Birmingham,dentists,1200\nAlabama,,dentists,5400"} /></div>
      <p className="text-xs">Use REAL record counts only. A page is indexable only when its count is above 0. Leave city empty for a state total, or region empty for a city without a state. Importing never deletes anything and can be repeated.</p>
      <div className="flex gap-3">
        <Button type="submit" name="dry" value="1" variant="secondary" disabled={pending}>Check the file</Button>
        <Button type="submit" disabled={pending}>Import</Button>
      </div>
      {state && <div role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-forest-100 text-forest-900" : "bg-red-50 text-red-900"}`}><p className="font-semibold">{state.message}</p>{state.errors && <ul className="mt-2 list-disc pl-5">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
    </form>
  );
}
