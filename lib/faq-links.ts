/**
 * Internal links for FAQ answers. Answers are plain text in code and the CMS; this finds a few
 * well-known phrases and points them at the page that explains them. Pure and tested. Rules:
 * first match per destination, at most MAX_LINKS per answer, never overlapping, only real site paths.
 * The FAQPage JSON-LD keeps the plain text, so structured data always matches the visible words.
 */
export type FaqSegment = { text: string; href?: string };

type Rule = { re: RegExp; href: string };

// Order = priority when two phrases overlap. Every href must be a real page (tests check the shape).
export const FAQ_LINK_RULES: readonly Rule[] = [
  { re: /\b(?:refund and replacement policy|replacement policy|replacement promise|refund policy)\b/i, href: "/legal/refund-replacement" },
  { re: /\blawful[- ]use (?:policy|rules)\b/i, href: "/legal/lawful-use" },
  { re: /\bprivacy policy\b/i, href: "/legal/privacy" },
  { re: /\bdelivery policy\b/i, href: "/legal/delivery" },
  { re: /\bCAN-SPAM\b/, href: "/legal/can-spam" },
  { re: /\bGDPR\b/, href: "/legal/gdpr" },
  { re: /\bCCPA\b/, href: "/legal/ccpa" },
  { re: /\bCASL\b/, href: "/legal/casl" },
  { re: /\bopt[- ]?out (?:page|form|request)\b/i, href: "/opt-out" },
  { re: /\bHelp Center\b/, href: "/help-center" },
  { re: /\bData Sources page\b/i, href: "/data-sources" },
  { re: /\bVerification page\b/i, href: "/verification" },
  { re: /\bemail list verification\b/i, href: "/email-list-verification" },
  { re: /\bDFY Outbound\b/, href: "/dfy-outbound" },
  { re: /\bData Reseller Partner(?:s| Program)?\b/i, href: "/partners" },
  { re: /\bteam purchase requests?\b/i, href: "/team-purchase-requests" },
  { re: /\bcustom list (?:page|builder|request)\b/i, href: "/custom-list" },
  { re: /\b(?:free (?:masked )?sample|sample page|request a sample)\b/i, href: "/sample" },
  { re: /\bbundles?\b/i, href: "/bundles" },
  { re: /\bhow it works\b/i, href: "/how-it-works" },
  { re: /\bpricing page\b/i, href: "/pricing" },
  { re: /\bcontact (?:us|our team|support)\b/i, href: "/contact" },
];

export const MAX_LINKS = 2;

export function linkFaqAnswer(text: string, skipHrefs: readonly string[] = []): FaqSegment[] {
  const hits: { start: number; end: number; href: string }[] = [];
  for (const r of FAQ_LINK_RULES) {
    if (skipHrefs.includes(r.href)) continue;
    const m = r.re.exec(text);
    if (!m) continue;
    const start = m.index, end = start + m[0].length;
    if (hits.some((h) => start < h.end && end > h.start)) continue; // overlaps a higher-priority hit
    hits.push({ start, end, href: r.href });
  }
  hits.sort((a, b) => a.start - b.start);
  // keep the first MAX_LINKS in reading order
  const use = hits.slice(0, MAX_LINKS);
  const out: FaqSegment[] = [];
  let at = 0;
  for (const h of use) {
    if (h.start > at) out.push({ text: text.slice(at, h.start) });
    out.push({ text: text.slice(h.start, h.end), href: h.href });
    at = h.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out.length ? out : [{ text }];
}
