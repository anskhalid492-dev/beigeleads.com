"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "../import/actions";

const box = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";
const PK = ["Starter", "Professional", "Complete"] as const;

export function NewForm({ categories, countries }: { categories: string[]; countries: { name: string; code: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", categoryName: "", countryName: "", countryCode: "", region: "", channel: "business-email", description: "", records: "", fields: "", fileFormats: "", coverage: "", lastUpdated: "", seoTitle: "", metaDescription: "" });
  const [pk, setPk] = useState(PK.map((n, i) => ({ name: n, on: true, records: "", price: "", rec: i === 1 })));
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const pickCountry = (name: string) => { const k = countries.find((c) => c.name.toLowerCase() === name.toLowerCase()); setF((x) => ({ ...x, countryName: name, countryCode: k ? k.code : x.countryCode })); };
  const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/[^\d]/g, "")) || 0));

  async function save() {
    setBusy(true); setMsg("Saving...");
    try {
      const packages = pk.filter((p) => p.on).map((p) => ({ name: p.name, records: num(p.records), priceUsdCents: Math.round((Number(p.price) || 0) * 100), highlighted: p.rec }));
      const r = await createProductAction({
        name: f.name, title: "", description: f.description, seoTitle: f.seoTitle, metaDescription: f.metaDescription, recordCount: f.records ? num(f.records) : null,
        dataFields: f.fields.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean), fileFormats: f.fileFormats, coverage: f.coverage, lastUpdated: f.lastUpdated, placeholder: false, forSale: true,
        packages, categoryName: f.categoryName, countryName: f.countryName, countryCode: f.countryCode, region: f.region, channel: f.channel,
      });
      if (r.ok && r.id) router.push(`/admin/products/imported/${r.id}`); else setMsg(r.message);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div className="max-w-3xl space-y-5 text-sm">
      <label className="block"><span className="mb-1 block font-semibold">Name (page heading)</span><input className={box} value={f.name} maxLength={200} onChange={(e) => set("name", e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-xs font-semibold">Category / industry</span><input className={box} list="cats" value={f.categoryName} maxLength={120} onChange={(e) => set("categoryName", e.target.value)} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></label>
        <label><span className="mb-1 block text-xs font-semibold">Channel</span><select className={box} value={f.channel} onChange={(e) => set("channel", e.target.value)}><option value="business-email">Business email</option><option value="consumer-email">Consumer email</option><option value="phone">Phone</option><option value="email">Email</option></select></label>
        <label><span className="mb-1 block text-xs font-semibold">Country</span><input className={box} list="ctry" value={f.countryName} maxLength={80} onChange={(e) => pickCountry(e.target.value)} /><datalist id="ctry">{countries.map((c) => <option key={c.name} value={c.name} />)}</datalist></label>
        <label><span className="mb-1 block text-xs font-semibold">Country code (2 letters, e.g. US)</span><input className={box} value={f.countryCode} maxLength={8} onChange={(e) => set("countryCode", e.target.value)} /></label>
        <label><span className="mb-1 block text-xs font-semibold">State / region (optional)</span><input className={box} value={f.region} maxLength={80} onChange={(e) => set("region", e.target.value)} /></label>
        <label><span className="mb-1 block text-xs font-semibold">Records (total)</span><input className={box} inputMode="numeric" value={f.records} onChange={(e) => set("records", e.target.value)} /></label>
        <label><span className="mb-1 block text-xs font-semibold">Last updated</span><input type="date" className={box} value={f.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} /></label>
        <label><span className="mb-1 block text-xs font-semibold">File formats</span><input className={box} placeholder="CSV, Excel or TXT" value={f.fileFormats} onChange={(e) => set("fileFormats", e.target.value)} /></label>
      </div>
      <label className="block"><span className="mb-1 block text-xs font-semibold">Coverage (optional, otherwise automatic)</span><input className={box} value={f.coverage} maxLength={160} onChange={(e) => set("coverage", e.target.value)} /></label>
      <label className="block"><span className="mb-1 block font-semibold">Description</span><textarea className={`${box} h-24`} value={f.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-xs font-semibold">Data fields (one per line)</span><textarea className={`${box} h-24`} value={f.fields} onChange={(e) => set("fields", e.target.value)} /></label>
      <fieldset className="rounded-xl border border-sand-200 bg-white p-4"><legend className="px-1 font-semibold">Packages (price in US dollars)</legend>
        <div className="space-y-3">{pk.map((p, i) => (
          <div key={p.name} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
            <label className="flex items-center gap-2 py-2 font-semibold"><input type="checkbox" checked={p.on} onChange={(e) => setPk((a) => a.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} /> {p.name}</label>
            <label><span className="mb-1 block text-xs font-semibold">Records</span><input className={box} inputMode="numeric" value={p.records} onChange={(e) => setPk((a) => a.map((x, j) => (j === i ? { ...x, records: e.target.value } : x)))} /></label>
            <label><span className="mb-1 block text-xs font-semibold">Price (USD)</span><input className={box} inputMode="decimal" value={p.price} onChange={(e) => setPk((a) => a.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /></label>
            <label className="flex items-center gap-2 py-2"><input type="checkbox" checked={p.rec} onChange={(e) => setPk((a) => a.map((x, j) => (j === i ? { ...x, rec: e.target.checked } : x)))} /> Recommended</label>
          </div>))}</div>
      </fieldset>
      <div className="grid gap-3"><label><span className="mb-1 block text-xs font-semibold">SEO title (optional)</span><input className={box} value={f.seoTitle} maxLength={200} onChange={(e) => set("seoTitle", e.target.value)} /></label>
        <label><span className="mb-1 block text-xs font-semibold">Meta description (optional)</span><textarea className={`${box} h-16`} value={f.metaDescription} maxLength={400} onChange={(e) => set("metaDescription", e.target.value)} /></label></div>
      <div className="flex items-center gap-3"><button type="button" disabled={busy} onClick={save} className="rounded-full bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-40">Create draft</button>{msg && <span role="status" aria-live="polite" className="font-semibold">{msg}</span>}</div>
    </div>
  );
}
