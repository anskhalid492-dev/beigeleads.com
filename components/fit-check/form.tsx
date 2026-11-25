"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { openPilo } from "@/components/beigepilot/open";

const EXAMPLES = ["Dentists in Texas with a website", "Restaurant owners in Germany", "Ski shops in the United States"];

/** Sends the sentence to Pilo (which searches the REAL catalog). If the assistant is not running, falls back to the plain catalog search. */
export function FitCheckForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (t.length < 5) { setErr("Describe who you want to reach in a few words."); return; }
    setErr("");
    const ok = openPilo({ ask: `List fit check: ${t}` });
    if (!ok) router.push(`/lists?q=${encodeURIComponent(t)}`);
  }
  return (
    <form onSubmit={go} className="space-y-3">
      <label htmlFor="fit" className="block text-sm font-semibold text-forest-900">Who is your ideal customer? (one sentence)</label>
      <textarea id="fit" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={300} className="w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600" placeholder="e.g. Independent dentists in Texas" />
      <div className="flex flex-wrap gap-2 text-xs">
        {EXAMPLES.map((x) => <button key={x} type="button" onClick={() => setText(x)} className="rounded-full border border-sand-300 bg-white px-3 py-1 text-forest-700 hover:border-forest-900">{x}</button>)}
      </div>
      {err && <p role="alert" className="text-sm font-medium text-red-800">{err}</p>}
      <Button type="submit" size="lg">Check the fit</Button>
    </form>
  );
}
