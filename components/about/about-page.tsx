import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { CHAPTERS, FOUNDER, PHILOSOPHY, VISION } from "@/lib/about-content";

const prose = "max-w-[38rem] space-y-5 text-lg leading-[1.75] text-forest-700";

function Portrait() {
  return (
    <figure className="relative mx-auto w-full max-w-sm">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-forest-900 shadow-[0_24px_60px_rgba(15,42,29,0.22)]">
        {FOUNDER.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={FOUNDER.photo} alt={`${FOUNDER.name}, founder of BeigeLeads`} className="size-full object-cover object-[50%_20%]" width={960} height={1152} />
        ) : (
          <div className="flex size-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/svg/beigeleads-symbol-dark.svg" alt="" aria-hidden className="w-1/2" />
          </div>
        )}
      </div>
      <figcaption className="mt-4 text-center">
        <span className="display block text-3xl text-forest-900">{FOUNDER.name}</span>
        <span className="text-forest-500">{FOUNDER.role}, BeigeLeads</span>
      </figcaption>
    </figure>
  );
}

export function AboutPage() {
  return (
    <div className="bg-sand-50">
      {/* Hero */}
      <section aria-labelledby="about-h1" className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:pb-28 lg:pt-16">
        <div>
          <h1 id="about-h1" className="display text-6xl text-forest-900 sm:text-7xl lg:text-[5.5rem] lg:leading-[0.95]">
            Every outbound campaign begins with a list.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed">
            BeigeLeads grew out of years of client acquisition work. This is how {FOUNDER.name} went from dropping out of college to six years of outbound, and then to building a business that sells contact lists once, for good.
          </p>
        </div>
        <Portrait />
      </section>

      {/* Chapters */}
      <section aria-label="The founder's story" className="border-t border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <ol className="space-y-20 lg:space-y-28">
            {CHAPTERS.map((c) => (
              <li key={c.id} id={c.id} className="reveal grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-14">
                <p className="display text-3xl text-forest-500 lg:sticky lg:top-28 lg:self-start">{c.label}</p>
                <div>
                  <h2 className="display text-4xl text-forest-900 sm:text-5xl">{c.title}</h2>
                  <div className={`mt-6 ${prose}`}>{c.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Philosophy */}
      <section aria-labelledby="philosophy" className="bg-forest-900 text-sand-50">
        <div className="reveal mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <h2 id="philosophy" className="display text-6xl text-sand-50 sm:text-7xl lg:text-8xl">{PHILOSOPHY.line}</h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-sand-200">{PHILOSOPHY.text}</p>
          <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            <Link href="/legal/lawful-use" className="text-forest-300 underline underline-offset-4 hover:text-sand-50">Lawful-use policy</Link>
            <Link href="/legal/refund-replacement" className="text-forest-300 underline underline-offset-4 hover:text-sand-50">Replacement policy</Link>
            <Link href="/verification" className="text-forest-300 underline underline-offset-4 hover:text-sand-50">How we verify</Link>
          </p>
        </div>
      </section>

      {/* Vision */}
      <section aria-labelledby="vision" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="reveal grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-14">
          <p className="display text-3xl text-forest-500">The direction</p>
          <div>
            <h2 id="vision" className="display text-4xl text-forest-900 sm:text-5xl">{VISION.title}</h2>
            <div className={`mt-6 ${prose}`}>{VISION.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="about-cta" className="px-4 pb-24 sm:px-6">
        <div className="reveal mx-auto max-w-6xl rounded-[2rem] border border-sand-200 bg-white p-8 text-center sm:p-14">
          <BrandLogo className="mx-auto h-10 w-auto" />
          <h2 id="about-cta" className="display mx-auto mt-6 max-w-2xl text-4xl text-forest-900 sm:text-5xl">Starting outbound? Start with the first link.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg">Look at a masked sample before you spend anything, or tell us what you need and we will source it.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/sample">Try a Sample</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/lists">Browse the lists</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/custom-list">Build My List</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
