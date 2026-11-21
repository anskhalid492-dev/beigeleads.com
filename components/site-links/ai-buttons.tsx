"use client";
import { useRef, useState } from "react";
import { aiAction, aiMessage, type AiPlatform } from "@/lib/site-links/types";
import { Glyph } from "./icons";

/** Five (or fewer) AI shortcuts. Prefills only with a verified template; otherwise copies the prompt and opens the platform. Never auto-submits. */
export function AiButtons({ platforms, prompt, preview = false }: { platforms: AiPlatform[]; prompt: string; preview?: boolean }) {
  const [msg, setMsg] = useState(""); const [shown, setShown] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!platforms.length) return null;

  async function go(p: AiPlatform) {
    const a = aiAction(p, prompt);
    let copyDone: Promise<boolean> = Promise.resolve(false);
    if (a.kind === "copy_open") copyDone = navigator.clipboard?.writeText ? navigator.clipboard.writeText(a.prompt).then(() => true, () => false) : Promise.resolve(false);
    if (!preview) window.open(a.url, "_blank", "noopener,noreferrer"); // inside the click, so popup blockers allow it
    const copied = await copyDone;
    setMsg(aiMessage(p.name, a, copied)); setShown(a.kind === "copy_open" && !copied ? a.prompt : "");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 9000);
  }

  return (
    <div>
      <ul className="flex flex-wrap items-center gap-2.5">
        {platforms.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => go(p)} aria-label={`Ask ${p.name} about BeigeLeads (opens in a new tab)`} title={`Ask ${p.name}`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-sand-50/10 px-4 text-sm font-semibold text-sand-50 ring-1 ring-sand-50/15 transition hover:bg-sand-50 hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 motion-reduce:transition-none">
              <Glyph name={p.icon} className="h-4 w-4" />{p.name}
            </button>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="mt-2 max-w-sm text-xs opacity-90">{msg}</p>
      {shown && <textarea readOnly value={shown} rows={4} aria-label="Prompt to copy" onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full max-w-sm rounded-lg border border-sand-200 bg-white p-2 text-left text-xs text-forest-900" />}
    </div>
  );
}
