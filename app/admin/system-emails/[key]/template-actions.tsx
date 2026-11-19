"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { deleteCopyAction, duplicateAction } from "../actions";

const small = "inline-flex h-8 items-center rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-forest-900 hover:bg-sand-100 disabled:opacity-40";

export function TemplateActions({ tkey, name, copy, locked }: { tkey: string; name: string; copy: boolean; locked: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button type="button" className={small} disabled={pending || locked} title={locked ? "Needs migration 0023" : undefined} onClick={() => start(async () => {
        const r = await duplicateAction(tkey, `${name} (copy)`);
        toast(r.ok, r.ok ? "Copy created. It is your own template; no event sends it." : r.error);
        if (r.ok) router.push(`/admin/system-emails/${r.key}`);
      })}>Duplicate</button>
      {copy && (confirm
        ? <><button type="button" className={small} disabled={pending} onClick={() => start(async () => { const r = await deleteCopyAction(tkey); toast(r.ok, r.ok ? "Copy deleted." : r.error); if (r.ok) router.push("/admin/system-emails"); })}>Yes, delete this copy</button><button type="button" className={small} onClick={() => setConfirm(false)}>Cancel</button></>
        : <button type="button" className={small} onClick={() => setConfirm(true)}>Delete copy</button>)}
    </>
  );
}
