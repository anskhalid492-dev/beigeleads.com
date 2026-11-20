"use client";
import { useState } from "react";
import { importBuiltinAction } from "../import/actions";

/** Copies the products defined in code into the database so they can be edited like the others. Safe to press again. */
export function BuiltinButton() {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={busy} className="text-sm underline disabled:opacity-40" onClick={async () => { setBusy(true); setMsg("Working..."); try { const r = await importBuiltinAction(); setMsg(r.message); if (r.ok) setTimeout(() => location.reload(), 1200); } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); } setBusy(false); }}>Make built-in products editable</button>
      {msg && <span role="status" className="text-xs font-semibold">{msg}</span>}
    </span>
  );
}
