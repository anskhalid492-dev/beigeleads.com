"use client";
// Anonymous analytics for proactive messages. Skipped when the browser asks not to be tracked (Global Privacy Control / Do Not Track).
import type { ProEvent } from "./events";
import type { Stage } from "./types";

export function trackPro(sid: string, stage: Stage, event: ProEvent, template: string, page: string): void {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (n.globalPrivacyControl || n.doNotTrack === "1") return;
    void fetch("/api/beigepilot/proactive/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sid, stage, event, template, page }), keepalive: true }).catch(() => {});
  } catch { /* analytics are best effort */ }
}
