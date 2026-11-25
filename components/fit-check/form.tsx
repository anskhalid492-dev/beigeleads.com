"use client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <form onSubmit={go} className="rounded-[1.75rem] border border-sand-300 bg-white p-3 shadow-[0_1px_0_rgba(15,42,29,0.04)] focus-within:border-forest-900">
      <label htmlFor="fit" className="sr-only">Who is your ideal customer? One sentence.</label>
      <textarea id="fit" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={3} maxLength={300} className="block w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-lg text-forest-900 placeholder:text-forest-700/50 focus:outline-none" placeholder="Independent dentists in Texas with a website…" />
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {EXAMPLES.map((x) => <button key={x} type="button" onClick={() => setText(x)} className="rounded-full border border-sand-300 bg-sand-50 px-3 py-1.5 text-forest-700 transition-colors hover:border-forest-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-purple-600">{x}</button>)}
        </div>
        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
          Check the fit <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      {err && <p role="alert" className="px-4 pb-2 text-sm font-medium text-red-800">{err}</p>}
    </form>
  );
}
