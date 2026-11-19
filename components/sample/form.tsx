"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SampleOption = { value: string; label: string; group: string; fields: number };
type Delivery = "sent" | "failed" | "not_configured" | "received";

const TEST_SITE_KEY = "1x00000000000000000000AA";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputClass =
  "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 aria-[invalid=true]:border-red-700";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

export function SampleForm({ options, initialProduct, initialCustom }: { options: readonly SampleOption[]; initialProduct: string; initialCustom: string }) {
  const uid = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState(initialProduct);
  const [custom, setCustom] = useState(initialCustom);
  const [customOpen, setCustomOpen] = useState(!!initialCustom);
  const [errors, setErrors] = useState<{ email?: string; target?: string; form?: string }>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ delivery: Delivery; label: string; email: string } | null>(null);

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

  const selected = options.find((o) => o.value === product);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address, like name@company.com.";
    if (!product && !custom.trim()) next.target = "Choose a list, or tell us what you need.";
    if (!token) next.form = "Please complete the spam check first.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = next.email ? "email" : next.target ? "target" : null;
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/sample", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), product: product || undefined, custom: product ? undefined : custom.trim() || undefined, turnstileToken: token }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; delivery?: Delivery; label?: string };
      if (res.ok && data.ok) {
        setResult({ delivery: data.delivery ?? "received", label: data.label ?? selected?.label ?? custom.trim(), email: email.trim() });
        setState("done");
        window.dispatchEvent(new CustomEvent("bl:sample-requested"));
        return;
      }
      setErrors({ form: data.error ?? "Something went wrong. Try again." });
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection and try again." });
    }
    setState("idle");
    setToken("");
    window.turnstile?.reset(widgetId.current);
  }

  if (state === "done" && result) return <Success result={result} />;

  return (
    <form id="sample-form" onSubmit={onSubmit} noValidate className="scroll-mt-28 rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] sm:p-8">
      <h2 className="display text-4xl text-forest-900 sm:text-5xl">Get your free sample</h2>
      <p className="mt-2 text-base">Two fields. We send a masked sample so you can check the structure before you buy.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block text-sm font-semibold text-forest-900">Work email</label>
          <input
            id={`${uid}-email`} type="email" inputMode="email" autoComplete="email" placeholder="name@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined}
            className={inputClass}
          />
          {errors.email && <p id={`${uid}-email-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{errors.email}</p>}
        </div>

        <div>
          <ListSelect
            id={`${uid}-target`} options={options} value={product}
            onChange={(v) => { setProduct(v); if (v) { setCustom(""); } setErrors((x) => ({ ...x, target: undefined })); }}
            invalid={!!errors.target} describedBy={errors.target ? `${uid}-target-err` : undefined}
          />
          {errors.target && <p id={`${uid}-target-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{errors.target}</p>}

          {selected && (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-forest-100 bg-forest-100/60 p-3 text-sm" aria-live="polite">
              <Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />
              <p>
                <strong className="text-forest-900">{selected.label}</strong>
                <span className="block">{selected.group} · {selected.fields} fields · <Link href={`/product/${selected.value}`} className="font-semibold underline underline-offset-4">View list details</Link></span>
              </p>
            </div>
          )}

          {!product && (
            <div className="mt-3">
              {customOpen ? (
                <>
                  <label htmlFor={`${uid}-custom`} className="mb-1.5 block text-sm font-semibold text-forest-900">Can&rsquo;t find your list? (optional)</label>
                  <input
                    id={`${uid}-custom`} type="text" maxLength={300} placeholder="e.g. Veterinary clinics in Texas"
                    value={custom} onChange={(e) => { setCustom(e.target.value); setErrors((x) => ({ ...x, target: undefined })); }}
                    className={inputClass}
                  />
                </>
              ) : (
                <button type="button" onClick={() => setCustomOpen(true)} className="text-sm font-semibold text-forest-700 underline underline-offset-4 hover:text-forest-900">
                  Can&rsquo;t find your list? Tell us what you need
                </button>
              )}
            </div>
          )}
        </div>

        {/* Honeypot: hidden from people, bots fill it. */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />
        <div ref={widgetRef} />

        {errors.form && <p role="alert" className="rounded-xl border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">{errors.form}</p>}

        <Button type="submit" size="lg" disabled={state === "sending"} className="w-full">
          {state === "sending" ? (<><Loader2 className="size-4 animate-spin" aria-hidden />Sending your request</>) : "Send My Free Sample"}
        </Button>
        <p className="text-center text-sm font-medium text-forest-900">No payment details required.</p>
      </div>
    </form>
  );
}

function ListSelect({ id, options, value, onChange, invalid, describedBy }: {
  id: string; options: readonly SampleOption[]; value: string; onChange: (v: string) => void; invalid: boolean; describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => `${o.label} ${o.group}`.toLowerCase().includes(s)) : options;
  }, [q, options]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  function choose(v: string) { onChange(v); setQ(""); setOpen(false); }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && open) { e.preventDefault(); if (list[hi]) choose(list[hi].value); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={wrap} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest-900">Which list would you like to preview?</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
        <input
          id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" autoComplete="off"
          aria-activedescendant={open && list[hi] ? `${id}-o-${list[hi].value}` : undefined}
          aria-invalid={invalid} aria-describedby={describedBy}
          placeholder={current ? current.label : "Search lists, e.g. dentists"}
          value={open ? q : current?.label ?? ""}
          onFocus={() => { setOpen(true); setHi(0); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); if (value) onChange(""); }}
          onKeyDown={key}
          className={`${inputClass} pl-10 pr-10`}
        />
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-sand-300 bg-white p-1 shadow-lg">
          {list.length === 0 && <li className="px-3 py-3 text-sm">No list matches &ldquo;{q}&rdquo;. Use &ldquo;Can&rsquo;t find your list?&rdquo; below.</li>}
          {list.map((o, i) => (
            <li
              key={o.value} id={`${id}-o-${o.value}`} role="option" aria-selected={o.value === value}
              onMouseDown={(e) => { e.preventDefault(); choose(o.value); }}
              onMouseEnter={() => setHi(i)}
              className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm ${i === hi ? "bg-forest-100" : ""}`}
            >
              <span className="font-semibold text-forest-900">{o.label}</span>
              <span className="ml-2 text-forest-500">{o.group}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Success({ result }: { result: { delivery: Delivery; label: string; email: string } }) {
  const note =
    result.delivery === "sent"
      ? `A confirmation email was handed to our email service for ${result.email}. If it does not show up, check your spam folder.`
      : result.delivery === "received"
        ? "Your request is saved with our team."
        : "Your request is saved, but we could not send the confirmation email right now. Our team will follow up with you by email.";
  return (
    <div role="status" className="stamp rounded-3xl border-2 border-forest-900 bg-forest-100 p-6 shadow-[0_30px_70px_-35px_rgba(15,42,29,0.55)] sm:p-8">
      <h2 className="display text-4xl text-forest-900 sm:text-5xl">Your sample request is in!</h2>
      <p className="mt-3">We&rsquo;ve received your request. Check your inbox for delivery updates.</p>
      <dl className="mt-5 rounded-xl bg-white/70 p-4 text-sm">
        <dt className="font-semibold text-forest-900">Requested</dt>
        <dd className="mt-0.5">{result.label}</dd>
        <dt className="mt-3 font-semibold text-forest-900">What happens next</dt>
        <dd className="mt-0.5">{note} Samples are prepared by our team and contain masked data only. We do not give a delivery time here.</dd>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/lists">Browse Available Lists</Link></Button>
        <Button asChild variant="secondary"><Link href="/custom-list">Explore Custom Lists</Link></Button>
      </div>
      <p className="mt-4 text-sm">Questions? <Link href="/contact" className="font-semibold underline underline-offset-4">Contact support</Link>.</p>
    </div>
  );
}
