"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_TYPES, cleanWebsite } from "@/lib/partners/types";

type Field = "fullName" | "businessName" | "email" | "website" | "country" | "type" | "plan" | "terms";
type Values = { fullName: string; businessName: string; email: string; website: string; country: string; type: string; plan: string; volume: string; notes: string; terms: boolean };

const TEST_SITE_KEY = "1x00000000000000000000AA";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputClass =
  "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 aria-[invalid=true]:border-red-700";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.fullName.trim().length < 2) e.fullName = "Enter your full name.";
  if (v.businessName.trim().length < 2) e.businessName = "Enter your business name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid business email, like name@company.com.";
  if (!cleanWebsite(v.website)) e.website = "Enter a valid website address, like example.com.";
  if (v.country.trim().length < 2) e.country = "Enter your country.";
  if (!v.type) e.type = "Choose your business type.";
  if (v.plan.trim().length < 20) e.plan = "Tell us a little more: at least a sentence about how you plan to resell.";
  if (!v.terms) e.terms = "Accept the Partner Program Terms to apply.";
  return e;
}

export function PartnerForm() {
  const uid = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [v, setV] = useState<Values>({ fullName: "", businessName: "", email: "", website: "", country: "", type: "", plan: "", volume: "", notes: "", terms: false });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ reference: string; email: string } | null>(null);

  const errors = validate(v);
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);
  const set = (f: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((x) => ({ ...x, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  function mountWidget() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { mountWidget(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const order: Field[] = ["fullName", "businessName", "email", "website", "country", "type", "plan", "terms"];
    setTouched(Object.fromEntries(order.map((f) => [f, true])));
    const first = order.find((f) => errors[f]);
    if (first) { document.getElementById(`${uid}-${first}`)?.focus(); return; }
    if (!token) { setFormError("Please complete the spam check first."); return; }
    setFormError("");
    setState("sending");
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: v.fullName.trim(), businessName: v.businessName.trim(), email: v.email.trim(), websiteUrl: v.website.trim(), country: v.country.trim(),
          businessType: v.type, resalePlan: v.plan.trim(), monthlyVolume: v.volume.trim() || undefined, notes: v.notes.trim() || undefined, terms: v.terms, turnstileToken: token,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reference?: string; email?: string };
      if (res.ok && data.ok) { setResult({ reference: data.reference ?? "", email: data.email ?? "received" }); setState("done"); return; }
      setFormError(data.error ?? "Something went wrong. Try again.");
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    }
    setState("idle");
    setToken("");
    window.turnstile?.reset(widgetId.current);
  }

  if (state === "done" && result) return <Success result={result} />;

  const err = (f: Field) => (show(f) ? `${uid}-${f}-err` : undefined);
  const errMsg = (f: Field) => (show(f) ? <p id={`${uid}-${f}-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{errors[f]}</p> : null);
  const label = "mb-1.5 block text-sm font-semibold text-forest-900";
  const opt = <span className="font-normal text-forest-500">(optional)</span>;

  return (
    <form id="partner-form" onSubmit={onSubmit} noValidate className="relative scroll-mt-28 rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] sm:p-8">
      <h2 className="display text-4xl text-forest-900 sm:text-5xl">Apply to become a partner</h2>
      <p className="mt-2 text-base">It takes about two minutes. Fields marked * are required.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-fullName`} className={label}>Full name *</label>
          <input id={`${uid}-fullName`} type="text" autoComplete="name" maxLength={120} value={v.fullName} onChange={set("fullName")} onBlur={blur("fullName")} aria-invalid={!!show("fullName")} aria-describedby={err("fullName")} className={inputClass} />
          {errMsg("fullName")}
        </div>
        <div>
          <label htmlFor={`${uid}-businessName`} className={label}>Business name *</label>
          <input id={`${uid}-businessName`} type="text" autoComplete="organization" maxLength={160} value={v.businessName} onChange={set("businessName")} onBlur={blur("businessName")} aria-invalid={!!show("businessName")} aria-describedby={err("businessName")} className={inputClass} />
          {errMsg("businessName")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={label}>Business email *</label>
          <input id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" value={v.email} onChange={set("email")} onBlur={blur("email")} aria-invalid={!!show("email")} aria-describedby={err("email")} className={inputClass} />
          {errMsg("email")}
        </div>
        <div>
          <label htmlFor={`${uid}-website`} className={label}>Website URL *</label>
          <input id={`${uid}-website`} type="text" inputMode="url" autoComplete="url" placeholder="example.com" maxLength={300} value={v.website} onChange={set("website")} onBlur={blur("website")} aria-invalid={!!show("website")} aria-describedby={err("website")} className={inputClass} />
          {errMsg("website")}
        </div>
        <div>
          <label htmlFor={`${uid}-country`} className={label}>Country *</label>
          <input id={`${uid}-country`} type="text" autoComplete="country-name" maxLength={80} value={v.country} onChange={set("country")} onBlur={blur("country")} aria-invalid={!!show("country")} aria-describedby={err("country")} className={inputClass} />
          {errMsg("country")}
        </div>
        <div>
          <label htmlFor={`${uid}-type`} className={label}>Business type *</label>
          <select id={`${uid}-type`} value={v.type} onChange={set("type")} onBlur={blur("type")} aria-invalid={!!show("type")} aria-describedby={err("type")} className={inputClass}>
            <option value="" disabled>Choose one</option>
            {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errMsg("type")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-plan`} className={label}>How do you plan to resell our data? *</label>
          <textarea id={`${uid}-plan`} rows={4} maxLength={2000} value={v.plan} onChange={set("plan")} onBlur={blur("plan")} aria-invalid={!!show("plan")} aria-describedby={err("plan")} className={inputClass} />
          {errMsg("plan")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-volume`} className={label}>Estimated monthly purchase volume {opt}</label>
          <input id={`${uid}-volume`} type="text" maxLength={120} placeholder="For example: 2 to 3 lists a month" value={v.volume} onChange={set("volume")} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-notes`} className={label}>Additional information {opt}</label>
          <textarea id={`${uid}-notes`} rows={3} maxLength={2000} value={v.notes} onChange={set("notes")} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input id={`${uid}-terms`} type="checkbox" checked={v.terms} onChange={(e) => setV((x) => ({ ...x, terms: e.target.checked }))} onBlur={blur("terms")} aria-invalid={!!show("terms")} aria-describedby={err("terms")}
              className="mt-0.5 size-5 shrink-0 rounded border-sand-300 accent-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600" />
            <span>I accept the <a href="#terms" className="font-semibold underline underline-offset-4">Partner Program Terms</a> and the <Link href="/legal/lawful-use" className="font-semibold underline underline-offset-4">lawful use policy</Link>. *</span>
          </label>
          {errMsg("terms")}
        </div>
      </div>

      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />
      <div ref={widgetRef} className="mt-5" />

      {formError && <p role="alert" className="mt-4 rounded-xl border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">{formError}</p>}

      <Button type="submit" size="lg" disabled={state === "sending"} className="mt-5 w-full">
        {state === "sending" ? (<><Loader2 className="size-4 animate-spin" aria-hidden />Submitting your application</>) : "Submit Partner Application"}
      </Button>
      <p className="mt-3 text-center text-sm">We use your details only to review this application. See our <Link href="/legal/privacy" className="font-semibold underline underline-offset-4">privacy policy</Link>.</p>
    </form>
  );
}

function Success({ result }: { result: { reference: string; email: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] outline-none sm:p-8">
      <CheckCircle2 className="size-10 text-forest-500" aria-hidden />
      <h2 className="display mt-3 text-4xl text-forest-900 sm:text-5xl">Application received!</h2>
      <p className="mt-2 text-base">Our team will review your request and respond within 7 days. Please check your email for confirmation.</p>
      {result.email === "failed" || result.email === "skipped" ? <p className="mt-3 rounded-xl bg-sand-100 px-4 py-3 text-sm">We saved your application, but the confirmation email could not be sent right now. Keep your reference below; your application is still in review.</p> : null}
      <dl className="mt-5 rounded-2xl bg-sand-100 p-4 text-sm"><div className="flex justify-between gap-4"><dt className="font-semibold text-forest-900">Reference</dt><dd className="font-mono font-semibold text-forest-900">{result.reference}</dd></div></dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="secondary"><Link href="/lists">Browse lists</Link></Button>
        <Button asChild variant="ghost"><Link href="/">Back to home</Link></Button>
      </div>
    </div>
  );
}
