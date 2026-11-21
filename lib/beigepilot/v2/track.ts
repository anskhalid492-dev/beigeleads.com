"use client";
// Anonymous Pilo analytics from the browser. Skipped on Global Privacy Control / Do Not Track. Never blocks anything.
import type { PiloEvent } from "./events";

export function trackPilo(sid: string, event: PiloEvent, detail = "", page = ""): void {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (n.globalPrivacyControl || n.doNotTrack === "1") return;
    void fetch("/api/beigepilot/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sid, event, detail, page }), keepalive: true }).catch(() => {});
  } catch { /* best effort */ }
}
