import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { CopyColor } from "@/components/media-kit/copy-color";
import { COLORS, DONTS, KINDS, MEDIA_KIT, PDF, VARIANTS, ZIPS, fileSize } from "@/lib/media-kit/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "BeigeLeads Media Kit | Official Logos & Brand Assets" },
  description: "Download official BeigeLeads logos (SVG and PNG), favicons, social images, brand colors and guidelines.",
  alternates: { canonical: "/media-kit" },
  // Site-wide noindex stays until launch (see CLAUDE.md); the page-level setting must not override it.
  robots: { index: false, follow: false },
  openGraph: { title: "BeigeLeads Media Kit", description: "Official logos, colors and brand assets.", url: "/media-kit", images: ["/brand/social/beigeleads-og-1200x630.png"] },
};

const panel = "rounded-[2rem] border border-sand-200 bg-white p-6 sm:p-10";
const dl = "rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export default function MediaKitPage() {
  return (
    <div className="bg-sand-100 pb-20">
      <Breadcrumbs items={[{ name: "Media Kit", href: "/media-kit" }]} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <section className={`${panel} text-center`}>
          <h1 className="display mx-auto max-w-3xl text-5xl text-forest-900 sm:text-6xl">{MEDIA_KIT.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg">{MEDIA_KIT.intro}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={ZIPS[0].href} download className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
              Download Brand Kit ({ZIPS[0].size})
            </a>
            <a href="#logos" className="rounded-full border border-sand-300 px-6 py-3 font-semibold text-forest-900 hover:bg-sand-50">Browse logos</a>
          </div>
        </section>

        <section className={panel} aria-labelledby="about">
          <h2 id="about" className="display text-4xl text-forest-900">About BeigeLeads</h2>
          <div className="mt-4 max-w-3xl space-y-3">{MEDIA_KIT.about.map((t) => <p key={t}>{t}</p>)}</div>
        </section>

        <section id="logos" className={panel} aria-labelledby="logos-h">
          <h2 id="logos-h" className="display text-4xl text-forest-900">Logos</h2>
          <p className="mt-2 max-w-2xl">Every logo comes as SVG (scales to any size) and PNG with a transparent background.</p>
          <div className="mt-8 space-y-10">
            {KINDS.map((k) => (
              <div key={k.id}>
                <h3 className="text-xl font-bold text-forest-900">{k.label}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {VARIANTS.map((v) => {
                    const base = `/brand`;
                    const name = `beigeleads-${k.id}-${v.id}`;
                    const dark = v.bg.includes("forest");
                    return (
                      <figure key={v.id} className="overflow-hidden rounded-2xl border border-sand-200">
                        <div className={`${v.bg} flex h-44 items-center justify-center p-6`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`${base}/svg/${name}.svg`} alt={`BeigeLeads ${k.label.toLowerCase()}, ${v.label.toLowerCase()}`} className={`max-h-full ${k.id === "horizontal" ? "h-14" : k.id === "stacked" ? "h-28" : "h-20"} w-auto`} />
                        </div>
                        <figcaption className={`flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 bg-sand-50 p-3 ${dark ? "" : ""}`}>
                          <span><b className="text-forest-900">{v.label}</b><br /><span className="text-sm">{v.note}</span></span>
                          <span className="flex gap-2">
                            <a className={dl} href={`${base}/svg/${name}.svg`} download aria-label={`Download ${k.label}, ${v.label}, SVG`}>SVG {fileSize(`svg/${name}.svg`)}</a>
                            <a className={dl} href={`${base}/png/${name}.png`} download aria-label={`Download ${k.label}, ${v.label}, PNG`}>PNG {fileSize(`png/${name}.png`)}</a>
                          </span>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={panel} aria-labelledby="colors">
          <h2 id="colors" className="display text-4xl text-forest-900">Brand colors</h2>
          <p className="mt-2 max-w-2xl">These are the colors used on the website. Select one to copy its hex code.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">{COLORS.map((c) => <CopyColor key={c.hex} name={c.name} hex={c.hex} use={c.use} />)}</div>
        </section>

        <section className={panel} aria-labelledby="type">
          <h2 id="type" className="display text-4xl text-forest-900">Typography</h2>
          <p className="mt-2 max-w-2xl">We use Bricolage Grotesque, a free font under the SIL Open Font License. Headlines use the condensed, heavy style; body text uses normal width. The logo is outlined artwork, so you do not need the font to use it.</p>
          <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-50 p-6">
            <p className="display text-5xl text-forest-900 sm:text-6xl">Pay once. Own the list.</p>
            <p className="mt-3 text-lg">B2B contact lists, delivered as CSV, Excel or TXT.</p>
          </div>
        </section>

        <section className={panel} aria-labelledby="usage">
          <h2 id="usage" className="display text-4xl text-forest-900">Using the logo</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-forest-900">Do</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Use the files as supplied.</li>
                <li>Keep clear space around the logo equal to half the height of the symbol tile.</li>
                <li>Use the reversed logo on dark backgrounds and the primary logo on light ones.</li>
                <li>Keep the horizontal logo at least 100 px wide on screen. Use the symbol at 16 px or larger.</li>
              </ul>
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-sand-200 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/svg/beigeleads-horizontal-light.svg" alt="Correct use of the BeigeLeads logo" className="h-12 w-auto" />
                <span className="text-sm font-semibold text-forest-500">Correct</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-forest-900">Do not</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {DONTS.map((d) => (
                  <div key={d.label} className="rounded-2xl border border-sand-200 p-3">
                    <div className="flex h-20 items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brand/svg/beigeleads-horizontal-light.svg" alt="" aria-hidden className="h-9 w-auto" style={d.style} />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-forest-900">✕ {d.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Do not imply endorsement or partnership by BeigeLeads without written permission.</p>
            </div>
          </div>
        </section>

        <section className={panel} aria-labelledby="downloads">
          <h2 id="downloads" className="display text-4xl text-forest-900">Download center</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ZIPS.map((z) => (
              <a key={z.file} href={z.href} download className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-sand-50 p-5 hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <span><b className="text-lg text-forest-900">{z.name}</b><br /><span className="text-sm">{z.desc}</span></span>
                <span className="mt-4 text-sm font-semibold text-forest-900">ZIP, {z.count} files, {z.size}</span>
              </a>
            ))}
            <a href={PDF.href} download className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-sand-50 p-5 hover:border-forest-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 sm:col-span-2">
              <span><b className="text-lg text-forest-900">Brand Guidelines</b><br /><span className="text-sm">Logo rules, colors, typography and correct use, in one PDF.</span></span>
              <span className="mt-4 text-sm font-semibold text-forest-900">PDF, {PDF.size}</span>
            </a>
          </div>
        </section>

        <section className={`${panel} text-center`}>
          <h2 className="display text-4xl text-forest-900">Need Something Else?</h2>
          <p className="mx-auto mt-3 max-w-xl">{MEDIA_KIT.contactNote}</p>
          <Link href="/contact" className="mt-6 inline-block rounded-full bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">Contact us</Link>
        </section>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "BeigeLeads Media Kit", url: `${SITE_URL}/media-kit`, description: "Official logos, colors and brand assets for BeigeLeads.", about: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL, logo: `${SITE_URL}/brand/png/beigeleads-symbol-light.png` } }} />
    </div>
  );
}
