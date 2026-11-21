import Link from "next/link";
import { ArrowRight, Bell, Check, CreditCard, ListChecks, LockKeyhole, Mail, Search, Send, ShieldCheck, ShoppingCart, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { TPR_BENEFITS, TPR_EMPLOYEE, TPR_MANAGER, TPR_STEPS } from "@/lib/team-requests-content";
import { REQUEST_DAYS } from "@/lib/sales/team-constants";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const head = "mx-auto max-w-3xl text-center";
const icons: Record<string, LucideIcon> = { search: Search, send: Send, check: ShieldCheck, mail: Mail, card: CreditCard, list: ListChecks, lock: LockKeyhole, bell: Bell };
const btnPrimary = "inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Hero: forest panel; the right side shows the three places a request passes through. */
export function TprHero() {
  const nodes: [LucideIcon, string, string][] = [
    [ShoppingCart, "Your cart", "Databases you picked, one note"],
    [Mail, "Manager’s inbox", "A secure link, valid " + REQUEST_DAYS + " days"],
    [LockKeyhole, "Secure checkout", "Manager approves and pays"],
  ];
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(48rem 24rem at 100% 0%, rgba(45,106,79,0.45), transparent 70%)" }}>
      <div className={`${wrap} grid gap-14 pb-20 pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24`}>
        <div className="hero-in">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-300">Team purchase requests</p>
          <h1 className="display mt-4 text-5xl text-sand-50 sm:text-7xl xl:text-[5.5rem]">Need Your Manager to Approve a Database Purchase?</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">
            Choose the databases your business needs, send your cart to your manager, and let them review and pay securely. No complicated purchasing process or team account required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lists" className={btnPrimary}>Browse Databases</Link>
            <a href="#how-it-works" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50 hover:bg-sand-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">How It Works</a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[0.95rem] font-semibold text-sand-50">
            {[[UsersRound, "No team account required"], [ShieldCheck, "Secure manager approval"], [Mail, "Easy database delivery"]].map(([I, t]) => {
              const Icon = I as LucideIcon;
              return <li key={t as string} className="flex items-center gap-2"><Icon className="size-5 text-forest-300" aria-hidden />{t as string}</li>;
            })}
          </ul>
        </div>
        <ol aria-label="Where a request goes" className="hero-in relative space-y-4" style={{ animationDelay: "150ms" }}>
          <span aria-hidden className="absolute bottom-10 left-[2.15rem] top-10 w-px border-l-2 border-dashed border-forest-500" />
          {nodes.map(([Icon, t, s]) => (
            <li key={t} className="relative flex items-center gap-4 rounded-2xl border border-forest-700 bg-forest-700/40 p-4 pr-6 backdrop-blur-sm">
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-sand-100 text-forest-900"><Icon className="size-6" aria-hidden /></span>
              <span><span className="block text-lg font-bold text-sand-50">{t}</span><span className="block text-sm text-sand-300">{s}</span></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TprSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>From Database Selection to Approval in 4 Simple Steps</h2></div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TPR_STEPS.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <li key={s.title} className="flex flex-col rounded-3xl border border-sand-300 bg-sand-100 p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-forest-900 text-forest-300"><Icon className="size-6" aria-hidden /></span>
                  <span aria-hidden className="display text-5xl text-sand-300">{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-forest-900"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
                <p className="mt-2 leading-relaxed">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Roles({ title, icon: Icon, items, dark }: { title: string; icon: LucideIcon; items: string[]; dark?: boolean }) {
  return (
    <div className={`rounded-3xl p-8 ${dark ? "bg-forest-900 text-sand-100" : "border border-sand-300 bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${dark ? "bg-forest-700 text-forest-300" : "bg-forest-100 text-forest-700"}`}><Icon className="size-5" aria-hidden /></span>
        <h3 className={`text-2xl font-bold ${dark ? "text-sand-50" : "text-forest-900"}`}>{title}</h3>
      </div>
      <ul className="mt-6 space-y-3.5">
        {items.map((t) => (
          <li key={t} className="flex gap-3"><Check className={`mt-1 size-5 shrink-0 ${dark ? "text-forest-300" : "text-forest-500"}`} aria-hidden /><span>{t}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function TprRoles() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>A Simpler Way for Teams to Purchase Business Data</h2></div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Roles title="For Employees" icon={UserRound} items={TPR_EMPLOYEE} />
          <Roles title="For Managers" icon={ShieldCheck} items={TPR_MANAGER} dark />
        </div>
      </div>
    </section>
  );
}

/** Static illustration of the manager's review page. Nothing here is interactive: the controls are plain, non-clickable shapes. */
export function TprPreview() {
  const rows: [string, string][] = [["Example database A · Starter", "$99.00"], ["Example database B · Professional", "$199.00"], ["Example database C · Starter", "$99.00"]];
  const line = "flex justify-between gap-3 py-2.5";
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}>
          <h2 className={h2}>See Exactly What Your Manager Receives</h2>
          <p className="mt-4 text-lg">The review page shows the requester, every database and the total. This is an illustration: the names, people and prices below are examples.</p>
        </div>
        <figure className="mx-auto mt-12 max-w-2xl" aria-label="Illustration of the manager review page">
          <div className="rounded-[2rem] border border-sand-300 bg-sand-100 p-3 sm:p-4">
            <div className="flex items-center justify-between px-3 pb-3 pt-1 text-xs font-semibold text-forest-500">
              <span>Manager review page</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">Illustrative example</span>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-6 sm:p-8">
              <p className="text-sm text-forest-500">Requested by</p>
              <p className="text-lg"><strong className="text-forest-900">Alex Morgan</strong> <span className="text-sm">alex@example-company.test</span></p>
              <p className="mt-2 text-sm">Alex asks you to approve and pay for these databases.</p>
              <p className="mt-5 text-sm font-semibold text-forest-900">3 databases</p>
              <ul className="divide-y divide-sand-200 text-sm">
                {rows.map(([n, p]) => <li key={n} className={line}><span>{n}</span><span className="font-semibold text-forest-900">{p}</span></li>)}
              </ul>
              <dl className="mt-1 space-y-0 border-t border-sand-200 text-sm">
                <div className={line}><dt>Subtotal</dt><dd className="font-semibold text-forest-900">$397.00</dd></div>
                <div className={line}><dt>Buy More, Save More discount</dt><dd className="font-semibold text-forest-500">&minus;$59.55</dd></div>
                <div className={`${line} border-t border-sand-200 text-base font-bold text-forest-900`}><dt>Total</dt><dd>$337.45</dd></div>
              </dl>
              <p className="mt-4 rounded-xl bg-sand-100 p-3 text-sm"><span className="font-semibold text-forest-900">Note:</span> For the Q1 outreach campaign.</p>
              <div aria-hidden className="mt-6 grid gap-3 sm:grid-cols-2">
                <span className="grid h-12 select-none place-items-center rounded-full bg-purple-600 font-semibold text-white">Approve &amp; Pay</span>
                <span className="grid h-12 select-none place-items-center rounded-full border border-forest-900/25 font-semibold text-forest-900">Decline Request</span>
              </div>
              <p className="mt-4 text-xs">Valid for {REQUEST_DAYS} days. One-time purchase, no subscription. Payment is made in crypto at the normal checkout.</p>
            </div>
          </div>
          <figcaption className="mt-3 text-center text-sm">Example only. These buttons are not clickable.</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function TprBenefits() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>Make Business Database Purchasing Easier</h2></div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TPR_BENEFITS.map((b) => {
            const Icon = icons[b.icon];
            return (
              <div key={b.title} className="rounded-3xl border border-sand-300 bg-white p-7">
                <span className="grid size-12 place-items-center rounded-xl bg-forest-100 text-forest-700"><Icon className="size-6" aria-hidden /></span>
                <h3 className="mt-5 text-xl font-bold text-forest-900">{b.title}</h3>
                <p className="mt-2 leading-relaxed">{b.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TprFinalCta() {
  return (
    <section className="bg-sand-50 pb-20 lg:pb-24">
      <div className={wrap}>
        <div className="rounded-[2rem] bg-forest-900 px-6 py-14 text-center sm:px-12 sm:py-16" style={{ backgroundImage: "radial-gradient(36rem 16rem at 50% 0%, rgba(45,106,79,0.5), transparent 70%)" }}>
          <h2 className="display mx-auto max-w-3xl text-4xl text-sand-50 sm:text-6xl">Ready to Request Your Next Database Purchase?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-sand-200">Find the databases your team needs and let your manager handle approval and payment.</p>
          <Link href="/lists" className={`${btnPrimary} mt-8`}>Browse Databases <ArrowRight className="ml-2 size-4" aria-hidden /></Link>
          <p className="mt-5 text-sm text-sand-300">Add databases to your cart and select Request manager approval.</p>
        </div>
      </div>
    </section>
  );
}
