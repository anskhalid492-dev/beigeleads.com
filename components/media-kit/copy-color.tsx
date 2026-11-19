"use client";
import { useState } from "react";

export function CopyColor({ name, hex, use }: { name: string; hex: string; use: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center gap-4 rounded-2xl border border-sand-200 bg-white p-3 text-left transition hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
    >
      <span className="size-14 shrink-0 rounded-xl border border-sand-200" style={{ background: hex }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-forest-900">{name}</span>
        <span className="block text-sm">{use}</span>
      </span>
      <span className="shrink-0 text-right text-sm">
        <span className="block font-mono text-forest-900">{hex}</span>
        <span className="block text-forest-500" role="status" aria-live="polite">
          {state === "copied" ? "Copied" : state === "failed" ? "Copy failed, select the code" : "Click to copy"}
        </span>
      </span>
    </button>
  );
}
