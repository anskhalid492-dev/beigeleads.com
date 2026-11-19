import { BRAND, SITE } from "./brand";
import type { Block, Content } from "./types";
import { VAR_KEYS, getVar } from "./variables";

export type Vars = Record<string, string | undefined>;
export type Issues = { missing: string[]; unknown: string[]; badUrl: boolean };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
/** Variable values can never form **bold** or break out of HTML. */
const htmlValue = (v: string) => esc(v).replace(/\*/g, "&#42;").replace(/\n/g, "<br>");
const htmlText = (t: string, vars: Vars, issues: Issues) => {
  // Escape the template text first, then fill (values escaped separately), then apply **bold** to the result.
  const filled = fill(esc(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"'), vars, issues, htmlValue);
  // Only links to our own site become clickable; a customer-typed address can never become a link.
  const linked = filled.replace(/https:\/\/beigeleads\.com[^\s<]*[^\s<.,;:)!?]/g, (u) => `<a href="${u}" style="color:${BRAND.forest700};text-decoration:underline">${u}</a>`);
  return linked.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
};
const plainText = (t: string, vars: Vars, issues: Issues) => fill(t, vars, issues).replace(/\*\*(.+?)\*\*/g, "$1");

/** Only https links, or a site path. Everything else (javascript:, data:, http:) is rejected. */
export function safeUrl(raw: string): string | null {
  const u = raw.trim();
  if (/^\/(?!\/)[^\s"<>]*$/.test(u)) return SITE + u;
  if (/^https:\/\/[^\s"<>]+$/i.test(u)) { try { new URL(u); return u; } catch { return null; } }
  return null;
}

export type Rendered = { subject: string; preheader: string; html: string; text: string; issues: Issues };

function blockHtml(b: Block, vars: Vars, issues: Issues): string {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.forest700}`;
  if (b.t === "p") { const h = htmlText(b.text, vars, issues); return h.trim() ? `<p class="t" style="${p}">${h}</p>` : ""; }
  if (b.t === "list") {
    const items = b.items.map((i) => htmlText(i, vars, issues)).filter((i) => i.trim());
    return items.length ? `<ul class="t" style="${p};padding-left:20px">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join("")}</ul>` : "";
  }
  if (b.t === "kv") {
    // A row whose value resolves to nothing is dropped, so the email never shows an empty "Package:" line.
    const rows = b.rows.map((r) => ({ l: htmlText(r.label, vars, issues), v: htmlText(r.value, vars, { missing: [], unknown: [], badUrl: false }) })).filter((r) => r.v.trim());
    if (!rows.length) return "";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="margin:0 0 20px;background:${BRAND.sand100};border:1px solid ${BRAND.sand200};border-radius:12px"><tbody>${rows.map((r) => `<tr><td class="t" style="padding:10px 16px;font-size:14px;color:${BRAND.forest500};width:38%;vertical-align:top">${r.l}</td><td class="t" style="padding:10px 16px;font-size:14px;font-weight:600;color:${BRAND.forest900};vertical-align:top">${r.v}</td></tr>`).join("")}</tbody></table>`;
  }
  const h = htmlText(b.text, vars, issues);
  return h.trim() ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td class="note" style="padding:12px 16px;font-size:14px;line-height:1.55;color:${BRAND.forest700};background:${BRAND.forest100};border-radius:12px">${h}</td></tr></table>` : "";
}

function blockText(b: Block, vars: Vars, issues: Issues): string {
  if (b.t === "p" || b.t === "note") return plainText(b.text, vars, issues);
  if (b.t === "list") return b.items.map((i) => plainText(i, vars, issues)).filter(Boolean).map((i) => `- ${i}`).join("\n");
  return b.rows.map((r) => ({ l: plainText(r.label, vars, issues), v: plainText(r.value, vars, { missing: [], unknown: [], badUrl: false }) })).filter((r) => r.v.trim()).map((r) => `${r.l} ${r.v}`).join("\n");
}

/** Renders one template. Pure: no network, no D1. `forceDark` is only for the admin dark-mode preview. */
export function renderEmail(c: Content, vars: Vars, opts: { forceDark?: boolean } = {}): Rendered {
  const issues: Issues = { missing: [], unknown: [], badUrl: false };
  const subject = oneLine(plainText(c.subject, vars, issues));
  const preheader = oneLine(plainText(c.preheader, vars, issues));
  const heading = oneLine(plainText(c.heading, vars, issues));
  const body = c.blocks.map((b) => blockHtml(b, vars, issues)).join("");
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
      ctaHtml = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td align="center" bgcolor="${BRAND.purple600}" style="border-radius:12px"><a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-family:${BRAND.font};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px">${esc(label)}</a></td></tr></table><p class="t" style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${BRAND.forest500}">Button not working? Copy this link into your browser:<br><a href="${esc(url)}" style="color:${BRAND.forest700};word-break:break-all">${esc(url)}</a></p>`;
    }
  }

  const link = (href: string, label: string) => `<a href="${href}" style="color:${BRAND.forest700};text-decoration:underline">${label}</a>`;
  const support = vars.support_email?.trim() ? ` or write to ${esc(vars.support_email.trim())}` : "";
  const dark = `body,.bg{background:${BRAND.forest900}!important}.card-wrap{background:${BRAND.forest700}!important;border-color:${BRAND.forest500}!important}.t,h1,.sig{color:${BRAND.sand50}!important}.card{background:${BRAND.forest900}!important;border-color:${BRAND.forest500}!important}.note{background:${BRAND.forest500}!important;color:${BRAND.sand50}!important}.muted{color:${BRAND.sand200}!important}.muted a,.t a{color:${BRAND.forest100}!important}.logo-l{display:none!important}.logo-d{display:block!important;max-height:none!important}`;
  const html = `<!doctype html><html lang="en"${opts.forceDark ? ' class="fd"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(subject)}</title><style>
body{margin:0;padding:0}img{border:0;max-width:100%}a{color:${BRAND.forest700}}
@media (max-width:620px){.wrap{width:100%!important}.pad{padding:24px 18px!important}h1{font-size:26px!important}}
@media (prefers-color-scheme:dark){${dark}}
${opts.forceDark ? dark.split("}").filter(Boolean).map((r) => `.fd ${r.replace(/,/g, ",.fd ")}}`).join("") : ""}
</style></head><body class="bg" style="margin:0;padding:0;background:${BRAND.sand50};font-family:${BRAND.font}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}${"&nbsp;&zwnj;".repeat(30)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:${BRAND.sand50}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="wrap" style="width:600px;max-width:100%">
<tr><td style="padding:0 4px 18px"><a href="${SITE}" style="text-decoration:none"><img class="logo-l" src="${BRAND.logoLight}" alt="BeigeLeads" height="34" style="display:block;height:34px;width:auto"><img class="logo-d" src="${BRAND.logoDark}" alt="" height="34" style="display:none;max-height:0;height:34px;width:auto"></a></td></tr>
<tr><td class="card-wrap pad" style="background:#FFFFFF;border:1px solid ${BRAND.sand200};border-radius:20px;padding:36px 36px 28px">
<h1 class="t" style="margin:0 0 20px;font-family:${BRAND.font};font-size:30px;line-height:1.15;font-weight:800;color:${BRAND.forest900}">${esc(heading)}</h1>
${body}${ctaHtml}
${signoff.trim() ? `<p class="sig t" style="margin:0;font-size:16px;line-height:1.6;color:${BRAND.forest700}">${esc(signoff).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr>
<tr><td class="muted" style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${BRAND.forest500}">
<strong class="t" style="color:${BRAND.forest700}">BeigeLeads</strong> is a B2B data provider. One purchase, no subscription.<br>
${link(SITE, "beigeleads.com")} &nbsp;|&nbsp; ${link(`${SITE}/help-center`, "Help Center")} &nbsp;|&nbsp; ${link(`${SITE}/contact`, "Contact")}<br>
Questions about this email? Use the contact page${support}.<br>
You are receiving this because of an action you took on beigeleads.com. This is a transactional message, not marketing.<br>${esc(BRAND.company)}
</td></tr></table></td></tr></table></body></html>`;

  const text = [heading, "", ...textBody.flatMap((b) => [b, ""]), ...(ctaText ? [ctaText, ""] : []), ...(signoff.trim() ? [signoff, ""] : []), "--", "BeigeLeads, a B2B data provider. One purchase, no subscription.", `${SITE} | Help Center: ${SITE}/help-center | Contact: ${SITE}/contact`, BRAND.company].join("\n");
  return { subject, preheader, html, text, issues };
}
