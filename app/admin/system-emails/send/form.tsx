"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { previewManualAction, sendManualAction } from "./actions";

export type TemplateOption = { key: string; name: string; subject: string; heading: string };
export type Prefill = { orderId: string; email: string; product: string; pkg: string; records: string; paid: boolean };
type Btn = { label: string; url: string; variant: "primary" | "dark" | "outline" };

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-purple-600";
const lab = "mb-1 block text-xs font-bold text-forest-900";

export function ManualSendForm({ templates, prefill }: { templates: TemplateOption[]; prefill: Prefill }) {
  const toast = useToast();
  const first = templates.find((t) => t.key === "product_delivery") ?? templates[0];
  const [tkey, setTkey] = useState(first?.key ?? "");
  const [to, setTo] = useState(prefill.email);
  const [firstName, setFirstName] = useState("");
  const [orderId, setOrderId] = useState(prefill.orderId);
  const [product, setProduct] = useState(prefill.product);
  const [pkg, setPkg] = useState(prefill.pkg);
  const [records, setRecords] = useState(prefill.records);
  const [subject, setSubject] = useState(first?.subject ?? "");
  const [heading, setHeading] = useState(first?.heading ?? "");
  const [note, setNote] = useState("");
  const [buttons, setButtons] = useState<Btn[]>([{ label: "Download My List", url: "", variant: "primary" }]);
  const [html, setHtml] = useState("");
  const [checked, setChecked] = useState(false);
  const [mark, setMark] = useState(prefill.paid);
  const [pending, start] = useTransition();

  const payload = () => ({ templateKey: tkey, to, firstName, orderId, productName: product, packageName: pkg, records, subject, heading, note, buttons });
  const setBtn = (i: number, p: Partial<Btn>) => { setButtons((b) => b.map((x, j) => (j === i ? { ...x, ...p } : x))); setHtml(""); setChecked(false); };
  const changed = (f: (v: string) => void) => (e: { target: { value: string } }) => { f(e.target.value); setHtml(""); setChecked(false); };
  const pick = (k: string) => { const t = templates.find((x) => x.key === k); setTkey(k); if (t) { setSubject(t.subject); setHeading(t.heading); } setHtml(""); setChecked(false); };

  return (
    <div className="grid gap-6 p-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div><label className={lab} htmlFor="ms-t">Email template</label>
          <select id="ms-t" className={input} value={tkey} onChange={(e) => pick(e.target.value)}>{templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</select>
          <p className="mt-1 text-xs">Uses the live version of the template (same look and wording). Its own buttons are replaced by yours below.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={lab} htmlFor="ms-to">Send to (one person)</label><input id="ms-to" type="email" className={input} value={to} onChange={changed(setTo)} /></div>
          <div><label className={lab} htmlFor="ms-fn">First name (optional)</label><input id="ms-fn" className={input} value={firstName} onChange={changed(setFirstName)} /></div>
          <div><label className={lab} htmlFor="ms-o">Order ID (optional)</label><input id="ms-o" className={input} value={orderId} onChange={changed(setOrderId)} /></div>
          <div><label className={lab} htmlFor="ms-p">Product name</label><input id="ms-p" className={input} value={product} onChange={changed(setProduct)} /></div>
          <div><label className={lab} htmlFor="ms-k">Package</label><input id="ms-k" className={input} value={pkg} onChange={changed(setPkg)} /></div>
          <div><label className={lab} htmlFor="ms-r">Records</label><input id="ms-r" className={input} value={records} onChange={changed(setRecords)} /></div>
        </div>
        <div><label className={lab} htmlFor="ms-s">Subject</label><input id="ms-s" className={input} value={subject} onChange={changed(setSubject)} /></div>
        <div><label className={lab} htmlFor="ms-h">Heading</label><input id="ms-h" className={input} value={heading} onChange={changed(setHeading)} /></div>
        <div><label className={lab} htmlFor="ms-n">Personal note (optional, shown first)</label><textarea id="ms-n" rows={3} className={input} value={note} onChange={changed(setNote)} /></div>

        <fieldset className="space-y-3">
          <legend className={lab}>Buttons and links (1 to 5)</legend>
          {buttons.map((b, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-sand-200 p-3 sm:grid-cols-[1fr_2fr_auto]">
              <input aria-label={`Button ${i + 1} label`} placeholder="Button label" className={input} value={b.label} onChange={(e) => setBtn(i, { label: e.target.value })} />
              <input aria-label={`Button ${i + 1} link`} placeholder="https://…" className={input} value={b.url} onChange={(e) => setBtn(i, { url: e.target.value })} />
              <div className="flex gap-2">
                <select aria-label={`Button ${i + 1} style`} className={input} value={b.variant} onChange={(e) => setBtn(i, { variant: e.target.value as Btn["variant"] })}><option value="primary">Purple</option><option value="dark">Dark green</option><option value="outline">Outline</option></select>
                {buttons.length > 1 && <Button type="button" size="sm" variant="secondary" onClick={() => { setButtons((x) => x.filter((_, j) => j !== i)); setHtml(""); setChecked(false); }}>Remove</Button>}
              </div>
            </div>
          ))}
          {buttons.length < 5 && <Button type="button" size="sm" variant="secondary" onClick={() => setButtons((b) => [...b, { label: "", url: "", variant: "outline" }])}>Add another button</Button>}
        </fieldset>

        <Button type="button" disabled={pending} onClick={() => start(async () => {
          const r = await previewManualAction(payload());
          if (r.ok) { setHtml(r.html); setChecked(false); } else { setHtml(""); toast(false, r.error); }
        })}>Preview email</Button>
      </div>

      <div className="space-y-4">
        {html ? (
          <>
            <iframe title="Email preview" sandbox="" srcDoc={html} className="h-[34rem] w-full rounded-xl border border-sand-200 bg-white" />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} />I checked the preview, the address and every link. This goes to {to || "the address above"} only.</label>
            {prefill.paid && orderId === prefill.orderId && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={mark} onChange={(e) => setMark(e.target.checked)} />Mark this order as delivered, so the automatic delivery does not email the buyer again.</label>}
            <Button type="button" disabled={pending || !checked} onClick={() => start(async () => {
              const r = await sendManualAction(payload(), { markDelivered: mark && prefill.paid && orderId === prefill.orderId, confirmed: checked });
              toast(r.ok, r.ok ? `Sent to ${r.to}.${r.marked ? " Order marked as delivered." : ""}` : r.error);
              if (r.ok) { setHtml(""); setChecked(false); }
            })}>Send to this person</Button>
          </>
        ) : <p className="rounded-xl bg-sand-100 p-4 text-sm">Press “Preview email” to see exactly what the person will receive. The send button appears after that.</p>}
      </div>
    </div>
  );
}
