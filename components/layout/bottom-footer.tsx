"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  const lc = "inline-flex items-center gap-1.5 underline-offset-4 hover:text-purple-700 hover:underline focus-visible:outline-2 focus-visible:outline-purple-600";
  const raw = (ai?.heading ?? "").replace(/[.\s]+$/, "");
  const head = raw === "Ask AI about BeigeLeads" ? "Discover BeigeLeads with AI" : raw; // the old built-in default reads as the new one
  return (
    <div className="relative overflow-hidden bg-sand-50 text-forest-900" data-bottom-footer>
      <svg aria-hidden viewBox="0 0 520 220" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-px -right-px hidden h-44 w-[26rem] md:block">
        <defs><linearGradient id="bf-curve" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#0F2A1D" stopOpacity="0.05" /><stop offset="0.45" stopColor="#1B4332" stopOpacity="0.85" /><stop offset="1" stopColor="#0F2A1D" /></linearGradient></defs>
        <path d="M0 220 C150 205 260 150 340 90 C400 45 450 20 520 0 L520 220 Z" fill="url(#bf-curve)" />
      </svg>
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-0">
          <div className="space-y-6 lg:pr-8">
            <BrandLogo variant="light" className="h-12 w-auto" />
            <nav aria-label="Legal and AI information">
              <ul className="flex flex-wrap items-center gap-y-2 text-[15px]">
                <li className="pr-4"><Link href="/legal/terms" className={lc}>Terms of Use</Link></li>
                <li className="border-l border-sand-300 px-4"><Link href="/legal/privacy" className={lc}>Privacy Policy</Link></li>
                <li className="border-l border-sand-300 pl-4"><a href={LLMS_URL} className={lc}>Hey AI, learn about us<ArrowUpRight className="h-4 w-4" aria-hidden /></a></li>
              </ul>
            </nav>
            {social.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-3" aria-label="BeigeLeads on social media">
                {social.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${socialName(s)} (opens in a new tab)`} title={socialName(s)}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-sand-200 bg-sand-100/60 text-forest-900 transition hover:-translate-y-0.5 hover:border-forest-500/40 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <Glyph name={s.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {ai && ai.platforms.length > 0 && (
            <section aria-labelledby="ask-ai-heading" className="lg:border-l lg:border-sand-300 lg:pl-8">
              <h2 id="ask-ai-heading" className="display mb-6 text-4xl text-forest-900 lg:text-[2.6rem]">{head}<span className="text-purple-600">.</span></h2>
              <AiButtons platforms={ai.platforms} prompt={ai.prompt} />
            </section>
          )}
        </div>
        <div className="mt-10 border-t border-sand-300 pt-6">
          <p className="text-sm text-forest-700">&copy; 2026 BeigeLeads&reg;</p>
        </div>
      </div>
    </div>
  );
}
