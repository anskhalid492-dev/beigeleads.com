"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, tableFromGrid } from "@/lib/glossary/tabular";
import { maskRows, type SampleRowData } from "@/lib/product-samples";
import { duplicateProductAction, saveProductAction, saveSampleAction } from "../../import/actions";

type Pk = { name: "Starter" | "Professional" | "Complete"; records: number; priceUsdCents: number; highlighted: boolean };
type Init = { categoryName: string; extraCategories: string[]; recordCount: number | null; dataFields: string; fileFormats: string; coverage: string; lastUpdated: string; placeholder: boolean; forSale: boolean; name: string; title: string; description: string; seoTitle: string; metaDescription: string; packages: Pk[] };
const box = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";

export function EditForm({ categories, samples, id, origin, status, slug, restricted, flags, initial }: { categories: string[]; samples: SampleRowData[]; origin: string; id: number; status: string; slug: string; restricted: string[]; flags: string[]; initial: Init }) {
  const [f, setF] = useState(initial); const [price, setPrice] = useState(initial.packages.map((k) => (k.priceUsdCents / 100).toString()));
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter(); const [csv, setCsv] = useState(""); const [saved, setSaved] = useState(samples);
  const preview = csv.trim() ? maskRows(tableFromGrid(parseCsv(csv)).rows) : [];
  const set = <K extends keyof Init>(k: K, v: Init[K]) => setF((x) => ({ ...x, [k]: v }));
  const setPk = (i: number, p: Partial<Pk>) => setF((x) => ({ ...x, packages: x.packages.map((k, j) => (j === i ? { ...k, ...p } : k)) }));

  async function save() {
    setBusy(true); setMsg("Saving...");
    try {
      const packages = f.packages.map((k, i) => ({ ...k, priceUsdCents: Math.round(Number(price[i] || "0") * 100) }));
      if (packages.some((k) => !Number.isFinite(k.priceUsdCents) || k.priceUsdCents < 0)) { setMsg("A price is not a valid number."); setBusy(false); return; }
      const r = await saveProductAction(id, { ...f, recordCount: f.recordCount, dataFields: f.dataFields.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean), packages });
      setMsg(r.ok ? "Saved. A published product shows the change within about a minute." : r.message);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  const [extraDraft, setExtraDraft] = useState(""); const [mainIsNew, setMainIsNew] = useState(false);
  const all = [...new Set([...categories, ...f.extraCategories])].filter((c) => c.toLowerCase() !== f.categoryName.trim().toLowerCase()).sort((x, y) => x.localeCompare(y));
  const mainList = [...new Set([...categories, f.categoryName].filter(Boolean))].sort((x, y) => x.localeCompare(y));
  const shown = all.filter((c) => c.toLowerCase().includes(extraDraft.trim().toLowerCase()));
  const addExtra = () => { const v = extraDraft.trim(); if (v && v.toLowerCase() !== f.categoryName.trim().toLowerCase() && !f.extraCategories.some((x) => x.toLowerCase() === v.toLowerCase())) set("extraCategories", [...f.extraCategories, v]); setExtraDraft(""); };
  async function saveSample(remove = false) {
    setBusy(true); setMsg("Saving sample...");
    try { const r = await saveSampleAction(id, remove ? "" : csv); setMsg(r.message); if (r.ok) { setSaved(remove ? [] : preview); setCsv(""); } } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  async function copy() {
    setBusy(true); setMsg("Copying...");
    try { const r = await duplicateProductAction(id); if (r.ok && r.id) router.push(`/admin/products/imported/${r.id}`); else setMsg(r.message); } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div className="max-w-3xl space-y-5 text-sm">
      {(restricted.length > 0 || flags.length > 0) && <div className="rounded-xl bg-sand-100 p-3 text-xs">{restricted.length > 0 && <p>Restricted: {restricted.join(", ")}</p>}{flags.length > 0 && <p>Flags: {flags.join("; ")}</p>}</div>}
      <div className="block"><span className="mb-1 block font-semibold">Main category</span>
        <select className={box} value={mainIsNew ? "__new" : f.categoryName} onChange={(e) => { if (e.target.value === "__new") { setMainIsNew(true); set("categoryName", ""); } else { setMainIsNew(false); set("categoryName", e.target.value); } }}>
          {mainList.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new">+ New category...</option>
        </select>
        {mainIsNew && <input className={`${box} mt-2`} autoFocus placeholder="New category name" value={f.categoryName} maxLength={120} onChange={(e) => set("categoryName", e.target.value)} />}
        <span className="mt-1 block text-xs">Decides the product&apos;s category page and breadcrumbs. The product URL does not change. Your choice stays even when the automatic grouping would pick another.</span>
      </div>
      <div className="block"><span className="mb-1 block font-semibold">Also list under (pick as many as you like)</span>
        <div className="mb-2 flex flex-wrap gap-2">{f.extraCategories.map((x) => <button key={x} type="button" onClick={() => set("extraCategories", f.extraCategories.filter((y) => y !== x))} className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-900">{x} ✕</button>)}{f.extraCategories.length === 0 && <span className="text-xs">No extra categories.</span>}</div>
        <input className={box} value={extraDraft} maxLength={120} placeholder="Search categories, or type a new name" onChange={(e) => setExtraDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtra(); } }} />
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-sand-200 bg-white">
          {shown.length === 0 && <p className="p-3 text-xs">No match. Press Enter to add &ldquo;{extraDraft.trim()}&rdquo; as a new category.</p>}
          {shown.map((c) => { const on = f.extraCategories.some((x) => x.toLowerCase() === c.toLowerCase()); return (
            <label key={c} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-sand-100"><input type="checkbox" checked={on} onChange={() => set("extraCategories", on ? f.extraCategories.filter((y) => y.toLowerCase() !== c.toLowerCase()) : [...f.extraCategories, c])} />{c}</label>); })}
        </div>
        {extraDraft.trim() && !all.some((c) => c.toLowerCase() === extraDraft.trim().toLowerCase()) && <button type="button" onClick={addExtra} className="mt-2 rounded-xl border border-sand-300 px-4 py-1.5 text-xs font-semibold">Add &ldquo;{extraDraft.trim()}&rdquo; as new category</button>}
        <span className="mt-1 block text-xs">The product also appears on each of these category pages. Its URL and main category do not change. Press Save below to keep your choices.</span>
      </div>
      <label className="block"><span className="mb-1 block font-semibold">Name (shown as the page heading)</span><input className={box} value={f.name} maxLength={200} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="block"><span className="mb-1 block font-semibold">Title (short description line)</span><input className={box} value={f.title} maxLength={200} onChange={(e) => set("title", e.target.value)} /></label>
      <label className="block"><span className="mb-1 block font-semibold">Description</span><textarea className={`${box} h-32`} value={f.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} /><span className="text-xs">{f.description.length} / 2000. Say only what is true about this list.</span></label>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">Facts shown on the product page</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold">Records (total)</span><input className={box} inputMode="numeric" value={f.recordCount ?? ""} onChange={(e) => set("recordCount", e.target.value.replace(/\D/g, "") === "" ? null : Number(e.target.value.replace(/\D/g, "")))} /></label>
          <label><span className="mb-1 block text-xs font-semibold">Last updated</span><input type="date" className={box} value={f.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} /></label>
          <label><span className="mb-1 block text-xs font-semibold">File formats</span><input className={box} placeholder="CSV, Excel or TXT" value={f.fileFormats} maxLength={80} onChange={(e) => set("fileFormats", e.target.value)} /></label>
          <label><span className="mb-1 block text-xs font-semibold">Coverage</span><input className={box} placeholder="Automatic from country and state" value={f.coverage} maxLength={160} onChange={(e) => set("coverage", e.target.value)} /></label>
        </div>
        <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold">Data fields (one per line)</span><textarea className={`${box} h-28`} value={f.dataFields} onChange={(e) => set("dataFields", e.target.value)} placeholder={"Business name\nAddress\nPhone\nEmail"} /><span className="text-xs">Leave empty if you do not know the exact fields: the page then claims none.</span></label>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.forSale} onChange={(e) => set("forSale", e.target.checked)} /> For sale (off = preview only, cannot be bought)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.placeholder} onChange={(e) => set("placeholder", e.target.checked)} /> These figures are placeholders (the page says so)</label>
        </div>
        {origin === "builtin" && <p className="mt-2 text-xs">This is a built-in product copied into the database. Your edits replace the code version.</p>}
      </fieldset>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">Packages (price is in US dollars)</legend>
        <div className="space-y-3">{f.packages.map((k, i) => (
          <div key={k.name} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
            <div><span className="mb-1 block text-xs font-semibold">Package</span><p className="py-2">{k.name}</p></div>
            <label><span className="mb-1 block text-xs font-semibold">Records</span><input className={box} inputMode="numeric" value={k.records} onChange={(e) => setPk(i, { records: Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0)) })} /></label>
            <label><span className="mb-1 block text-xs font-semibold">Price (USD)</span><input className={box} inputMode="decimal" value={price[i]} onChange={(e) => setPrice((p) => p.map((v, j) => (j === i ? e.target.value : v)))} /></label>
            <label className="flex items-center gap-2 py-2"><input type="checkbox" checked={k.highlighted} onChange={(e) => setPk(i, { highlighted: e.target.checked })} /> Recommended</label>
          </div>))}</div>
        {status === "published" && <p className="mt-3 text-xs">This product is published: every package needs a price above 0.</p>}
      </fieldset>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">Real sample rows (shown masked)</legend>
        <p className="text-xs">Paste up to 10 rows from the real file as CSV with a header line (business, address, city, phone, email, website). Emails, phone numbers and house numbers are masked before anything is saved; the originals are never stored. With no sample, the product page shows a request-a-free-sample panel instead of a table.</p>
        {saved.length > 0 && <p className="mt-2 text-xs font-semibold">Saved sample: {saved.length} masked rows ({saved.slice(0, 3).map((r) => r.business).join(", ")}{saved.length > 3 ? "..." : ""}).</p>}
        <textarea className={`${box} mt-2 h-28 font-mono text-xs`} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"business,address,city,phone,email,website\nAcme Dental,123 Main St,Mobile,(205) 555-0142,owner@acme.com,https://acme.com"} aria-label="Sample rows as CSV" />
        {preview.length > 0 && <div className="mt-2 overflow-x-auto rounded-lg border border-sand-200"><table className="w-full text-left text-xs"><thead className="bg-sand-100"><tr><th className="p-2">Business</th><th>Address</th><th>City</th><th>Phone</th><th>Email</th><th>Website</th></tr></thead><tbody>{preview.map((r) => <tr key={r.business} className="border-t border-sand-200"><td className="p-2">{r.business}</td><td>{r.address}</td><td>{r.city}</td><td className="font-mono">{r.phone}</td><td className="font-mono">{r.email}</td><td>{r.website}</td></tr>)}</tbody></table><p className="p-2 text-xs">This is exactly what visitors will see ({preview.length} rows).</p></div>}
        {csv.trim() && preview.length === 0 && <p className="mt-2 text-xs text-red-800">No usable rows yet: the first line must be a header with a business name column.</p>}
        <div className="mt-2 flex gap-2"><button type="button" disabled={busy || !preview.length} onClick={() => saveSample(false)} className="rounded-full border border-forest-900 px-4 py-1.5 font-semibold disabled:opacity-40">Save masked sample</button>{saved.length > 0 && <button type="button" disabled={busy} onClick={() => saveSample(true)} className="underline">Remove saved sample</button>}</div>
      </fieldset>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">Search results (optional)</legend>
        <label className="block"><span className="mb-1 block text-xs font-semibold">SEO title ({f.seoTitle.length}/60 is a good length)</span><input className={box} value={f.seoTitle} maxLength={200} onChange={(e) => set("seoTitle", e.target.value)} /></label>
        <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold">Meta description ({f.metaDescription.length}/160 is a good length)</span><textarea className={`${box} h-20`} value={f.metaDescription} maxLength={400} onChange={(e) => set("metaDescription", e.target.value)} /></label>
        <p className="mt-2 text-xs">Empty fields use the automatic title and description. The site-wide noindex is not affected.</p>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={save} className="rounded-full bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-40">Save changes</button>
        <button type="button" disabled={busy} onClick={copy} className="rounded-full border border-forest-900 px-4 py-2 font-semibold disabled:opacity-40">Duplicate as draft</button>
        {status === "published" && <a href={`/lists/${slug}`} target="_blank" rel="noreferrer" className="underline">View live page</a>}
        {msg && <span role="status" aria-live="polite" className="font-semibold text-forest-900">{msg}</span>}
      </div>
    </div>
  );
}
