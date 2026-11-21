"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AiButtons } from "@/components/site-links/ai-buttons";
import { Glyph } from "@/components/site-links/icons";
import { LLMS_URL, socialName, type FooterConfig } from "@/lib/site-links/types";

/** Strip under the main footer. Legal links, copyright and the llms.txt link are plain server-rendered HTML;
 * social icons and AI shortcuts come from the admin settings (cached) after load, with space reserved so nothing jumps. */
export function BottomFooter() {
  const [cfg, setCfg] = useState<FooterConfig | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/footer-links").then((r) => (r.ok ? (r.json() as Promise<FooterConfig>) : null)).then((j: FooterConfig | null) => { if (live && j && Array.isArray(j.social)) setCfg(j); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const social = cfg?.social ?? []; const ai = cfg?.ai;
  const lc = "underline-offset-4 hover:text-sand-50 hover:underline focus-visible:outline-2 focus-visible:outline-purple-600";
  return (
    <div className="border-t border-forest-700 text-sand-300" data-bottom-footer>
      <div className="mx-auto grid max-w-7xl items-center gap-x-10 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <BrandLogo variant="dark" className="h-8 w-auto" />
            <nav aria-label="Legal and AI information">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <li><Link href="/legal/terms" className={lc}>Terms of Use</Link></li>
                <li><Link href="/legal/privacy" className={lc}>Privacy Policy</Link></li>
                <li><a href={LLMS_URL} className={lc}>Hey AI, learn about us</a></li>
              </ul>
            </nav>
          </div>
          {social.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-2.5" aria-label="BeigeLeads on social media">
              {social.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${socialName(s)} (opens in a new tab)`} title={socialName(s)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-sand-50/10 text-sand-100 ring-1 ring-sand-50/15 transition hover:bg-sand-50 hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                    <Glyph name={s.platform} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm">&copy; 2026 BeigeLeads&reg;</p>
        </div>
        {ai && ai.platforms.length > 0 && (
          <section aria-labelledby="ask-ai-heading" className="rounded-2xl bg-sand-50/5 p-5 ring-1 ring-sand-50/10 lg:max-w-md">
            <h2 id="ask-ai-heading" className="mb-3 text-base font-semibold text-sand-50">{ai.heading}</h2>
            <AiButtons platforms={ai.platforms} prompt={ai.prompt} />
          </section>
        )}
      </div>
    </div>
  );
}
