import { BRAND, SITE } from "./brand";
import { DEFAULT_BRANDING, type Branding } from "./branding";
import type { Block, Content, FounderMeta, Style } from "./types";
import { renderFounder, type Card } from "@/lib/founder/render";
import { VAR_KEYS, getVar } from "./variables";

export type Vars = Record<string, string | undefined>;
export type Issues = { missing: string[]; unknown: string[]; badUrl: boolean };

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const TOKEN = /\{\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}\}/g;

/** Names are optional. A missing name removes ", {{first_name}}" (or a leading "{{first_name}}, ") instead of printing "there". */
function dropMissingPersonal(text: string, vars: Vars): string {
  let t = text;
  for (const k of ["first_name", "customer_name"]) {
    if (vars[k]?.trim()) continue;
    const re = `\\{\\{\\s*${k}\\s*(?:\\|[^}]*)?\\}\\}`;
    t = t.replace(new RegExp(`^${re},\\s*(\\S)`), (_m, c: string) => c.toUpperCase());
    t = t.replace(new RegExp(`,\\s*${re}(?=[!.?]|$)`, "g"), "");
  }
  return t;
}

/** Fills {{variables}}. `fmt` turns each value (not the template text) into its output form. */
export function fill(text: string, vars: Vars, issues: Issues, fmt: (v: string) => string = (v) => v): string {
  return dropMissingPersonal(text, vars).replace(TOKEN, (_m, key: string, inline?: string) => {
    if (!VAR_KEYS.has(key)) { if (!issues.unknown.includes(key)) issues.unknown.push(key); return ""; }
    const v = vars[key]?.trim();
    if (v) return fmt(v);
    const fb = inline?.trim() || getVar(key)?.fallback;
    if (fb) return fmt(fb);
    if (!issues.missing.includes(key)) issues.missing.push(key);
    return "";
  });
}

export const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
/** Variable values can never form **bold** or break out of HTML. */
const htmlValue = (v: string) => esc(v).replace(/\*/g, "&#42;").replace(/\n/g, "<br>");
export const htmlText = (t: string, vars: Vars, issues: Issues) => {
  // Escape the template text first, then fill (values escaped separately), then apply **bold** to the result.
  const filled = fill(esc(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"'), vars, issues, htmlValue);
  // Only links to our own site become clickable; a customer-typed address can never become a link.
  const linked = filled.replace(/https:\/\/beigeleads\.com[^\s<]*[^\s<.,;:)!?]/g, (u) => `<a href="${u}" style="color:${BRAND.forest700};text-decoration:underline">${u}</a>`);
  return linked.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
};
export const plainText = (t: string, vars: Vars, issues: Issues) => fill(t, vars, issues).replace(/\*\*(.+?)\*\*/g, "$1");

/** Only https links, or a site path. Everything else (javascript:, data:, http:) is rejected. */
export function safeUrl(raw: string): string | null {
  const u = raw.trim();
  if (/^\/(?!\/)[^\s"<>]*$/.test(u)) return SITE + u;
  if (/^https:\/\/[^\s"<>]+$/i.test(u)) { try { new URL(u); return u; } catch { return null; } }
  // Reply-based buttons: ONLY the BeigeLeads contact inbox, with an already-encoded subject/body.
  if (/^mailto:hello@beigeleads\.com(\?[A-Za-z0-9%._~!$&'()*+,;=:@\/?-]*)?$/.test(u)) return u;
  return null;
}

export type Rendered = { subject: string; preheader: string; html: string; text: string; issues: Issues };

const TEXT_PX = { sm: 14, md: 16, lg: 18, xl: 22 } as const;
const HEAD_PX = { sm: 18, md: 22, lg: 26, xl: 32 } as const;
const PAD = { none: 0, sm: 8, md: 16, lg: 24 } as const;
export const MUTED_URL_ISSUES = (): Issues => ({ missing: [], unknown: [], badUrl: false });

/** Wraps already-safe inner HTML in the block's tone/alignment/padding. Colours come only from the palette. */
function box(inner: string, st: Style | undefined, d: { tone?: Style["tone"]; pad?: Style["pad"]; bottom?: number } = {}): string {
  const tone = st?.tone ?? d.tone ?? "none";
  const pad = PAD[st?.pad ?? d.pad ?? (tone === "none" ? "none" : "md")];
  const radius = st?.radius ?? 12;
  const align = st?.align ?? "left";
  const toneCss = tone === "soft" ? `background:${BRAND.sand100};border:1px solid ${BRAND.sand200};color:${BRAND.forest900};` : tone === "highlight" ? `background:${BRAND.forest100};color:${BRAND.forest900};` : tone === "dark" ? `background:${BRAND.forest900};color:${BRAND.sand50};` : "";
  const cls = tone === "soft" ? "card" : tone === "highlight" ? "note" : tone === "dark" ? "dk" : "t";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 ${d.bottom ?? 16}px"><tr><td class="${cls}" align="${align}" style="${toneCss}${tone !== "none" ? `border-radius:${radius}px;` : ""}padding:${pad}px;text-align:${align}">${inner}</td></tr></table>`;
}

export function blockHtml(b: Block, vars: Vars, issues: Issues, br: Branding): string {
  const st = b.style;
  const fs = TEXT_PX[st?.size ?? "md"];
  const base = `margin:0;font-size:${fs}px;line-height:1.6;${st?.bold ? "font-weight:700;" : ""}`;
  const color = (st?.tone ?? "none") === "none" ? `color:${BRAND.forest700};` : "";
  switch (b.t) {
    case "p": { const h = htmlText(b.text, vars, issues); return h.trim() ? box(`<p style="${base}${color}">${h}</p>`, st) : ""; }
    case "list": {
      const items = b.items.map((i) => htmlText(i, vars, issues)).filter((i) => i.trim());
      return items.length ? box(`<ul style="${base}${color}padding-left:20px">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join("")}</ul>`, st) : "";
    }
    case "kv": {
      // A row whose value resolves to nothing is dropped, so the email never shows an empty "Package:" line.
      const rows = b.rows.map((r) => ({ l: htmlText(r.label, vars, issues), v: htmlText(r.value, vars, MUTED_URL_ISSUES()) })).filter((r) => r.v.trim());
      if (!rows.length) return "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="margin:0 0 20px;background:${BRAND.sand100};border:1px solid ${BRAND.sand200};border-radius:${st?.radius ?? 12}px"><tbody>${rows.map((r) => `<tr><td class="t" style="padding:10px 16px;font-size:14px;color:${BRAND.forest500};width:38%;vertical-align:top">${r.l}</td><td class="t" style="padding:10px 16px;font-size:14px;font-weight:600;color:${BRAND.forest900};vertical-align:top">${r.v}</td></tr>`).join("")}</tbody></table>`;
    }
    case "note": { const h = htmlText(b.text, vars, issues); return h.trim() ? box(`<div style="font-size:${st?.size ? fs : 14}px;line-height:1.55;${st?.bold ? "font-weight:700;" : ""}">${h}</div>`, { tone: "highlight", ...st }, { bottom: 20 }) : ""; }
    case "heading": { const h = htmlText(b.text, vars, issues); return h.trim() ? box(`<h2 style="margin:0;font-family:${BRAND.font};font-size:${HEAD_PX[st?.size ?? "lg"]}px;line-height:1.2;font-weight:${st?.bold === false ? 600 : 800};${color}">${h}</h2>`, st) : ""; }
    case "image": {
      const src = safeUrl(fill(b.src, vars, issues));
      if (!src) { issues.badUrl = true; return ""; }
      const link = b.link ? safeUrl(fill(b.link, vars, issues)) : null;
      if (b.link && !link) issues.badUrl = true;
      const w = { sm: 160, md: 320, full: 528 }[b.width];
      const img = `<img src="${esc(src)}" alt="${esc(oneLine(plainText(b.alt, vars, issues)))}" width="${w}" style="display:inline-block;width:${w}px;max-width:100%;height:auto;border-radius:${st?.radius ?? 12}px">`;
      return box(link ? `<a href="${esc(link)}">${img}</a>` : img, { ...st, tone: "none" });
    }
    case "button": {
      const label = oneLine(plainText(b.label, vars, issues));
      const url = safeUrl(fill(b.url, vars, issues));
      if (!url) { issues.badUrl = true; return ""; }
      return box(buttonHtml(label, url, b.variant, br, st?.radius), { ...st, tone: "none" }, { bottom: 20 });
    }
    case "divider": return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-top:1px solid ${BRAND.sand200};font-size:1px;line-height:1px">&nbsp;</td></tr></table>`;
    case "spacer": { const h = { sm: 12, md: 24, lg: 40 }[b.size]; return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="${h}" style="height:${h}px;font-size:1px;line-height:${h}px">&nbsp;</td></tr></table>`; }
    case "columns": {
      const l = htmlText(b.left, vars, issues), r = htmlText(b.right, vars, issues);
      if (!l.trim() && !r.trim()) return "";
      const cell = (h: string) => `<td class="col t" width="50%" valign="top" style="width:50%;padding:0 8px 8px 0;font-size:${fs}px;line-height:1.6;${color}">${h}</td>`;
      return box(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cell(l)}${cell(r)}</tr></table>`, st);
    }
    case "social": {
      const links = b.links.map((x) => ({ l: oneLine(plainText(x.label, vars, MUTED_URL_ISSUES())), u: safeUrl(x.url) })).filter((x) => x.l && x.u && x.u.startsWith("https://"));
      if (!links.length) return "";
      return box(links.map((x) => `<a href="${esc(x.u!)}" style="color:${BRAND.forest700};font-size:14px;font-weight:600;margin-right:14px;text-decoration:underline">${esc(x.l)}</a>`).join(""), st);
    }
    case "support": {
      const h = htmlText(b.text, vars, issues);
      const mail = vars.support_email?.trim();
      const lines = [`<a href="${SITE}/contact" style="color:${BRAND.forest700};text-decoration:underline">Contact page</a>`, ...(mail ? [`<a href="mailto:${esc(mail)}" style="color:${BRAND.forest700};text-decoration:underline">${esc(mail)}</a>`] : [])];
      return box(`<p style="${base}${color}">${h}</p><p style="margin:8px 0 0;font-size:14px">${lines.join(" &nbsp;|&nbsp; ")}</p>`, { tone: "soft", ...st }, { bottom: 20 });
    }
    case "logo": {
      const h = { sm: 28, md: 34, lg: 48 }[b.size];
      return box(`<img class="logo-l" src="${BRAND.logoLight}" alt="BeigeLeads" height="${h}" style="height:${h}px;width:auto"><img class="logo-d" src="${BRAND.logoDark}" alt="" height="${h}" style="display:none;max-height:0;height:${h}px;width:auto">`, { ...st, tone: "none" });
    }
    case "footnote": { const h = htmlText(b.text, vars, issues); return h.trim() ? box(`<p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.forest500}">${h}</p>`, { ...st, tone: "none" }) : ""; }
  }
}

export function buttonHtml(label: string, url: string, variant: "primary" | "dark" | "outline", br: Branding, radius?: number): string {
  const v = variant === "primary" && br.buttonColor === "dark" ? "dark" : variant;
  const r = radius ?? br.buttonRadius;
  const bg = v === "primary" ? BRAND.purple600 : v === "dark" ? BRAND.forest900 : "transparent";
  const fg = v === "outline" ? BRAND.forest700 : "#FFFFFF";
  const border = v === "outline" ? `2px solid ${BRAND.forest700}` : "none";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table"><tr><td align="center" ${v === "outline" ? 'class="t"' : `bgcolor="${bg}"`} style="${v === "outline" ? "" : `background:${bg};`}border-radius:${r}px;border:${border}"><a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-family:${BRAND.font};font-size:16px;font-weight:700;color:${fg};text-decoration:none;border-radius:${r}px">${esc(label)}</a></td></tr></table>`;
}

export function blockText(b: Block, vars: Vars, issues: Issues): string {
  switch (b.t) {
    case "p": case "note": case "heading": case "footnote": return plainText(b.text, vars, issues);
    case "list": return b.items.map((i) => plainText(i, vars, issues)).filter(Boolean).map((i) => `- ${i}`).join("\n");
    case "kv": return b.rows.map((r) => ({ l: plainText(r.label, vars, issues), v: plainText(r.value, vars, MUTED_URL_ISSUES()) })).filter((r) => r.v.trim()).map((r) => `${r.l} ${r.v}`).join("\n");
    case "button": { const u = safeUrl(fill(b.url, vars, MUTED_URL_ISSUES())); return u ? `${oneLine(plainText(b.label, vars, issues))}: ${u}` : ""; }
    case "columns": return [plainText(b.left, vars, issues), plainText(b.right, vars, issues)].filter((x) => x.trim()).join("\n\n");
    case "social": return b.links.filter((x) => x.label && /^https:\/\//i.test(x.url)).map((x) => `${x.label}: ${x.url}`).join("\n");
    case "support": return `${plainText(b.text, vars, issues)}\nContact: ${SITE}/contact${vars.support_email?.trim() ? `\nEmail: ${vars.support_email.trim()}` : ""}`;
    case "image": return b.alt.trim() ? `[${plainText(b.alt, vars, issues)}]` : "";
    case "divider": return "----";
    default: return "";
  }
}

/** Renders one template. Pure: no network, no D1. `forceDark` is only for the admin dark-mode preview. */
export function renderEmail(c: Content, vars: Vars, opts: { forceDark?: boolean; branding?: Branding; founder?: FounderMeta; cards?: Card[] } = {}): Rendered {
  if (opts.founder) return renderFounder(c, vars, { founder: opts.founder, branding: opts.branding, forceDark: opts.forceDark, cards: opts.cards });
  const br = opts.branding ?? DEFAULT_BRANDING;
  const issues: Issues = { missing: [], unknown: [], badUrl: false };
  const subject = oneLine(plainText(c.subject, vars, issues));
  const preheader = oneLine(plainText(c.preheader, vars, issues));
  const heading = oneLine(plainText(c.heading, vars, issues));
  const body = c.blocks.map((b) => blockHtml(b, vars, issues, br)).join("");
  const textBody = c.blocks.map((b) => blockText(b, vars, issues)).filter((s) => s.trim());
  const signoff = plainText(c.signoff, vars, issues);

  let ctaHtml = "";
  let ctaText = "";
  if (c.cta) {
    const label = oneLine(plainText(c.cta.label, vars, issues));
    const url = safeUrl(fill(c.cta.url, vars, issues));
    if (!url) issues.badUrl = true;
    else {
      ctaText = `${label}: ${url}`;
      ctaHtml = `<div style="margin:8px 0 24px">${buttonHtml(label, url, "primary", br)}</div><p class="t" style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${BRAND.forest500}">Button not working? Copy this link into your browser:<br><a href="${esc(url)}" style="color:${BRAND.forest700};word-break:break-all">${esc(url)}</a></p>`;
    }
  }

  const link = (href: string, label: string) => `<a href="${href}" style="color:${BRAND.forest700};text-decoration:underline">${label}</a>`;
  const support = vars.support_email?.trim() ? ` or write to ${esc(vars.support_email.trim())}` : "";
  const dark = `body,.bg{background:${BRAND.forest900}!important}.card-wrap{background:${BRAND.forest700}!important;border-color:${BRAND.forest500}!important}.t,h1,.sig{color:${BRAND.sand50}!important}.card{background:${BRAND.forest900}!important;border-color:${BRAND.forest500}!important}.note{background:${BRAND.forest500}!important;color:${BRAND.sand50}!important}.muted{color:${BRAND.sand200}!important}.muted a,.t a{color:${BRAND.forest100}!important}.logo-l{display:none!important}.logo-d{display:block!important;max-height:none!important}`;
  const html = `<!doctype html><html lang="en"${opts.forceDark ? ' class="fd"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(subject)}</title><style>
body{margin:0;padding:0}img{border:0;max-width:100%}a{color:${BRAND.forest700}}
@media (max-width:620px){.col{display:block!important;width:100%!important;padding-right:0!important}.wrap{width:100%!important}.pad{padding:24px 18px!important}h1{font-size:26px!important}}
@media (prefers-color-scheme:dark){${dark}}
${opts.forceDark ? dark.split("}").filter(Boolean).map((r) => `.fd ${r.replace(/,/g, ",.fd ")}}`).join("") : ""}
</style></head><body class="bg" style="margin:0;padding:0;background:${BRAND.sand50};font-family:${BRAND.font}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}${"&nbsp;&zwnj;".repeat(30)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:${BRAND.sand50}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="wrap" style="width:600px;max-width:100%">
<tr><td style="padding:0 4px 18px"><a href="${SITE}" style="text-decoration:none"><img class="logo-l" src="${BRAND.logoLight}" alt="BeigeLeads" height="${br.logoHeight}" style="display:block;height:${br.logoHeight}px;width:auto"><img class="logo-d" src="${BRAND.logoDark}" alt="" height="${br.logoHeight}" style="display:none;max-height:0;height:${br.logoHeight}px;width:auto"></a></td></tr>
<tr><td class="card-wrap pad" style="background:#FFFFFF;border:1px solid ${BRAND.sand200};border-radius:${br.cardRadius}px;padding:36px 36px 28px">
<h1 class="t" style="margin:0 0 20px;font-family:${BRAND.font};font-size:30px;line-height:1.15;font-weight:800;color:${BRAND.forest900}">${esc(heading)}</h1>
${body}${ctaHtml}
${signoff.trim() ? `<p class="sig t" style="margin:0;font-size:16px;line-height:1.6;color:${BRAND.forest700}">${esc(signoff).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr>
<tr><td class="muted" style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${BRAND.forest500}">
<strong class="t" style="color:${BRAND.forest700}">BeigeLeads</strong> is a B2B data provider. One purchase, no subscription.<br>
${link(SITE, "beigeleads.com")} &nbsp;|&nbsp; ${link(`${SITE}/help-center`, "Help Center")} &nbsp;|&nbsp; ${link(`${SITE}/contact`, "Contact")}<br>
Questions about this email? Use the contact page${support}.<br>
${br.footerNote ? `${esc(br.footerNote)}<br>` : ""}${br.social.length ? `${br.social.map((x) => link(esc(x.url), esc(x.label))).join(" &nbsp;|&nbsp; ")}<br>` : ""}
You are receiving this because of an action you took on beigeleads.com. This is a transactional message, not marketing.<br>${esc(BRAND.company)}
</td></tr></table></td></tr></table></body></html>`;

  const text = [heading, "", ...textBody.flatMap((b) => [b, ""]), ...(ctaText ? [ctaText, ""] : []), ...(signoff.trim() ? [signoff, ""] : []), "--", "BeigeLeads, a B2B data provider. One purchase, no subscription.", `${SITE} | Help Center: ${SITE}/help-center | Contact: ${SITE}/contact`, BRAND.company].join("\n");
  return { subject, preheader, html, text, issues };
}
