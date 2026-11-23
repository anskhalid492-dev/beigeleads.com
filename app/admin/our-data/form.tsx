"use client";
import { useActionState } from "react";
import { ourDataAction } from "./actions";
import { Button } from "@/components/ui/button";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
export function OurDataForm({ children }: { children: React.ReactNode }) {
  const [r, run, pending] = useActionState(ourDataAction, null as Res);
  return (
    <form action={run}>
      {children}
      <Button type="submit" className="mt-4" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      {r && <p role={r.ok ? "status" : "alert"} className={`mt-2 text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p>}
    </form>
  );
}
