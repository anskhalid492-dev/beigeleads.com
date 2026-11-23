import Link from "next/link";
import { ClipboardList, CreditCard, LifeBuoy, Mail, MessageSquareText, ShieldCheck, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARDS = [
  { icon: Mail, title: "General Inquiries", text: "Questions about BeigeLeads, how lists work, or whether a list fits your campaign.", cta: "Ask a question", href: "/contact?type=general#contact-form" },
  { icon: CreditCard, title: "Order & Payment Support", text: "Help with an existing order, a payment, or delivery of your list.", cta: "Get order help", href: "/contact?type=order#contact-form" },
  { icon: ClipboardList, title: "Custom Data Requests", text: "Need a niche, location or set of fields you cannot find? Describe it in the custom list builder.", cta: "Open the builder", href: "/custom-list" },
  { icon: LifeBuoy, title: "Help Center", text: "Step-by-step answers on payments, delivery, data quality and policies, available any time.", cta: "Browse the Help Center", href: "/help-center" },
] as const;

export function SupportCards() {
  return (
    <section aria-labelledby="support-h" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 id="support-h" className="display max-w-2xl text-5xl text-forest-900 sm:text-6xl">Pick the fastest way to get help.</h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <li key={c.title} className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(15,42,29,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <span className="grid size-11 place-items-center rounded-xl bg-forest-100 text-forest-700"><c.icon className="size-5" aria-hidden /></span>
            <h3 className="mt-4 text-xl font-bold text-forest-900">{c.title}</h3>
            <p className="mt-2 flex-1 text-base">{c.text}</p>
            <Button asChild variant="secondary" size="sm" className="mt-5 self-start"><Link href={c.href}>{c.cta}</Link></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const TRUST = [
  { icon: MessageSquareText, title: "Read by our team", text: "Product and order messages go straight to the BeigeLeads team." },
  { icon: Waypoints, title: "Clear communication", text: "Every message gets a reference number and a confirmation email, so you know it arrived." },
  { icon: ShieldCheck, title: "Handled with care", text: "Your details are used only to answer your message and are never shown on the site." },
  { icon: LifeBuoy, title: "Help Center access", text: "Policies and how-to answers stay open to everyone, with no account needed." },
] as const;

export function TrustStrip() {
  return (
    <section aria-labelledby="trust-h" className="border-y border-sand-200 bg-sand-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="trust-h" className="display text-4xl text-forest-900 sm:text-5xl">What to expect when you write to us.</h2>
        <ul className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="flex gap-3">
              <t.icon className="mt-0.5 size-5 shrink-0 text-forest-500" aria-hidden />
              <div><h3 className="text-base font-bold text-forest-900">{t.title}</h3><p className="mt-1 text-base">{t.text}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function QuickLinks() {
  const links = [["Delivery policy", "/legal/delivery"], ["Refund & replacement", "/legal/refund-replacement"], ["How verification works", "/verification"], ["Opt-out request", "/opt-out"]] as const;
  return (
    <div className="mt-8 rounded-2xl border border-sand-200 bg-white/70 p-5">
      <p className="text-sm font-bold text-forest-900">Your answer may already be here</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map(([l, h]) => (
          <li key={h}><Link href={h} className="inline-block rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900 transition-colors hover:bg-sand-100">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
