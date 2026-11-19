"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = { text: string; href: string } | null;
const KEY = "bl-banner-dismissed";

/**
 * Announcement banner set in Admin > Settings. Loaded after the page renders from a cached endpoint, so public pages
 * stay static. Plain text only; the link must be a site path or https address (checked again when it is rendered).
 */
export function AnnouncementBanner() {
  const [banner, setBanner] = useState<Banner>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let off = false;
    fetch("/api/public-settings").then((r) => (r.ok ? (r.json() as Promise<{ banner?: Banner }>) : null)).then((s) => {
      if (off || !s?.banner?.text) return;
      let seen: string | null = null;
      try { seen = sessionStorage.getItem(KEY); } catch { /* storage blocked */ }
      if (seen === s.banner.text) setHidden(true);
      setBanner(s.banner);
    }).catch(() => {});
    return () => { off = true; };
  }, []);
  if (!banner || hidden) return null;
  const safe = banner.href && (banner.href.startsWith("/") && !banner.href.startsWith("//") ? true : /^https:\/\//i.test(banner.href));
  const external = safe && banner.href.startsWith("https://");
  return (
    <div role="region" aria-label="Announcement" className="bg-forest-900 px-4 py-2 text-center text-sm text-sand-50">
      <span>{banner.text}</span>
      {safe && (external
        ? <a href={banner.href} rel="noopener noreferrer" target="_blank" className="ml-2 font-semibold underline">Learn more</a>
        : <Link href={banner.href} className="ml-2 font-semibold underline">Learn more</Link>)}
      <button type="button" aria-label="Dismiss announcement" className="ml-3 rounded px-1.5 font-bold" onClick={() => { setHidden(true); try { sessionStorage.setItem(KEY, banner.text); } catch { /* ignore */ } }}>×</button>
    </div>
  );
}
