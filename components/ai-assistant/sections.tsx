import Link from "next/link";
import { ArrowRight, Check, CircleHelp, LifeBuoy, MessageSquare, Search, Send, ShoppingCart, Target, Wallet, type LucideIcon } from "lucide-react";
import { AI_V2_FEATURES, AI_V2_LANGS, AI_V2_MEMORY, AI_V2_OFFER_RULES, AI_V2_STEPS, AI_BENEFITS, AI_BUDGET_PROMPTS, AI_CART_STEPS, AI_LIMITS, AI_PROMPTS, AI_SEARCHES, AI_SEARCH_BY, AI_STEPS, AI_SUPPORT_STEPS } from "@/lib/ai-assistant-content";
import { HeroChat } from "./hero-chat";
import { OpenPilo } from "./open-button";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const head = "mx-auto max-w-3xl text-center";
const icons: Record<string, LucideIcon> = { message: MessageSquare, search: Search, cart: ShoppingCart, target: Target, life: LifeBuoy };
const primary = "inline-flex h-12 items-center rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function AiHero() {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(48rem 24rem at 100% 0%, rgba(45,106,79,0.45), transparent 70%)" }}>
      <div className={`${wrap} grid gap-14 pb-20 pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24`}>
        <div className="hero-in">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-300">Meet BeigePilot</p>
          <h1 className="display mt-4 text-5xl text-sand-50 sm:text-7xl xl:text-[5.25rem]">Meet Pilo — Your Personal AI Database Shopping Assistant</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">Finding the right business database shouldn&rsquo;t take hours. Tell BeigePilot what you&rsquo;re looking for, and it will help you discover matching databases, explore available packages, shop within your budget, and get support when you need it.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <OpenPilo className={primary} fallbackDark>Try BeigePilot Now</OpenPilo>
            <a href="#how-it-works" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 transition-colors hover:border-sand-50 hover:bg-sand-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">See How It Works</a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[0.95rem] font-semibold text-sand-50">
            {["Search using everyday language", "Discover real BeigeLeads databases", "Get help while you shop"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-5 text-forest-300" aria-hidden />{t}</li>)}
          </ul>
        </div>
        <div className="hero-in" style={{ animationDelay: "150ms" }}><HeroChat /></div>
      </div>
    </section>
  );
}

export function AiSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}>
          <h2 className={h2}>Finding Your Next Database Is as Easy as Asking</h2>
          <p className="mt-4 text-lg">Skip endless browsing. Tell BeigePilot what you need, explore relevant options, and continue to checkout.</p>
        </div>
        <ol className="relative mt-12 grid gap-5 md:grid-cols-3">
          {AI_STEPS.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <li key={s.title} className="relative flex flex-col rounded-3xl border border-sand-300 bg-sand-100 p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-forest-900 text-forest-300"><Icon className="size-6" aria-hidden /></span>
                  <span aria-hidden className="display text-5xl text-sand-300">{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-forest-900"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
                <p className="mt-2 leading-relaxed">{s.text}</p>
                {"example" in s && <p className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm italic text-forest-900">{s.example}</p>}
                {i < 2 && <ArrowRight aria-hidden className="absolute -right-4 top-1/2 z-10 hidden size-7 -translate-y-1/2 rounded-full bg-sand-50 p-1 text-forest-500 md:block" />}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}


const panel = "rounded-3xl border border-sand-300 bg-white p-6 sm:p-8";
const chip = "rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900";
const li = (t: string) => <li key={t} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-forest-500" aria-hidden /><span>{t}</span></li>;

export function AiFinder() {
  return (
    <section id="finder" className="bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>Find the Right Database Without Searching Through Hundreds of Products</h2>
          <p className="mt-4 text-lg leading-relaxed">Simply describe the audience you&rsquo;re targeting. BeigePilot helps locate matching databases from our available catalog.</p>
          <ul className="mt-6 flex flex-wrap gap-2">{AI_SEARCHES.map(([t]) => <li key={t} className={chip}>{t}</li>)}</ul>
          <p className="mt-6 font-semibold text-forest-900">Search by</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">{AI_SEARCH_BY.map(li)}</ul>
          <div className="mt-8"><OpenPilo ask="Help me find a database." className={primary}>Find My Database</OpenPilo></div>
        </div>
        <figure className={panel} aria-label="Illustration of how a request is understood">
          <p className="rounded-2xl bg-sand-100 px-4 py-3 text-forest-900">&ldquo;I need 100,000 business contacts in France.&rdquo;</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {[["Country", "France"], ["Database type", "Business contacts"], ["Quantity", "100,000"]].map(([k, v]) => <div key={k} className="rounded-xl border border-sand-200 p-3"><dt className="text-xs text-forest-500">{k}</dt><dd className="mt-1 font-semibold text-forest-900">{v}</dd></div>)}
          </dl>
          <p className="mt-4 text-sm">BeigePilot then looks for matching lists in the real catalog. The results, packages and prices you see in the chat come from our product data.</p>
        </figure>
      </div>
    </section>
  );
}

export function AiCart() {
  return (
    <section id="cart" className="bg-sand-50 py-20 lg:py-24">
      <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <figure className={`${panel} order-2 lg:order-1`} aria-label="Illustration of a product card in the chat">
          <div className="mt-3 rounded-2xl border border-sand-200 p-4">
            <p className="font-bold text-forest-900">Database name</p>
            <p className="mt-1 text-sm">Choose a package, then press Add to Cart.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {["Package 1", "Package 2", "Package 3"].map((p, i) => <span key={p} className={`rounded-full border px-3 py-1 font-semibold ${i === 1 ? "border-forest-900 bg-forest-100 text-forest-900" : "border-sand-300 text-forest-700"}`}>{p}</span>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm" aria-hidden>
              <span className="grid h-10 place-items-center rounded-full bg-purple-600 font-semibold text-white">Add to Cart</span>
              <span className="grid h-10 place-items-center rounded-full border border-forest-900/25 font-semibold text-forest-900">View Details</span>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-forest-100 px-4 py-2.5 text-sm text-forest-900">Added to your cart. <span className="font-semibold">View Cart</span> or <span className="font-semibold">Continue Shopping</span>.</p>
        </figure>
        <div className="order-1 lg:order-2">
          <h2 className={h2}>From Conversation to Cart in Just a Few Clicks</h2>
          <p className="mt-4 text-lg leading-relaxed">Found a database you like? Select your preferred available package and add it directly to your BeigeLeads shopping cart without leaving the conversation.</p>
          <ol className="mt-6 space-y-3">{AI_CART_STEPS.map((t, i) => <li key={t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{i + 1}</span><span className="pt-0.5">{t}</span></li>)}</ol>
          <p className="mt-5 text-sm">BeigePilot never buys anything for you: you press Add to Cart, and you pay at the normal checkout.</p>
          <div className="mt-8"><OpenPilo ask="Help me add a database to my cart." className={primary}>Start Shopping with BeigePilot</OpenPilo></div>
        </div>
      </div>
    </section>
  );
}

export function AiBudget() {
  return (
    <section id="budget" className="bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>Find Databases That Fit Your Budget</h2>
          <p className="mt-4 text-lg leading-relaxed">Tell BeigePilot how much you want to spend, and it will help you explore available databases and packages within your price range.</p>
          <p className="mt-4">BeigePilot uses current catalog prices. If you ask for several databases, it can suggest combinations and show the Buy More, Save More discount only when checkout really applies it.</p>
          <div className="mt-8"><OpenPilo ask="I want to shop by budget." className={primary}>Shop by Budget</OpenPilo></div>
        </div>
        <div className={panel}>
          <p className="flex items-center gap-2 font-semibold text-forest-900"><Wallet className="size-5 text-forest-500" aria-hidden />Try asking</p>
          <ul className="mt-4 space-y-3">{AI_BUDGET_PROMPTS.map((t) => <li key={t} className="rounded-2xl bg-sand-100 px-4 py-3 text-forest-900">&ldquo;{t}&rdquo;</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

export function AiSupport() {
  return (
    <section id="support" className="bg-sand-50 py-20 lg:py-24">
      <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div className={`${panel} order-2 lg:order-1`}>
          <p className="flex items-center gap-2 font-semibold text-forest-900"><Send className="size-5 text-forest-500" aria-hidden />How a support request works</p>
          <ol className="mt-4 space-y-3">{AI_SUPPORT_STEPS.map((t, i) => <li key={t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{i + 1}</span><span className="pt-0.5">{t}</span></li>)}</ol>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className={h2}>Need a Real Person? We&rsquo;re Here to Help</h2>
          <p className="mt-4 text-lg leading-relaxed">Sometimes you need more than an automated answer. If BeigePilot can&rsquo;t resolve your question, you can send a support request directly from the conversation.</p>
          <p className="mt-4">This is an email handoff to the BeigeLeads support team, not a live chat with an agent. We follow up by email.</p>
          <div className="mt-8"><OpenPilo action="support" className={primary}>Contact Support Through BeigePilot</OpenPilo></div>
        </div>
      </div>
    </section>
  );
}

export function AiPrompts() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>Not Sure What to Ask? Start Here.</h2><p className="mt-4 text-lg">Pick a question and BeigePilot opens with it.</p></div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_PROMPTS.map(([t, q]) => (
            <li key={t}>
              <OpenPilo ask={q} action={t === "Get human help" ? "support" : undefined} className="group block h-full w-full rounded-3xl border border-sand-300 bg-white p-6 text-left transition-colors hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <span className="block text-lg font-bold text-forest-900">{t}</span>
                <span className="mt-2 block text-forest-700">&ldquo;{q}&rdquo;</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-700">Ask BeigePilot <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
              </OpenPilo>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AiBenefits() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>A Smarter Way to Shop for Business Databases</h2></div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AI_BENEFITS.map((b) => {
            const Icon = icons[b.icon] ?? CircleHelp;
            return <div key={b.title} className="rounded-3xl border border-sand-300 bg-white p-7"><span className="grid size-12 place-items-center rounded-xl bg-forest-100 text-forest-700"><Icon className="size-6" aria-hidden /></span><h3 className="mt-5 text-xl font-bold text-forest-900">{b.title}</h3><p className="mt-2 leading-relaxed">{b.text}</p></div>;
          })}
        </div>
      </div>
    </section>
  );
}

export function AiLimits() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>Helpful Answers, Real Product Information</h2>
          <p className="mt-4 text-lg">BeigePilot is built to stay honest about what it knows. Before you buy, check coverage and quality details on each product page. Prefer to browse yourself? See <Link href="/lists" className="underline">all databases</Link>, our <Link href="/verification" className="underline">verification process</Link> or the <Link href="/help-center" className="underline">Help Center</Link>.</p>
        </div>
        <ul className="grid gap-3 rounded-3xl border border-sand-300 bg-white p-6 sm:grid-cols-2 sm:p-8">{AI_LIMITS.map(li)}</ul>
      </div>
    </section>
  );
}

export function AiFinalCta() {
  return (
    <section className="bg-sand-50 pb-20 lg:pb-24">
      <div className={wrap}>
        <div className="rounded-[2rem] bg-forest-900 px-6 py-14 text-center sm:px-12 sm:py-16" style={{ backgroundImage: "radial-gradient(36rem 16rem at 50% 0%, rgba(45,106,79,0.5), transparent 70%)" }}>
          <h2 className="display mx-auto max-w-3xl text-4xl text-sand-50 sm:text-6xl">Your Next Database Is Just a Conversation Away</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-sand-200">Tell Pilo what youTell BeigePilot what you&rsquo;re looking for and let our AI assistant help you find the right database.rsquo;re looking for and let our AI assistant help you find the right database.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <OpenPilo className={primary} fallbackDark>Start Chatting With Pilo</OpenPilo>
            <Link href="/lists" className="inline-flex h-12 items-center rounded-full border border-sand-50/30 px-7 font-semibold text-sand-50 hover:border-sand-50 hover:bg-sand-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">Browse All Databases</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AiFeatures() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>Everything Pilo Can Help With</h2></div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_V2_FEATURES.map(([t, d]) => <li key={t} className="rounded-3xl border border-sand-300 bg-white p-6"><h3 className="text-lg font-bold text-forest-900">{t}</h3><p className="mt-2">{d}</p></li>)}
        </ul>
      </div>
    </section>
  );
}

export function AiSteps4() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <div className={head}><h2 className={h2}>From Question to Checkout in Four Steps</h2></div>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {AI_V2_STEPS.map(([t, d], i) => <li key={t} className="rounded-3xl border border-sand-300 bg-white p-6"><span aria-hidden className="display text-4xl text-sand-300">{i + 1}</span><h3 className="mt-3 text-lg font-bold text-forest-900"><span className="sr-only">Step {i + 1}: </span>{t}</h3><p className="mt-2">{d}</p></li>)}
        </ol>
      </div>
    </section>
  );
}

export function AiLanguages() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>Chat in Your Own Language</h2>
          <p className="mt-4 text-lg leading-relaxed">Pilo detects the language you write in, or you can choose one in the chat header. Arabic and Urdu switch the chat to right-to-left layout.</p>
          <div className="mt-8"><OpenPilo ask="Hola, busco bases de datos de empresas." className={primary}>Try It in Your Language</OpenPilo></div>
        </div>
        <ul className="flex flex-wrap gap-3">{AI_V2_LANGS.map((l) => <li key={l} className={`${chip} text-base`}>{l}</li>)}</ul>
      </div>
    </section>
  );
}

export function AiMemory() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <ul className="grid gap-3 rounded-3xl border border-sand-300 bg-white p-6 sm:grid-cols-2 sm:p-8">{AI_V2_MEMORY.map(li)}</ul>
        <div>
          <h2 className={h2}>Pilo Remembers So You Don&rsquo;t Repeat Yourself</h2>
          <p className="mt-4 text-lg leading-relaxed">During a chat, Pilo keeps what you told it and asks one short question at a time to fill the gaps. Memory stays in your browser. You can clear it at any time, or opt in to keep it on your device for up to 30 days.</p>
        </div>
      </div>
    </section>
  );
}

export function AiOffers() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={`${wrap} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>Looking for a Better Price? Just Ask Pilo.</h2>
          <p className="mt-4 text-lg leading-relaxed">When offers are available and your cart is eligible, Pilo can offer a discount of up to 20%. Ask in the chat to see whether your cart qualifies.</p>
          <div className="mt-8"><OpenPilo ask="Can I get a better price?" className={primary}>Ask Pilo About Offers</OpenPilo></div>
        </div>
        <ul className="grid gap-3 rounded-3xl border border-sand-300 bg-white p-6 sm:p-8">{AI_V2_OFFER_RULES.map(li)}</ul>
      </div>
    </section>
  );
}

export function AiDfy() {
  return (
    <section className="bg-sand-100 py-16 lg:py-20">
      <div className={`${wrap} text-center`}>
        <h2 className={`${h2} mx-auto max-w-3xl`}>Need More Than Leads? Let Pilo Handle Your Outbound Questions.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg">Ask Pilo how DFY Outbound works, which package fits your lead volume, and what ownership means.</p>
        <p className="mt-4 font-semibold text-forest-900">Starter $299/mo · Growth $599/mo · Scale $999/mo</p>
        <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-sm">
          {["Package differences", "Lead and send volumes", "Infrastructure ownership", "Setup process", "Reporting", "Custom quote"].map((t) => <li key={t} className="rounded-full border border-sand-300 bg-white px-3 py-1.5">{t}</li>)}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <OpenPilo className={primary} ask="Tell me about DFY Outbound packages">Ask Pilo About DFY</OpenPilo>
          <Link href="/dfy-outbound" className="inline-flex h-12 items-center rounded-full border border-forest-700 px-7 font-semibold text-forest-900 transition-colors hover:bg-white">Explore DFY Packages</Link>
        </div>
      </div>
    </section>
  );
}
