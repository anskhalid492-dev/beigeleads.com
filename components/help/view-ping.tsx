"use client";
import { useEffect } from "react";

/** Counts one anonymous view per article per browser session. No cookie, no IP, no identifier is sent. */
export function ViewPing({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `bl-help-view:${articleId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* storage blocked: still count once per page load */ }
    fetch("/api/help/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article: articleId }), keepalive: true }).catch(() => {});
  }, [articleId]);
  return null;
}
