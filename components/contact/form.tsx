"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INQUIRY_TYPES, inquiryLabel, isOrderType } from "@/lib/contact/types";

type Delivery = "sent" | "failed" | "not_configured" | "received";
type Field = "name" | "email" | "type" | "order" | "subject" | "message";

const TEST_SITE_KEY = "1x00000000000000000000AA";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputClass =
  "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 aria-[invalid=true]:border-red-700";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

type Values = { name: string; email: string; type: string; order: string; subject: string; message: string };

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address, like name@company.com.";
  if (!v.type) e.type = "Choose what your message is about.";
  if (v.order && !/^[A-Za-z0-9#\-_ ]{0,60}$/.test(v.order)) e.order = "Use letters, numbers and dashes only.";
  if (v.subject.trim().length < 3) e.subject = "Add a short subject.";
  if (v.message.trim().length < 10) e.message = "Write at least a sentence so we can help.";
  return e;
}

export function ContactForm({ initialType = "" }: { initialType?: string }) {
  const uid = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [v, setV] = useState<Values>({ name: "", email: "", type: INQUIRY_TYPES.some((t) => t.value === initialType) ? initialType : "", order: "", subject: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ reference: string; delivery: Delivery; email: string; type: string } | null>(null);

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
    setTouched({ name: true, email: true, type: true, order: true, subject: true, message: true });
    const order: Field[] = ["name", "email", "type", "order", "subject", "message"];
    const first = order.find((f) => errors[f]);
    if (first) { document.getElementById(`${uid}-${first}`)?.focus(); return; }
    if (!token) { setFormError("Please complete the spam check first."); return; }
    setFormError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: v.name.trim(), email: v.email.trim(), inquiryType: v.type,
          orderNumber: isOrderType(v.type) && v.order.trim() ? v.order.trim() : undefined,
          subject: v.subject.trim(), message: v.message.trim(), turnstileToken: token,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reference?: string; delivery?: Delivery };
      if (res.ok && data.ok) {
        setResult({ reference: data.reference ?? "", delivery: data.delivery ?? "received", email: v.email.trim(), type: v.type });
        setState("done");
        return;
      }
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

  return (
    <form id="contact-form" onSubmit={onSubmit} noValidate className="scroll-mt-28 rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] sm:p-8">
      <h2 className="display text-4xl text-forest-900 sm:text-5xl">Send us a message</h2>
      <p className="mt-2 text-base">Tell us what you need and our team will read it. Fields marked * are required.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={label}>Full name *</label>
          <input id={`${uid}-name`} type="text" autoComplete="name" maxLength={120} value={v.name} onChange={set("name")} onBlur={blur("name")}
            aria-invalid={!!show("name")} aria-describedby={err("name")} className={inputClass} />
          {errMsg("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={label}>Business email *</label>
          <input id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" value={v.email} onChange={set("email")} onBlur={blur("email")}
            aria-invalid={!!show("email")} aria-describedby={err("email")} className={inputClass} />
          {errMsg("email")}
        </div>

        <div className={isOrderType(v.type) ? "" : "sm:col-span-2"}>
          <label htmlFor={`${uid}-type`} className={label}>Inquiry type *</label>
          <select id={`${uid}-type`} value={v.type} onChange={set("type")} onBlur={blur("type")}
            aria-invalid={!!show("type")} aria-describedby={err("type")} className={inputClass}>
            <option value="" disabled>Choose a topic</option>
            {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errMsg("type")}
        </div>
        {isOrderType(v.type) && (
          <div className="cl-fade">
            <label htmlFor={`${uid}-order`} className={label}>Order number <span className="font-normal text-forest-500">(if you have it)</span></label>
            <input id={`${uid}-order`} type="text" maxLength={60} value={v.order} onChange={set("order")} onBlur={blur("order")}
              aria-invalid={!!show("order")} aria-describedby={err("order")} className={inputClass} />
            {errMsg("order")}
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-subject`} className={label}>Subject *</label>
          <input id={`${uid}-subject`} type="text" maxLength={150} value={v.subject} onChange={set("subject")} onBlur={blur("subject")}
            aria-invalid={!!show("subject")} aria-describedby={err("subject")} className={inputClass} />
          {errMsg("subject")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-message`} className={label}>Message *</label>
          <textarea id={`${uid}-message`} rows={6} maxLength={3000} value={v.message} onChange={set("message")} onBlur={blur("message")}
            aria-invalid={!!show("message")} aria-describedby={err("message")} className={inputClass} />
          <div className="mt-1.5 flex justify-between gap-3 text-sm">
            <span className="min-w-0">{errMsg("message")}</span>
            <span className="ml-auto shrink-0 text-forest-500" aria-hidden>{v.message.length}/3000</span>
          </div>
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
        {state === "sending" ? (<><Loader2 className="size-4 animate-spin" aria-hidden />Sending your message</>) : "Send My Message"}
      </Button>
      <p className="mt-3 text-center text-sm text-forest-700">
        We use your details only to answer this message. See our <Link href="/legal/privacy" className="font-semibold underline underline-offset-4">privacy policy</Link>.
      </p>
    </form>
  );
}

function Success({ result }: { result: { reference: string; delivery: Delivery; email: string; type: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const mail =
    result.delivery === "sent" ? `We sent a confirmation to ${result.email}. If you do not see it, check your spam folder.`
    : result.delivery === "received" ? "We saved your message. If you already sent this one, we did not create a second copy."
    : "We saved your message, but the confirmation email could not be sent. Keep your reference below.";
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] outline-none sm:p-8">
      <CheckCircle2 className="size-10 text-forest-500" aria-hidden />
      <h2 className="display mt-3 text-4xl text-forest-900 sm:text-5xl">Message received</h2>
      <p className="mt-2 text-base">{mail}</p>
      <dl className="mt-5 grid gap-3 rounded-2xl bg-sand-100 p-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="font-semibold text-forest-900">Reference</dt><dd className="font-mono font-semibold text-forest-900">{result.reference}</dd></div>
        <div className="flex justify-between gap-4"><dt className="font-semibold text-forest-900">Topic</dt><dd>{inquiryLabel(result.type)}</dd></div>
      </dl>
      <p className="mt-5 text-base">While you wait, the Help Center answers most questions about delivery, payments and policies.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="secondary"><Link href="/help-center">Visit the Help Center</Link></Button>
        <Button asChild variant="ghost"><Link href="/">Back to home</Link></Button>
      </div>
    </div>
  );
}
