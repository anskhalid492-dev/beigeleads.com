// Founder-led email layouts A-E (CLAUDE.md section 173). Email-safe tables with inline CSS, a plain-text twin, and the founder
// signature. Uses ONLY the brand palette. The same Content blocks the System Emails editor edits are drawn here, so editing,
// preview, test send and live send all go through this one function.
import { BRAND, SITE, FOUNDER_PHOTO } from "@/lib/system-emails/brand";
import { DEFAULT_BRANDING, type Branding } from "@/lib/system-emails/branding";
import { blockHtml, blockText, buttonHtml, esc, fill, oneLine, plainText, safeUrl, type Issues, type Rendered, type Vars } from "@/lib/system-emails/render";
import type { Content, FounderMeta } from "@/lib/system-emails/types";
import { FOUNDER_NAME, FOUNDER_TITLE, REPLY_TO } from "./config";

export type Card = { name: string; meta: string; url: string; records?: string; price?: string };

/** A reply-based CTA: a properly encoded mailto to the monitored inbox with a subject (and the order reference when known). */
export function replyUrl(subject: string, body?: string): string {
  const q = [`subject=${encodeURIComponent(subject)}`, ...(body ? [`body=${encodeURIComponent(body)}`] : [])].join("&");
  return `mailto:${REPLY_TO}?${q}`;
}

/** Highlighted words, like the site's hero: ==word== becomes a rounded chip (green, purple, sand in turn). No marker = the last word. */
const CHIPS = [[BRAND.forest100, BRAND.forest900], [BRAND.purple100, BRAND.purple600], [BRAND.sand200, BRAND.forest900]] as const;
export function highlight(htmlText: string): string {
  let i = 0;
  const chip = (t: string) => { const [bg, fg] = CHIPS[i++ % 3]!; return `<span style="background:${bg};color:${fg};border-radius:10px;padding:1px 9px;white-space:nowrap">${t}</span>`; };
  if (/==[^=]+==/.test(htmlText)) return htmlText.replace(/==([^=]+)==/g, (_m, t: string) => chip(t));
  return htmlText.replace(/(\S+?)([.!?:]?)$/, (_m, w: string, end: string) => `${chip(w)}${end}`);
}

function signature(): string {
  const initial = FOUNDER_NAME.slice(0, 1);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr>
<td width="60" valign="middle" style="padding-right:14px"><img src="${FOUNDER_PHOTO}" width="52" height="52" alt="${esc(initial)}" style="display:block;width:52px;height:52px;border-radius:26px;background:${BRAND.forest700};color:${BRAND.sand50};font-family:${BRAND.font};font-size:22px;font-weight:800;text-align:center;line-height:52px"></td>
<td valign="middle" class="t" style="font-family:${BRAND.font};color:${BRAND.forest900}"><div style="font-size:17px;font-weight:800;line-height:1.2">${esc(FOUNDER_NAME)}</div><div class="muted" style="font-size:13px;line-height:1.4;color:${BRAND.forest500}">${esc(FOUNDER_TITLE)}</div></td></tr></table>`;
}

function cardsHtml(cards: Card[]): string {
  return cards.slice(0, 3).map((c) => {
    const url = safeUrl(c.url);
    if (!url) return "";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="margin:0 0 12px;border:1px solid ${BRAND.sand200};border-radius:14px;background:${BRAND.sand50}"><tr><td style="padding:16px 18px">
<div class="t" style="font-family:${BRAND.font};font-size:17px;font-weight:800;line-height:1.25;color:${BRAND.forest900}">${esc(c.name)}</div>
<div class="muted" style="margin:4px 0 10px;font-size:13px;line-height:1.5;color:${BRAND.forest500}">${esc(c.meta)}${c.records ? ` &nbsp;|&nbsp; ${esc(c.records)} records` : ""}${c.price ? ` &nbsp;|&nbsp; from ${esc(c.price)}` : ""}</div>
${buttonHtml("View this database", url, "outline", DEFAULT_BRANDING, 10)}</td></tr></table>`;
  }).join("");
}
const cardsText = (cards: Card[]) => cards.slice(0, 3).filter((c) => safeUrl(c.url)).map((c) => `- ${c.name} (${c.meta}${c.records ? `, ${c.records} records` : ""}${c.price ? `, from ${c.price}` : ""})\n  ${c.url}`).join("\n");

export type FounderOpts = { founder: FounderMeta; branding?: Branding; forceDark?: boolean; cards?: Card[] };

export function renderFounder(c: Content, vars: Vars, o: FounderOpts): Rendered {
  const br = o.branding ?? DEFAULT_BRANDING;
  const f = o.founder;
  const issues: Issues = { missing: [], unknown: [], badUrl: false };
  const subject = oneLine(plainText(c.subject, vars, issues));
  const preheader = oneLine(plainText(c.preheader, vars, issues));
  const heading = oneLine(plainText(c.heading, vars, issues));
  const body = c.blocks.map((b) => blockHtml(b, vars, issues, br)).join("");
  const textBody = c.blocks.map((b) => blockText(b, vars, issues)).filter((s) => s.trim());
  const cards = o.cards ?? [];

  // CTA. Resource buttons fall back to "Reply to Anus" when no published resource exists (never an empty or dead link).
  let label = c.cta ? oneLine(plainText(c.cta.label, vars, issues)) : "";
  let url: string | null = null;
  if (c.cta) {
    let raw = c.cta.url;
    if (f.resourceCta && !vars.resource_url?.trim()) { raw = "{{reply_url}}"; label = "Reply to Anus"; }
    url = safeUrl(fill(raw, vars, issues));
    if (!url) issues.badUrl = true;
  }
  const optional = f.klass === "lifecycle" || f.klass === "promotional";
  if (optional) for (const k of ["preferences_url", "unsubscribe_url"]) if (!vars[k]?.trim() && !issues.missing.includes(k)) issues.missing.push(k);

  const isReply = url?.startsWith("mailto:");
  const ctaHtml = url ? `<div style="margin:22px 0 4px">${buttonHtml(label, url, f.layout === "E" ? "dark" : "primary", br)}</div>${isReply ? `<p class="muted" style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${BRAND.forest500}">Or just reply to this email. It reaches me and my team.</p>` : ""}` : "";

  const panel = f.layout === "D" ? `background:${BRAND.forest100};border-color:${BRAND.forest300}` : f.layout === "B" ? `background:#FFFFFF;border-left:4px solid ${BRAND.purple600}` : "background:#FFFFFF";
  const pad = f.layout === "A" || f.layout === "E" ? "34px 34px 30px" : "34px 34px 28px";
  const unsub = vars.unsubscribe_url?.trim() ? safeUrl(vars.unsubscribe_url) : null;
  const prefs = vars.preferences_url?.trim() ? safeUrl(vars.preferences_url) : null;
  const link = (h: string, l: string) => `<a href="${esc(h)}" style="color:${BRAND.forest700};text-decoration:underline">${l}</a>`;
  const why = f.klass === "service" ? "You are receiving this because of an order or request you made on beigeleads.com."
    : f.klass === "support" ? "You are receiving this because you contacted us or shared feedback on beigeleads.com."
    : "You are receiving this because you bought from BeigeLeads. You choose which of these emails you get.";
  const foot = optional && prefs && unsub ? `${link(prefs, "Email preferences")} &nbsp;|&nbsp; ${link(unsub, "Unsubscribe")}<br>` : "";
  const dark = `body,.bg{background:${BRAND.forest900}!important}.card-wrap{background:${BRAND.forest700}!important;border-color:${BRAND.forest500}!important}.t,h1{color:${BRAND.sand50}!important}.card{background:${BRAND.forest900}!important;border-color:${BRAND.forest500}!important}.note{background:${BRAND.forest500}!important;color:${BRAND.sand50}!important}.muted{color:${BRAND.sand200}!important}.muted a,.t a{color:${BRAND.forest100}!important}.logo-l{display:none!important}.logo-d{display:block!important;max-height:none!important}`;

  const html = `<!doctype html><html lang="en"${o.forceDark ? ' class="fd"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(subject)}</title><style>
body{margin:0;padding:0}img{border:0;max-width:100%}a{color:${BRAND.forest700}}
@media (max-width:620px){.col{display:block!important;width:100%!important;padding-right:0!important}.wrap{width:100%!important}.pad{padding:24px 18px!important}h1{font-size:26px!important}}
@media (prefers-color-scheme:dark){${dark}}
${o.forceDark ? dark.split("}").filter(Boolean).map((r) => `.fd ${r.replace(/,/g, ",.fd ")}}`).join("") : ""}
</style></head><body class="bg" style="margin:0;padding:0;background:${BRAND.sand50};font-family:${BRAND.font}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}${"&nbsp;&zwnj;".repeat(30)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:${BRAND.sand50}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="wrap" style="width:600px;max-width:100%">
<tr><td style="padding:0 4px 18px"><a href="${SITE}" style="text-decoration:none"><img class="logo-l" src="${BRAND.logoLight}" alt="BeigeLeads" height="${br.logoHeight}" style="display:block;height:${br.logoHeight}px;width:auto"><img class="logo-d" src="${BRAND.logoDark}" alt="" height="${br.logoHeight}" style="display:none;max-height:0;height:${br.logoHeight}px;width:auto"></a></td></tr>
<tr><td class="card-wrap pad" style="${panel};border:1px solid ${BRAND.sand200};${f.layout === "B" ? `border-left:4px solid ${BRAND.purple600};` : ""}border-radius:${br.cardRadius}px;padding:${pad}">
${signature()}
<h1 class="t" style="margin:0 0 18px;font-family:${BRAND.font};font-size:26px;line-height:1.35;font-weight:800;color:${BRAND.forest900}">${highlight(esc(heading))}</h1>
${body}${cards.length ? `<div style="margin:18px 0 6px">${cardsHtml(cards)}</div>` : ""}${ctaHtml}
</td></tr>
<tr><td class="muted" style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${BRAND.forest500}">
${foot}${why}<br>Replies go to ${esc(REPLY_TO)}, a monitored inbox.<br>${esc(BRAND.company)}
</td></tr></table></td></tr></table></body></html>`;

  const text = [FOUNDER_NAME + ", " + FOUNDER_TITLE, "", heading.replace(/==/g, ""), "", ...textBody.flatMap((b) => [b, ""]), ...(cards.length ? [cardsText(cards), ""] : []), ...(url ? [`${label}: ${url}`, ""] : []), "--", why,
    ...(optional && prefs && unsub ? [`Email preferences: ${prefs}`, `Unsubscribe: ${unsub}`] : []), `Replies go to ${REPLY_TO}.`, BRAND.company].join("\n");
  return { subject, preheader, html, text, issues };
}
