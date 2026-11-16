import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MailCheck, ServerCog, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { Button } from "@/components/ui/button";
import { VerifyRing } from "@/components/data-sources/verify-ring";

// NEEDS LAWYER REVIEW. Every claim comes from the owner's description (CLAUDE.md section 21):
// in-house SMTP checks, everything re-verified every 60 days. No accuracy percentage or delivery
// guarantee may be added until a measurement method exists.
export const metadata: Metadata = {
  title: "Data verification: how we check every email",
  description: "How BeigeLeads checks email addresses with in-house SMTP tests, how often records are re-verified, and what verification cannot promise.",
  alternates: { canonical: "/verification" },
  robots: { index: false, follow: true }, // remove with the site-wide noindex at launch
};

const wrap = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

const checks = [
  { icon: ServerCog, t: "We ask the mail server", d: "Our own team runs an SMTP check. It asks the recipient's mail server whether it accepts the address. No message is sent to the person." },
  { icon: MailCheck, t: "We keep what passes", d: "An address that the server accepts stays in the record. This applies to every address, including ones taken from a company's published email and ones worked out from its naming pattern." },
  { icon: Trash2, t: "We fix or drop what fails", d: "A record that fails is corrected or removed. It is not shipped in a file." },
  { icon: CalendarClock, t: "We check again every 60 days", d: "All data is re-verified every 60 days. Each list page shows the date it was last verified, so you can judge freshness before you buy." },
] as const;

const faq = [
  ["What does verification mean here?", "Our in-house team runs SMTP checks on email addresses, then re-checks all data every 60 days. It means a mail server accepted the address when we checked. It does not mean the person reads or answers email."],
  ["Does a verified email always reach an inbox?", "No. Some mail servers accept every address, so a small share can still bounce. Delivery also depends on your sending domain, your message and how recipients react. We do not promise a delivery rate."],
  ["What is your accuracy percentage?", "We do not publish one yet. Accuracy figures on product pages are marked as placeholders until we have a measurement method we can stand behind. We will not show a number we cannot back."],
  ["How do I check quality before I buy?", "Request a free sample. It is masked, but it shows the real columns, and each list page shows its record count and the date it was last verified."],
  ["What happens if addresses bounce?", "Our refund and replacement policy covers bounced contacts. It is still being finalised under legal review, so read the current wording on that page rather than relying on a summary here."],
  ["How often do you re-check?", "Every 60 days, for all data."],
] as const;

export default function VerificationPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest-900 text-sand-100">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 60% at 85% 20%, rgba(143,208,169,0.2), transparent 70%)" }} />
        <div className="relative">
          <div className="[&_a]:text-sand-200 [&_li>span]:text-forest-300 [&_span[aria-current]]:text-sand-50">
            <Breadcrumbs wide="xl" items={[{ name: "Data verification", href: "/verification" }]} />
          </div>
          <div className={`${wrap} grid gap-14 pb-24 pt-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:pb-32 lg:pt-20`}>
            <div>
              <h1 className="display text-6xl text-sand-50 sm:text-7xl xl:text-[6.5rem] xl:leading-[0.92]">Checked by our team, then checked again.</h1>
              <p className="mt-8 max-w-2xl text-xl leading-relaxed">
                Every email address goes through an in-house SMTP check before it reaches a list, and all data is re-verified every 60 days. Here is what that means, and what it does not.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/sample">See a sample first</Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href="/data-sources">Where the data comes from</Link></Button>
              </div>
            </div>
            <VerifyRing />
          </div>
        </div>
      </section>

      <section className={`${wrap} py-24 lg:py-32`}>
        <h2 className="display max-w-4xl text-5xl text-forest-900 sm:text-6xl lg:text-7xl">How an address is checked</h2>
        <ol className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {checks.map((c) => (
            <li key={c.t} className="rounded-[1.75rem] border border-sand-300 bg-sand-100 p-8">
              <span className="grid size-14 place-items-center rounded-2xl bg-forest-900 text-forest-300">
                <c.icon className="size-7" aria-hidden />
              </span>
              <h3 className="display mt-7 text-3xl text-forest-900">{c.t}</h3>
              <p className="mt-3 text-lg">{c.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-sand-200 bg-sand-100 py-24 lg:py-28">
        <div className={`${wrap} grid gap-10 lg:grid-cols-12 lg:gap-16`}>
          <h2 className="display text-5xl text-forest-900 sm:text-6xl lg:col-span-5 lg:text-7xl">What verification cannot promise</h2>
          <div className="space-y-5 text-lg leading-relaxed lg:col-span-7 lg:text-xl">
            <p>No check is perfect. Some mail servers accept every address, so a small share of addresses can still bounce after verification.</p>
            <p>Verification shows that an address was accepted when we checked. It does not show that someone reads it, and it does not predict replies.</p>
            <p>
              We do not publish an accuracy percentage or a delivery rate, because we would rather show nothing than a number we cannot back. For how bounced contacts are handled, read the{" "}
              <Link href="/legal/refund-replacement" className="font-semibold text-forest-900 underline underline-offset-4">refund and replacement policy</Link>.
            </p>
          </div>
        </div>
      </section>

      <Faq split heading="FAQs About Data Verification" items={faq} />
    </>
  );
}
