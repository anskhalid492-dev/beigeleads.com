"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, tableFromGrid } from "@/lib/glossary/tabular";
import { maskRows, type SampleRowData } from "@/lib/product-samples";
import { deleteProductsAction, duplicateProductAction, renameProductSlugAction, saveProductAction, saveSampleAction } from "../../import/actions";

type Pk = { name: string; records: number; priceUsdCents: number; highlighted: boolean };
type Faq = { q: string; a: string };
type Init = { faqs: Faq[]; categoryName: string; extraCategories: string[]; recordCount: number | null; dataFields: string; fieldsCustom?: boolean; fileFormats: string; coverage: string; lastUpdated: string; placeholder: boolean; forSale: boolean; name: string; title: string; description: string; seoTitle: string; metaDescription: string; packages: Pk[] };
const box = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";

import { FIELD_CATALOG, LOCAL_FIELD_CATALOG } from "@/lib/product-fields";

/** The fields cards of the product page: tick what this list really contains. Names outside the catalog go in the box below. */
function FieldPicker({ value, onChange, defaults }: { value: string; onChange: (v: string) => void; defaults: string[] }) {
  const list = value.split("\n").map((x) => x.trim()).filter(Boolean);
  const [draft, setDraft] = useState("");
  const [mine, setMine] = useState<string[]>([]);
  const emit = (names: string[]) => onChange([...new Set(names.map((n) => n.trim()).filter(Boolean))].join("\n"));
  const has = (n: string) => list.some((x) => x.toLowerCase() === n.toLowerCase());
  const add = () => { const v = draft.trim(); if (v && !has(v)) { emit([...list, v]); if (!known.has(v.toLowerCase())) setMine((m) => (m.some((x) => x.toLowerCase() === v.toLowerCase()) ? m : [...m, v])); } setDraft(""); };
  const catalog = [...LOCAL_FIELD_CATALOG, ...FIELD_CATALOG];
  const groups = [...new Set(catalog.map((c) => c.group))];
  const known = new Set(catalog.map((c) => c.name.toLowerCase()));
  // Fields added by hand stay in the picker (even when unticked), so they can be turned on and off again.
  const own = [...new Set([...mine, ...list.filter((n) => !known.has(n.toLowerCase()))])];
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold">Data fields shown on the product page ({list.length})</span>
        <span className="flex gap-2 text-xs">
          <button type="button" className="underline" onClick={() => emit(defaults)}>Reset to the standard {defaults.length}</button>
          <button type="button" className="underline" onClick={() => emit([])}>Remove all</button>
        </span>
      </div>
      <ul className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((n, i) => (
          <li key={i} className="flex items-center gap-1 rounded-lg border border-sand-200 bg-sand-50 p-1">
            <input aria-label={`Field ${i + 1}`} className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-xs focus:border-sand-300 focus:bg-white" value={n} maxLength={80} onChange={(e) => emit(list.map((x, j) => (j === i ? e.target.value : x)))} onBlur={(e) => { if (!e.target.value.trim()) emit(list.filter((_, j) => j !== i)); }} />
            <button type="button" aria-label={`Remove ${n}`} className="rounded px-1.5 text-sm font-bold text-forest-700 hover:bg-sand-200" onClick={() => emit(list.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input className="min-w-0 flex-1 rounded-lg border border-sand-300 bg-white p-2 text-sm" placeholder="Add a new field, for example Opening Year" value={draft} maxLength={80} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="rounded-lg bg-forest-900 px-3 text-sm font-semibold text-sand-50" onClick={add}>Add field</button>
      </div>
      <details className="mt-2 rounded-lg border border-sand-200 p-2">
        <summary className="cursor-pointer text-xs font-semibold">Add from the standard field lists</summary>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {own.length > 0 && (
            <div className="rounded-lg bg-sand-50 p-2"><b className="text-xs">Your added fields</b>
              {own.map((n) => (
                <label key={n} className="flex items-start gap-2 py-0.5 text-xs"><input type="checkbox" className="mt-0.5" checked={has(n)} onChange={() => emit(has(n) ? list.filter((x) => x.toLowerCase() !== n.toLowerCase()) : [...list, n])} /><span>{n}</span></label>
              ))}
            </div>
          )}
          {groups.map((g) => (
            <div key={g} className="rounded-lg bg-sand-50 p-2"><b className="text-xs">{g}</b>
              {catalog.filter((c) => c.group === g).map((c) => (
                <label key={c.name} className="flex items-start gap-2 py-0.5 text-xs"><input type="checkbox" className="mt-0.5" checked={has(c.name)} onChange={() => emit(has(c.name) ? list.filter((x) => x.toLowerCase() !== c.name.toLowerCase()) : [...list, c.name])} /><span>{c.name}</span></label>
              ))}
            </div>
          ))}
        </div>
      </details>
      <p className="mt-1 text-xs">Rename a field by editing its text, remove it with ×, add your own above (max 80). Untouched = the standard {defaults.length}. Only list what the file really contains; the refund policy applies to what the page promises.</p>
    </div>
  );
}

export function EditForm({ autoFaqs, defaults, categories, samples, id, origin, status, slug, restricted, flags, initial }: { autoFaqs: Faq[]; defaults: string[]; categories: string[]; samples: SampleRowData[]; origin: string; id: number; status: string; slug: string; restricted: string[]; flags: string[]; initial: Init }) {
  const [f, setF] = useState(initial); const [price, setPrice] = useState(initial.packages.map((k) => (k.priceUsdCents / 100).toString()));
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter(); const [csv, setCsv] = useState(""); const [saved, setSaved] = useState(samples);
  const preview = csv.trim() ? maskRows(tableFromGrid(parseCsv(csv)).rows) : [];
  const set = <K extends keyof Init>(k: K, v: Init[K]) => setF((x) => ({ ...x, [k]: v }));
  const addPk = () => { setF((x) => ({ ...x, packages: [...x.packages, { name: `Package ${x.packages.length + 1}`, records: 0, priceUsdCents: 0, highlighted: false }] })); setPrice((p) => [...p, "0"]); };
  const removePk = (i: number) => { setF((x) => ({ ...x, packages: x.packages.filter((_, j) => j !== i) })); setPrice((p) => p.filter((_, j) => j !== i)); };
  const setFaq = (i: number, p: Partial<Faq>) => setF((x) => ({ ...x, faqs: x.faqs.map((q, j) => (j === i ? { ...q, ...p } : q)) }));
  const moveFaq = (i: number, d: number) => setF((x) => { const a = [...x.faqs]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, faqs: a }; });
  const setPk = (i: number, p: Partial<Pk>) => setF((x) => ({ ...x, packages: x.packages.map((k, j) => (j === i ? { ...k, ...p } : k)) }));

  async function save() {
    setBusy(true); setMsg("Saving...");
    try {
      if (!f.categoryName.trim()) { setMsg("Pick at least one category."); setBusy(false); return; }
      const chosen = f.dataFields.split("\n").map((x) => x.trim()).filter(Boolean);
      const packages = f.packages.map((k, i) => ({ ...k, priceUsdCents: Math.round(Number(price[i] || "0") * 100) }));
      if (packages.some((k) => !Number.isFinite(k.priceUsdCents) || k.priceUsdCents < 0)) { setMsg("A price is not a valid number."); setBusy(false); return; }
      const faqs = f.faqs.map((x) => ({ q: x.q.trim(), a: x.a.trim() })).filter((x) => x.q || x.a);
      if (faqs.some((x) => !x.q || !x.a)) { setMsg("Every FAQ needs both a question and an answer."); setBusy(false); return; }
      const r = await saveProductAction(id, { ...f, recordCount: f.recordCount, dataFields: chosen, faqs: faqs, faqsCustom: JSON.stringify(faqs) !== JSON.stringify(autoFaqs), fieldsCustom: !(chosen.length === defaults.length && defaults.every((n) => chosen.includes(n))), packages });
      setMsg(r.ok ? "Saved. A published product shows the change within about a minute." : r.message);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  const [slugNow, setSlugNow] = useState(slug); const [slugIn, setSlugIn] = useState(slug); const [slugMsg, setSlugMsg] = useState("");
  async function changeSlug() {
    if (slugIn.trim() === slugNow) return;
    if (!window.confirm(`Change the URL to /lists/${slugIn.trim()}? The old address will redirect to the new one.`)) return;
    setBusy(true); const r = await renameProductSlugAction(id, slugIn); setBusy(false); setSlugMsg(r.message);
    if (r.ok && r.slug) { setSlugNow(r.slug); setSlugIn(r.slug); router.refresh(); }
  }
  const [extraDraft, setExtraDraft] = useState("");
  // One list of categories: the first decides the category page and breadcrumbs, the rest are extra listings.
  const picked = [f.categoryName, ...f.extraCategories].map((x) => x.trim()).filter(Boolean);
  const has = (c: string) => picked.some((x) => x.toLowerCase() === c.toLowerCase());
  const setPicked = (list: string[]) => setF((x) => ({ ...x, categoryName: list[0] ?? "", extraCategories: list.slice(1) }));
  const all = [...new Set([...categories, ...picked])].sort((x, y) => x.localeCompare(y));
  const shown = all.filter((c) => c.toLowerCase().includes(extraDraft.trim().toLowerCase()));
  const toggleCat = (c: string) => setPicked(has(c) ? picked.filter((y) => y.toLowerCase() !== c.toLowerCase()) : [...picked, c]);
  const addExtra = () => { const v = extraDraft.trim(); if (v && !has(v)) setPicked([...picked, v]); setExtraDraft(""); };
  async function saveSample(remove = false) {
    setBusy(true); setMsg("Saving sample...");
    try { const r = await saveSampleAction(id, remove ? "" : csv); setMsg(r.message); if (r.ok) { setSaved(remove ? [] : preview); setCsv(""); } } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm("Delete this product? It is removed from the site. (If it has orders or is built in, it is archived instead.)")) return;
    setBusy(true); setMsg("Deleting...");
    try { const r = await deleteProductsAction([id]); setMsg(r.message); if (r.ok) setTimeout(() => router.push("/admin/products"), 1500); } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
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
      <div className="block"><span className="mb-1 block font-semibold">Categories (pick as many as you like)</span>
        <div className="mb-2 flex flex-wrap gap-2">{picked.map((x, i) => <span key={x} className="inline-flex items-center overflow-hidden rounded-full bg-forest-100 text-xs font-semibold text-forest-900"><button type="button" disabled={i === 0} title={i === 0 ? "Decides the category page and breadcrumbs" : "Make this the first category"} onClick={() => setPicked([x, ...picked.filter((y) => y !== x)])} className="px-3 py-1 enabled:hover:bg-forest-500/20">{x}{i === 0 ? " (first)" : ""}</button><button type="button" aria-label={`Remove ${x}`} onClick={() => setPicked(picked.filter((y) => y !== x))} className="px-2 py-1 hover:bg-forest-500/20">✕</button></span>)}{picked.length === 0 && <span className="text-xs">Pick at least one category.</span>}</div>
        <input className={box} value={extraDraft} maxLength={120} placeholder="Search categories, or type a new name" onChange={(e) => setExtraDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtra(); } }} />
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-sand-200 bg-white">
          {shown.length === 0 && <p className="p-3 text-xs">No match. Press Enter to add &ldquo;{extraDraft.trim()}&rdquo; as a new category.</p>}
          {shown.map((c) => <label key={c} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-sand-100"><input type="checkbox" checked={has(c)} onChange={() => toggleCat(c)} />{c}</label>)}
        </div>
        {extraDraft.trim() && !all.some((c) => c.toLowerCase() === extraDraft.trim().toLowerCase()) && <button type="button" onClick={addExtra} className="mt-2 rounded-xl border border-sand-300 px-4 py-1.5 text-xs font-semibold">Add &ldquo;{extraDraft.trim()}&rdquo; as new category</button>}
        <span className="mt-1 block text-xs">The product&apos;s current category is already ticked. It appears on every category page you tick. The first one decides the category page and breadcrumbs (click another to make it first). The product URL does not change. Press Save below to keep your choices.</span>
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
        <FieldPicker value={f.dataFields} defaults={defaults} onChange={(v) => set("dataFields", v)} />
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.forSale} onChange={(e) => set("forSale", e.target.checked)} /> For sale (off = preview only, cannot be bought)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.placeholder} onChange={(e) => set("placeholder", e.target.checked)} /> These figures are placeholders (the page says so)</label>
        </div>
        {(f.placeholder || !f.forSale) && <p className="mt-2 rounded-lg bg-sand-100 p-2 text-xs font-semibold text-forest-900">Visitors currently see: {f.placeholder ? "no record count or price (\"Count to be confirmed\")" : "count and price"}{!f.forSale ? "; status \"Preview only\" and no buying" : "; status \"Available\""}. {f.placeholder ? "Untick the placeholder box to show your real figures. " : ""}{!f.forSale ? "Tick \"For sale\" to let people buy." : ""}</p>}
        {origin === "builtin" && <p className="mt-2 text-xs">This is a built-in product copied into the database. Your edits replace the code version.</p>}
      </fieldset>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">Packages (price is in US dollars)</legend>
        <div className="space-y-3">{f.packages.map((k, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
            <label><span className="mb-1 block text-xs font-semibold">Package name</span><input className={box} maxLength={40} value={k.name} onChange={(e) => setPk(i, { name: e.target.value })} /></label>
            <label><span className="mb-1 block text-xs font-semibold">Records</span><input className={box} inputMode="numeric" value={k.records} onChange={(e) => setPk(i, { records: Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0)) })} /></label>
            <label><span className="mb-1 block text-xs font-semibold">Price (USD)</span><input className={box} inputMode="decimal" value={price[i]} onChange={(e) => setPrice((p) => p.map((v, j) => (j === i ? e.target.value : v)))} /></label>
            <label className="flex items-center gap-2 py-2"><input type="checkbox" checked={k.highlighted} onChange={(e) => setPk(i, { highlighted: e.target.checked })} /> Recommended</label>
            <div className="py-2">{f.packages.length > 1 && <button type="button" onClick={() => removePk(i)} className="text-sm text-red-800 underline">Remove</button>}</div>
          </div>))}</div>
        {f.packages.length < 8 && <button type="button" onClick={addPk} className="mt-3 rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold">Add package</button>}
        {status === "published" && <p className="mt-3 text-xs">This product is published: every package needs a price above 0.</p>}
      </fieldset>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4">
        <legend className="px-1 font-semibold">FAQs on the product page ({f.faqs.length})</legend>
        <p className="mb-3 text-xs">Edit any question or answer, add your own, reorder or remove. While nothing is changed, the automatic FAQs keep following this product&rsquo;s data (record count, fields, dates). After you change them, your text is shown as written. Saved with &ldquo;Save changes&rdquo;.</p>
        <div className="space-y-3">
          {f.faqs.map((q, i) => (
            <div key={i} className="rounded-lg border border-sand-200 bg-sand-50 p-3">
              <input aria-label={`Question ${i + 1}`} className={box} value={q.q} maxLength={200} onChange={(e) => setFaq(i, { q: e.target.value })} placeholder="Question" />
              <textarea aria-label={`Answer ${i + 1}`} className={`${box} mt-2 h-24`} value={q.a} maxLength={1500} onChange={(e) => setFaq(i, { a: e.target.value })} placeholder="Answer" />
              <div className="mt-2 flex gap-2 text-xs">
                <button type="button" disabled={i === 0} onClick={() => moveFaq(i, -1)} className="rounded-full border border-sand-300 px-3 py-1 disabled:opacity-40">Up</button>
                <button type="button" disabled={i === f.faqs.length - 1} onClick={() => moveFaq(i, 1)} className="rounded-full border border-sand-300 px-3 py-1 disabled:opacity-40">Down</button>
                <button type="button" onClick={() => set("faqs", f.faqs.filter((_, j) => j !== i))} className="rounded-full border border-red-300 px-3 py-1 text-red-800">Remove</button>
              </div>
            </div>
          ))}
          {f.faqs.length === 0 && <p className="text-xs">No FAQs. Saving with an empty list brings back the automatic ones.</p>}
        </div>
        {f.faqs.length < 30 && <button type="button" onClick={() => set("faqs", [...f.faqs, { q: "", a: "" }])} className="mt-3 rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold">Add FAQ</button>}
        <button type="button" onClick={() => { if (window.confirm("Replace all FAQs with the automatic ones?")) set("faqs", autoFaqs); }} className="ml-2 mt-3 rounded-full border border-sand-300 px-4 py-1.5 text-sm">Reset to automatic</button>
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
        <legend className="px-1 font-semibold">Page URL</legend>
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm">/lists/</span><input aria-label="URL name" className={`${box} max-w-md flex-1`} value={slugIn} maxLength={140} onChange={(e) => setSlugIn(e.target.value)} /><button type="button" disabled={busy || slugIn.trim() === slugNow} onClick={changeSlug} className="rounded-full border border-forest-900 px-4 py-1.5 font-semibold disabled:opacity-40">Change URL</button></div>
        <p className="mt-2 text-xs">Saved at once, separate from &ldquo;Save changes&rdquo;. The old address redirects to the new one. Orders, delivery links and promotions move with it. Live within about a minute.</p>
        {slugMsg && <p role="status" aria-live="polite" className="mt-1 text-xs font-semibold text-forest-900">{slugMsg}</p>}
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
        <button type="button" disabled={busy} onClick={remove} className="rounded-full border border-red-700 px-4 py-2 font-semibold text-red-800 disabled:opacity-40">Delete product</button>
        {status === "published" && <a href={`/lists/${slugNow}`} target="_blank" rel="noreferrer" className="underline">View live page</a>}
        {msg && <span role="status" aria-live="polite" className="font-semibold text-forest-900">{msg}</span>}
      </div>
    </div>
  );
}
