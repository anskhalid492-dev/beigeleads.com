"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { sendTestAction } from "./actions";

export function TestSend({ options }: { options: { key: string; name: string; content: unknown }[] }) {
  const toast = useToast();
  const [key, setKey] = useState(options[0]?.key ?? "");
  const [testTo, setTestTo] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3 p-5">
      <select className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" aria-label="Template" value={key} onChange={(e) => setKey(e.target.value)}>{options.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}</select>
      
      <input type="email" aria-label="Send test to" placeholder="Send test to (blank = me)" className="min-w-[12rem] rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-sm" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
      <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await sendTestAction(key, options.find((o) => o.key === key)?.content, testTo); toast(r.ok, r.ok ? `Test sent to ${r.to}.` : r.error); })}>Send test</Button>
      <p className="w-full text-xs">Tests go only to the address you are signed in with (10 per hour), use example values, and carry a visible test banner. The live version is sent.</p>
    </div>
  );
}
