"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setEnabledAction } from "../actions";

export function EnableToggle({ tkey, enabled }: { tkey: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm">
      <p><strong className="text-forest-900">{on ? "This email is switched on." : "This email is switched off."}</strong> {on ? "It is sent automatically when its event happens." : "Nothing is sent for this event until you switch it back on. Decisions in Partner Requests still work."}</p>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => {
        const r = await setEnabledAction(tkey, !on);
        if (r.ok) { setOn(!on); setMsg(""); } else setMsg(r.error);
      })}>{pending ? "Saving…" : on ? "Switch off" : "Switch on"}</Button>
      {msg && <p role="alert" className="w-full text-red-800">{msg}</p>}
    </div>
  );
}
