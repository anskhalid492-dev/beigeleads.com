"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendTestEmailAction } from "@/app/admin/settings/actions";

export function TestEmailButton() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3 p-5">
      <p className="text-sm">Sends one test message to <b>your own</b> sign-in address, using the saved sender name and reply-to. Save your changes first.</p>
      <Button type="button" disabled={pending} onClick={() => start(async () => { setMsg(null); const r = await sendTestEmailAction(); setMsg(r.ok ? { ok: true, text: `The email service accepted a test email for ${r.to}. Check that inbox (and spam).` } : { ok: false, text: r.error }); })}>{pending ? "Sending…" : "Send test email"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${msg.ok ? "bg-forest-100 text-forest-900" : "bg-red-50 text-red-800"}`}>{msg.text}</p>}
      <p className="text-xs">&ldquo;Accepted&rdquo; means Resend took the message. It does not prove the inbox received it.</p>
    </div>
  );
}
