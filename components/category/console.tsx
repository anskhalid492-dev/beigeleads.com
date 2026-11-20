"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";

type Opt = { slug: string; name: string };
export type ConsoleProps = {
  mode: "request" | "browse";
  title: string;
  industries: Opt[];
  industryLocked?: boolean;
  placeName: string;
  places?: string[];            // real places to pick from (browse mode); request mode uses free text
  roles?: string[];             // role chips (job-title pages)
  fields: string[];             // fields the catalog really supports
  requestable?: string[];       // extra fields that can only be requested (never promised)
  status: { live: boolean; text: string };
  cta: { label: string; href?: string };  // href fixed in browse mode; request mode builds the custom-list link
  secondary: { label: string; href: string };
};

const MASK: Record<string, string> = {
  "Business name": "Name of the business", Address: "Street address", City: "Your city", Country: "", Phone: "Phone number",
  Email: "Business email", Website: "Website address", "Contact name": "Contact name", "Job title": "Job title",
};

/** The hero's working preview: choose a prospect group, see the fields, see the honest status and the next action. */
export function TargetConsole(p: ConsoleProps) {
  const [ind, setInd] = useState(p.industries[0]?.slug ?? "");
  const [role, setRole] = useState(p.roles?.[0] ?? "");
  const [place, setPlace] = useState(p.places?.[0] ?? "");
  const [text, setText] = useState("");
  const all = useMemo(() => [...p.fields, ...(p.requestable ?? [])], [p.fields, p.requestable]);
  const [on, setOn] = useState<string[]>(() => p.fields.slice(0, 4));
  const toggle = (f: string) => setOn((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));
  const cols = all.filter((f) => on.includes(f));
  const indName = p.industries.find((i) => i.slug === ind)?.name ?? "";
  const where = p.mode === "browse" ? place : text.trim();
  const href = p.cta.href ?? `/custom-list?categoryText=${encodeURIComponent([role, indName].filter(Boolean).join(" · "))}${p.placeName ? `&countryText=${encodeURIComponent(p.placeName)}` : ""}${where ? `&region=${encodeURIComponent(where)}` : ""}`;
  const chip = (sel: boolean) => `rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${sel ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`;
  return (
    <div className="rounded-[1.8rem] border border-sand-300 bg-white p-5 shadow-[0_26px_50px_-34px_rgba(15,42,29,.55)] sm:p-6">
      <p className="display text-2xl text-forest-900">{p.title}</p>
      {p.roles && <fieldset className="mt-4"><legend className="text-sm font-bold text-forest-900">Role</legend><div className="mt-2 flex flex-wrap gap-2">{p.roles.map((r) => <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={chip(role === r)}>{r}</button>)}</div></fieldset>}
      {p.industries.length > 1 && !p.industryLocked && <fieldset className="mt-4"><legend className="text-sm font-bold text-forest-900">Industry</legend><div className="mt-2 flex flex-wrap gap-2">{p.industries.map((i) => <button key={i.slug} type="button" aria-pressed={ind === i.slug} onClick={() => setInd(i.slug)} className={chip(ind === i.slug)}>{i.name}</button>)}</div></fieldset>}
      <div className="mt-4">
        <label className="text-sm font-bold text-forest-900" htmlFor="tc-place">{p.mode === "browse" ? "Place" : "State, region or city"}</label>
        {p.mode === "browse" && p.places ? (
          <select id="tc-place" value={place} onChange={(e) => setPlace(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">{p.places.map((x) => <option key={x}>{x}</option>)}</select>
        ) : (
          <input id="tc-place" value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder={p.placeName ? `Optional, in ${p.placeName}` : "Optional"} className="mt-2 h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-purple-600" />
        )}
      </div>
      <fieldset className="mt-4"><legend className="text-sm font-bold text-forest-900">Fields to preview</legend>
        <div className="mt-2 flex flex-wrap gap-2">{all.map((f) => <button key={f} type="button" aria-pressed={on.includes(f)} onClick={() => toggle(f)} className={`${chip(on.includes(f))} ${p.fields.includes(f) ? "" : "border-dashed"}`}>{f}</button>)}</div>
        {p.requestable?.length ? <p className="mt-2 text-xs">Dashed fields can be requested; they are not part of the ready-made lists.</p> : null}
      </fieldset>
      <div className="mt-4 overflow-x-auto rounded-xl border border-sand-300">
        <table className="w-full min-w-[20rem] text-left text-sm"><thead className="bg-sand-100 text-forest-900"><tr>{cols.map((c) => <th key={c} className="px-3 py-2 font-bold">{c}</th>)}</tr></thead>
          <tbody><tr>{cols.map((c) => <td key={c} className="whitespace-nowrap px-3 py-2.5">{c === "Country" ? (p.placeName || "Your country") : c === "City" && where ? where : MASK[c] ?? "•••"}</td>)}</tr></tbody></table>
        <p className="border-t border-sand-200 bg-sand-50 px-3 py-1.5 text-xs">Field layout. Real masked rows are on each list page.</p>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-forest-900"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${p.status.live ? "bg-forest-500" : "bg-purple-600"}`} aria-hidden />{p.status.text}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Link href={href} className="inline-flex h-12 items-center justify-center rounded-full bg-purple-600 px-5 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{p.cta.label}</Link>
        <Link href={p.secondary.href} className="inline-flex h-12 items-center justify-center rounded-full border border-forest-900 px-5 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{p.secondary.label}</Link>
      </div>
    </div>
  );
}

export type Group = { key: string; title: string; hint: string; options: string[]; free?: boolean };
/** "What you can target": pick segments, see them gathered in one request, send it to the custom-list builder. */
export function TargetBuilder({ groups, placeName, base }: { groups: Group[]; placeName: string; base: string }) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const set = (k: string, v: string[]) => setSel((s) => ({ ...s, [k]: v }));
  const toggle = (k: string, o: string) => set(k, (sel[k] ?? []).includes(o) ? (sel[k] ?? []).filter((x) => x !== o) : [...(sel[k] ?? []), o]);
  const add = (k: string) => { const v = (draft[k] ?? "").trim().slice(0, 60); if (v && !(sel[k] ?? []).includes(v)) set(k, [...(sel[k] ?? []), v]); setDraft((d) => ({ ...d, [k]: "" })); };
  const picked = groups.flatMap((g) => (sel[g.key] ?? []).map((o) => ({ k: g.key, o })));
  const q = (k: string) => (sel[k] ?? []).join(", ");
  const href = `${base}?categoryText=${encodeURIComponent([q("roles"), q("industries")].filter(Boolean).join(" · "))}${placeName ? `&countryText=${encodeURIComponent(placeName)}` : ""}${q("places") ? `&region=${encodeURIComponent(q("places"))}` : ""}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <div className="space-y-6">
        {groups.map((g) => (
          <fieldset key={g.key}>
            <legend className="display text-2xl text-forest-900">{g.title}</legend>
            <p className="mt-1 text-sm">{g.hint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.options.map((o) => { const s = (sel[g.key] ?? []).includes(o); return <button key={o} type="button" aria-pressed={s} onClick={() => toggle(g.key, o)} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${s ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>{s && <Check className="size-3.5" aria-hidden />}{o}</button>; })}
              {(sel[g.key] ?? []).filter((o) => !g.options.includes(o)).map((o) => <button key={o} type="button" aria-pressed onClick={() => toggle(g.key, o)} className="inline-flex items-center gap-1.5 rounded-full border border-forest-900 bg-forest-900 px-4 py-2 text-sm font-semibold text-sand-50"><Check className="size-3.5" aria-hidden />{o}</button>)}
            </div>
            {g.free && <form className="mt-3 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); add(g.key); }}><input aria-label={`Add to ${g.title}`} value={draft[g.key] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [g.key]: e.target.value }))} placeholder="Type and press Add" className="h-10 min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-3 text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600" /><button className="h-10 rounded-full border border-forest-900 px-4 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Add</button></form>}
          </fieldset>
        ))}
      </div>
      <aside className="h-fit rounded-[1.6rem] bg-forest-900 p-6 text-sand-100 lg:sticky lg:top-28" aria-live="polite">
        <p className="display text-2xl text-sand-50">Your request</p>
        {picked.length === 0 ? <p className="mt-3 text-sm text-sand-200">Pick segments on the left. Nothing is required to start.</p> : <ul className="mt-3 flex flex-wrap gap-1.5">{picked.map((x) => <li key={x.k + x.o} className="rounded-full bg-forest-700 px-3 py-1 text-sm">{x.o}</li>)}</ul>}
        <p className="mt-4 text-sm text-sand-200">{placeName ? `Place: ${placeName}. ` : ""}Every segment is subject to sourcing; we tell you what we can deliver.</p>
        <Link href={href} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">Continue to my request</Link>
      </aside>
    </div>
  );
}
