"use client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Search, X } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { saveLinkAction, type ActionState } from "./actions";

export type Row = {
  slug: string;
  name: string;
  packages: { name: string; records: number }[];
  /** "" = all packages. Value: url + last update (ms). */
  links: Record<string, { url: string; updatedAt: number }>;
};

type Status = "configured" | "partial" | "missing";
function statusOf(r: Row): { s: Status; covered: number } {
  if (r.links[""]) return { s: "configured", covered: r.packages.length };
  const covered = r.packages.filter((p) => r.links[p.name]).length;
  if (covered === 0) return { s: "missing", covered };
  return { s: covered === r.packages.length ? "configured" : "partial", covered };
}
const lastUpdate = (r: Row) => Math.max(0, ...Object.values(r.links).map((l) => l.updatedAt));
const dateText = (ms: number) => (ms ? new Date(ms).toISOString().slice(0, 10) : "—");

function StatusBadge({ r }: { r: Row }) {
  const { s, covered } = statusOf(r);
  if (s === "configured") return <Badge tone="good">Configured</Badge>;
  if (s === "partial") return <Badge tone="warn">Partial ({covered}/{r.packages.length})</Badge>;
  return <Badge tone="bad">Missing</Badge>;
}

const PAGE = 10;
const field = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-purple-600";

export function DeliveryManager({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [sort, setSort] = useState<"az" | "za" | "new" | "old">("az");
  const [page, setPage] = useState(1);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = rows.filter((r) => (!t || r.name.toLowerCase().includes(t) || r.slug.includes(t)) && (filter === "all" || statusOf(r).s === filter));
    out.sort((a, b) => sort === "az" ? a.name.localeCompare(b.name) : sort === "za" ? b.name.localeCompare(a.name) : sort === "new" ? lastUpdate(b) - lastUpdate(a) : lastUpdate(a) - lastUpdate(b));
    return out;
  }, [rows, q, filter, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PAGE, cur * PAGE);
  const open = rows.find((r) => r.slug === openSlug) ?? null;
  const counts = { configured: rows.filter((r) => statusOf(r).s === "configured").length, missing: rows.filter((r) => statusOf(r).s === "missing").length };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Badge tone="good">{counts.configured} configured</Badge>
        <Badge tone="bad">{counts.missing} missing</Badge>
        <Badge>{rows.length} products</Badge>
      </div>
      <div className="rounded-2xl border border-sand-200 bg-white">
        <div className="flex flex-wrap gap-3 border-b border-sand-200 p-4">
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products" className={`${field} w-full pl-9`} />
          </label>
          <label><span className="sr-only">Filter</span>
            <select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }} className={field}>
              <option value="all">All statuses</option><option value="configured">Configured</option><option value="partial">Partial</option><option value="missing">Missing</option>
            </select></label>
          <label><span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={field}>
              <option value="az">Name A to Z</option><option value="za">Name Z to A</option><option value="new">Recently updated</option><option value="old">Least recently updated</option>
            </select></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-sand-100 text-xs font-bold text-forest-900">
              <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Packages</th><th className="px-4 py-3">Delivery status</th><th className="px-4 py-3">Last updated</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {shown.map((r) => (
                <tr key={r.slug} className="hover:bg-sand-50">
                  <td className="px-4 py-3 font-semibold text-forest-900">{r.name}</td>
                  <td className="px-4 py-3">{r.packages.length} packages</td>
                  <td className="px-4 py-3"><StatusBadge r={r} /></td>
                  <td className="px-4 py-3">{dateText(lastUpdate(r))}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setOpenSlug(r.slug)} className="rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">Manage</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center">{rows.length === 0 ? "No products in the catalog yet." : "No products match your search or filter."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-sand-200 p-3 text-sm">
          <span>{list.length} result{list.length === 1 ? "" : "s"} · page {cur} of {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous page" className="rounded-full border border-sand-300 p-2 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next page" className="rounded-full border border-sand-300 p-2 disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </div>
      {open && <Drawer row={open} onClose={() => setOpenSlug(null)} />}
    </>
  );
}

function Drawer({ row, onClose }: { row: Row; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  const def = row.links[""]?.url ?? "";
  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-forest-900/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Delivery links for ${row.name}`} className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-sand-50 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sand-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold text-forest-500">Delivery links</p>
            <h2 className="display text-3xl text-forest-900">{row.name}</h2>
            <div className="mt-2"><StatusBadge r={row} /></div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-sand-100"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="rounded-xl bg-purple-100 p-3 text-sm text-forest-900">
            A package link wins over the default link. Saving a link here does not email anyone by itself. Orders that are already paid and still waiting for a link are delivered automatically within about a minute.
          </p>
          <LinkField slug={row.slug} pkg="" label="Default link (all packages)" current={def} updatedAt={row.links[""]?.updatedAt} hint="Used for every package that has no link of its own." />
          {row.packages.map((p) => {
            const own = row.links[p.name];
            return (
              <LinkField key={p.name} slug={row.slug} pkg={p.name} label={`${p.name} package link`} current={own?.url ?? ""} updatedAt={own?.updatedAt}
                hint={own ? "This package uses its own link." : def ? "Not set: buyers get the default link." : "Not set and no default: paid orders wait for a link."} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LinkField({ slug, pkg, label, current, updatedAt, hint }: { slug: string; pkg: string; label: string; current: string; updatedAt?: number; hint: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveLinkAction, null);
  const toast = useToast();
  const [value, setValue] = useState(current);
  const [prevCurrent, setPrevCurrent] = useState(current);
  if (prevCurrent !== current) { setPrevCurrent(current); setValue(current); }
  const [confirm, setConfirm] = useState<null | "replace" | "remove">(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const seen = useRef<ActionState>(null);
  useEffect(() => {
    if (state && state !== seen.current) { seen.current = state; toast(state.ok, state.message); setConfirm(null); }
  }, [state, toast]);

  const trimmed = value.trim();
  const invalid = trimmed !== "" && !/^https:\/\/[^\s/]+\.[^\s]+$/i.test(trimmed) ? "Enter a full link that starts with https://" : "";
  const changed = trimmed !== current;
  const copy = async () => { try { await navigator.clipboard.writeText(current); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { toast(false, "Could not copy. Select the link and copy it."); } };
  const submit = () => {
    if (invalid || !trimmed) return;
    if (current && confirm !== "replace") { setConfirm("replace"); return; }
    formRef.current?.requestSubmit();
  };
  const id = `u-${slug}-${pkg || "all"}`;

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="font-bold text-forest-900">{label}</label>
        {current ? <Badge tone="good">Configured</Badge> : <Badge>Not set</Badge>}
      </div>
      <form ref={formRef} action={action} className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { if (invalid || !trimmed) e.preventDefault(); }}>
        <input type="hidden" name="product" value={slug} /><input type="hidden" name="pkg" value={pkg} />
        <input id={id} name="url" type="url" value={value} onChange={(e) => { setValue(e.target.value); setConfirm(null); }} placeholder="https://..." aria-invalid={!!invalid} aria-describedby={`${id}-h`} className={`${field} min-w-0 flex-1`} />
        <button type="button" onClick={submit} disabled={pending || !changed || !trimmed || !!invalid} className="h-10 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{pending ? "Saving…" : "Save"}</button>
      </form>
      <p id={`${id}-h`} className={`mt-2 text-xs ${invalid ? "font-semibold text-red-700" : ""}`}>{invalid || hint}{!invalid && updatedAt ? ` Updated ${dateText(updatedAt)}.` : ""}</p>
      {confirm === "replace" && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
          <span className="flex-1">Replace the current link? Future deliveries will use the new one.</span>
          <button type="button" onClick={() => formRef.current?.requestSubmit()} className="rounded-full bg-forest-900 px-4 py-1.5 font-semibold text-white">Yes, replace</button>
          <button type="button" onClick={() => setConfirm(null)} className="rounded-full border border-amber-900/30 px-4 py-1.5 font-semibold">Cancel</button>
        </div>
      )}
      {current && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-forest-900 hover:bg-sand-100">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}</button>
          <a href={current} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-forest-900 hover:bg-sand-100"><ExternalLink className="size-4" /> Open</a>
          {confirm === "remove" ? (
            <form action={action} className="flex items-center gap-2">
              <input type="hidden" name="product" value={slug} /><input type="hidden" name="pkg" value={pkg} /><input type="hidden" name="url" value="" />
              <span className="text-red-800">Remove this link?</span>
              <button type="submit" disabled={pending} className="rounded-full bg-red-700 px-4 py-1.5 font-semibold text-white">Yes, remove</button>
              <button type="button" onClick={() => setConfirm(null)} className="rounded-full border border-sand-300 px-3 py-1.5 font-semibold">Cancel</button>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirm("remove")} className="rounded-full px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50">Remove</button>
          )}
        </div>
      )}
    </div>
  );
}
