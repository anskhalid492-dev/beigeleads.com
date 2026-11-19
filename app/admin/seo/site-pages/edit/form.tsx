"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { liveSeoAction, resetPageSeoAction, savePageSeoAction, type PageSeoValues } from "../../actions";

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const label = "mb-1 block text-sm font-semibold text-forest-900";
const Count = ({ n, lo, hi }: { n: number; lo: number; hi: number }) => <span className={`text-xs ${n === 0 ? "" : n < lo || n > hi ? "font-semibold text-amber-900" : "text-forest-700"}`}>{n} characters{n > 0 && (n < lo || n > hi) ? ` (aim for ${lo}–${hi})` : ""}</span>;

export function PageSeoForm({ path, initial }: { path: string; initial: PageSeoValues }) {
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState(initial);
  const [live, setLive] = useState<{ title: string; description: string } | null>(null);
  const [liveErr, setLiveErr] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const dirty = useMemo(() => (Object.keys(v) as (keyof PageSeoValues)[]).some((k) => v[k] !== saved[k]), [v, saved]);
  const set = (k: keyof PageSeoValues) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  useEffect(() => { liveSeoAction(path).then((r) => (r.ok ? setLive({ title: r.title, description: r.description }) : setLiveErr(r.error))); }, [path]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const title = v.seoTitle || live?.title || path; const desc = v.metaDescription || live?.description || "";
  return (
    <form className="space-y-5 p-5" onSubmit={(e) => { e.preventDefault(); start(async () => { setErr(""); const r = await savePageSeoAction(path, v); if (r.ok) { setSaved(v); toast(true, "Saved. It goes live on the page within about a minute."); router.refresh(); } else { setErr(r.error); toast(false, r.error); } }); }}>
      <div className="rounded-xl border border-sand-200 p-3" aria-label="Search result preview">
        <p className="truncate text-xs">beigeleads.com{path}</p>
        <p className="mt-0.5 line-clamp-2 text-base font-semibold text-[#1a0dab]">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm">{desc || "No description."}</p>
      </div>
      <div className="rounded-xl bg-sand-100 p-3 text-xs" role="status">
        {live ? <><p><b>Live now:</b> {live.title || "(no title)"}</p><p className="mt-1">{live.description || "(no description)"}</p></> : liveErr ? <p>{liveErr}</p> : <p>Reading the live page…</p>}
        <p className="mt-1">Leave a field empty to keep what the page has. The full title is used exactly as typed; the site name is not added.</p>
      </div>
      <div><label htmlFor="t" className={label}>SEO title</label><input id="t" value={v.seoTitle} onChange={set("seoTitle")} maxLength={70} className={input} /><Count n={v.seoTitle.length} lo={30} hi={60} /></div>
      <div><label htmlFor="d" className={label}>Meta description</label><textarea id="d" rows={3} value={v.metaDescription} onChange={set("metaDescription")} maxLength={200} className={input} /><Count n={v.metaDescription.length} lo={70} hi={160} /></div>
      <details className="rounded-xl border border-sand-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-forest-900">Social sharing and canonical (optional)</summary>
        <div className="mt-3 space-y-4">
          <div><label htmlFor="ot" className={label}>Social title</label><input id="ot" value={v.ogTitle} onChange={set("ogTitle")} placeholder={v.seoTitle} maxLength={90} className={input} /><p className="mt-1 text-xs">Empty uses the SEO title.</p></div>
          <div><label htmlFor="od" className={label}>Social description</label><textarea id="od" rows={2} value={v.ogDescription} onChange={set("ogDescription")} placeholder={v.metaDescription} maxLength={200} className={input} /><p className="mt-1 text-xs">Empty uses the meta description.</p></div>
          <div><label htmlFor="oi" className={label}>Social image address</label><input id="oi" value={v.ogImage} onChange={set("ogImage")} placeholder="/media/… or https://…" className={input} /><p className="mt-1 text-xs">Use an image from the Media library (1200×628 works best).</p></div>
          <div><label htmlFor="cu" className={label}>Canonical address</label><input id="cu" value={v.canonicalUrl} onChange={set("canonicalUrl")} placeholder="Leave empty to keep the page's own canonical" className={input} /><p className="mt-1 text-xs">Change only if you know why: a wrong canonical can hide the page from search.</p></div>
        </div>
      </details>
      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !dirty}>{pending ? "Saving…" : "Save and publish"}</Button>
        <Button type="button" variant="secondary" disabled={pending || !dirty} onClick={() => setV(saved)}>Cancel changes</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => { if (window.confirm("Remove all admin SEO for this page and go back to the code defaults?")) start(async () => { const r = await resetPageSeoAction(path); if (r.ok) { const empty = { seoTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "" }; setV(empty); setSaved(empty); toast(true, "Back to the code defaults"); router.refresh(); } else toast(false, r.error); }); }}>Reset to defaults</Button>
        {dirty && <span role="status" className="text-xs font-semibold text-amber-900">Unsaved changes</span>}
      </div>
    </form>
  );
}
