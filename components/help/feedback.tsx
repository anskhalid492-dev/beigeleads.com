"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

type State = "idle" | "sending" | "thanks-yes" | "thanks-no" | "error";

export function Feedback({ articleId }: { articleId: string }) {
  const key = `bl-help-vote:${articleId}`;
  const [local, setState] = useState<State>("idle");
  // A vote already given in this browser (storage may be blocked: then voting still works, just without memory).
  const stored = useSyncExternalStore(
    (cb) => { window.addEventListener("bl-vote", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("bl-vote", cb); window.removeEventListener("storage", cb); }; },
    () => { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } },
    () => "",
  );
  const state: State = stored ? (stored === "1" ? "thanks-yes" : "thanks-no") : local;
  async function vote(helpful: boolean) {
    setState("sending");
    try {
      const r = await fetch("/api/help/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article: articleId, helpful }) });
      if (!r.ok) throw new Error();
      try { localStorage.setItem(key, helpful ? "1" : "0"); window.dispatchEvent(new Event("bl-vote")); } catch { /* ignore */ }
      setState(helpful ? "thanks-yes" : "thanks-no");
    } catch { setState("error"); }
  }
  const btn = "inline-flex h-10 items-center gap-2 rounded-full border border-sand-300 bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-60";
  return (
    <section aria-labelledby="fb" className="mt-10 rounded-2xl border border-sand-200 bg-white p-6">
      {state === "thanks-yes" && <p role="status" className="font-bold text-forest-900">Thanks for the feedback. Glad it helped.</p>}
      {state === "thanks-no" && (
        <div role="status">
          <p className="font-bold text-forest-900">Thanks. Sorry this did not answer your question.</p>
          <p className="mt-1 text-base">Send us a message and we will help directly.</p>
          <Link href="/contact" className="mt-3 inline-flex h-10 items-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700">Contact support</Link>
        </div>
      )}
      {(state === "idle" || state === "sending" || state === "error") && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="fb" className="font-bold text-forest-900">Was this article helpful?</p>
          <div className="flex gap-2">
            <button type="button" className={btn} disabled={state === "sending"} onClick={() => vote(true)}><ThumbsUp className="size-4" aria-hidden /> Yes</button>
            <button type="button" className={btn} disabled={state === "sending"} onClick={() => vote(false)}><ThumbsDown className="size-4" aria-hidden /> No</button>
          </div>
          {state === "error" && <p role="alert" className="w-full text-sm text-red-800">Could not save your answer. Try again in a moment.</p>}
        </div>
      )}
    </section>
  );
}
