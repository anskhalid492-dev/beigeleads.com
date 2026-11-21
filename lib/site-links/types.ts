// Pure rules for the bottom footer: social links, AI shortcuts and the default prompt. Shared by the browser and the server.
// Nothing here invents a BeigeLeads social URL: the list of social links starts EMPTY and only admin-entered https links show.

export const SITE_ORIGIN = "https://beigeleads.com";
export const LLMS_URL = `${SITE_ORIGIN}/llms.txt`;

export const SOCIAL_PLATFORMS = [
  { key: "linkedin", name: "LinkedIn" },
  { key: "facebook", name: "Facebook" },
  { key: "instagram", name: "Instagram" },
  { key: "x", name: "X (Twitter)" },
  { key: "youtube", name: "YouTube" },
  { key: "tiktok", name: "TikTok" },
  { key: "pinterest", name: "Pinterest" },
  { key: "threads", name: "Threads" },
  { key: "github", name: "GitHub" },
  { key: "custom", name: "Custom link" },
] as const;
export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export type SocialLink = { id: string; platform: SocialKey; label: string; url: string; enabled: boolean; order: number; createdAt: number; updatedAt: number };

export const AI_ICONS = ["chatgpt", "perplexity", "grok", "gemini", "claude", "custom"] as const;
export type AiIcon = (typeof AI_ICONS)[number];
export type AiFallback = "copy_open" | "open_only";
export type AiPlatform = {
  id: string; name: string; icon: AiIcon; homepage: string;
  /** Verified prompt URL with the token {prompt}. Empty = this platform has no verified prefill: the prompt is copied instead. */
  promptUrl: string; enabled: boolean; order: number; override: string; fallback: AiFallback;
};
export type AiConfig = { prompt: string; heading: string; platforms: AiPlatform[] };

export const DEFAULT_PROMPT =
  "Tell me about BeigeLeads (https://beigeleads.com). What does the company offer? How does it source and verify its B2B email lists, what evidence is available about data accuracy, and how do its Done-For-You (DFY) Outbound and private custom list-building services work? Explain the available packages, benefits, limitations, and who each service is best suited for. Use BeigeLeads' official website and https://beigeleads.com/llms.txt as primary sources, and distinguish verified facts from marketing claims.";

export const PROMPT_MAX = 1500;
export const DEFAULT_HEADING = "Discover BeigeLeads with AI";

/**
 * Prompt URL templates. NONE of these platforms documents a web link that pre-fills a prompt (checked 21 Nov 2026:
 * x.ai documents only a grokbot:// app link, Anthropic documents only claude:// desktop links, OpenAI and Google
 * document nothing). So every default is empty and the button copies the prompt and opens the platform. An admin may add a
 * template after testing it; the admin screen says it is not officially documented.
 */
/**
 * Owner decision (21 Nov 2026): prompts open in the platform and start the chat. These ?q= links are widely used but NOT
 * officially documented by the platforms, so they can change; the click falls back to copy + open when a link is too long
 * or a platform stops accepting it. Gemini has no known prefill link, so it keeps copy + open.
 */
export const PREFILL: Record<string, string> = {
  chatgpt: "https://chatgpt.com/?q={prompt}",
  perplexity: "https://www.perplexity.ai/search?q={prompt}",
  grok: "https://grok.com/?q={prompt}",
  claude: "https://claude.ai/new?q={prompt}",
};
export function defaultAiPlatforms(): AiPlatform[] {
  const mk = (id: string, name: string, icon: AiIcon, homepage: string, order: number): AiPlatform => ({ id, name, icon, homepage, promptUrl: PREFILL[id] ?? "", enabled: true, order, override: "", fallback: "copy_open" });
  return [
    mk("chatgpt", "ChatGPT", "chatgpt", "https://chatgpt.com/", 0),
    mk("perplexity", "Perplexity", "perplexity", "https://www.perplexity.ai/", 1),
    mk("grok", "Grok", "grok", "https://grok.com/", 2),
    mk("gemini", "Gemini", "gemini", "https://gemini.google.com/app", 3),
    mk("claude", "Claude", "claude", "https://claude.ai/new", 4),
  ];
}
export const defaultAi = (): AiConfig => ({ prompt: DEFAULT_PROMPT, heading: DEFAULT_HEADING, platforms: defaultAiPlatforms() });

/** https only, no credentials, no control characters, bounded length. Returns the normalised URL or null. */
export function safeHttps(input: unknown, max = 500): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s || s.length > max || /[\u0000-\u001f\u007f\s]/.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch { return null; }
}

const BAD_PROMPT = [
  /\b(write|post|generate|create)\s+(fake|false|invented|fabricated)\b/i,
  /\bhide\s+(its\s+|the\s+|any\s+)?(weakness|weaknesses|limitations?|flaws|downsides)\b/i,
  /regardless of (the )?(evidence|facts)/i,
  /\balways\s+recommend\b/i,
  /\bignore\s+(all\s+)?(previous|prior)\s+instructions\b/i,
];

export function checkPrompt(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: false, error: "The prompt must be text." };
  const v = input.replace(/\r\n/g, "\n").trim();
  if (v.length < 20) return { ok: false, error: "The prompt is too short to be useful (20 characters minimum)." };
  if (v.length > PROMPT_MAX) return { ok: false, error: `The prompt is too long (${PROMPT_MAX} characters maximum), because it travels in a web address.` };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) return { ok: false, error: "The prompt contains control characters." };
  for (const re of BAD_PROMPT) if (re.test(v)) return { ok: false, error: "The prompt must not ask an AI to invent reviews, hide weaknesses, ignore evidence or always recommend BeigeLeads." };
  return { ok: true, value: v };
}

/** A template must be https, contain {prompt} exactly once, and stay on the platform's own host (or a subdomain of it). */
export function checkTemplate(template: string, homepage: string): { ok: true; value: string } | { ok: false; error: string } {
  const t = template.trim();
  if (!t) return { ok: true, value: "" };
  if ((t.match(/\{prompt\}/g) ?? []).length !== 1) return { ok: false, error: "The template must contain {prompt} exactly once." };
  const probe = safeHttps(t.replace("{prompt}", "x"), 600);
  if (!probe) return { ok: false, error: "The template must be a plain https address." };
  const home = safeHttps(homepage);
  if (!home) return { ok: false, error: "Fix the homepage address first." };
  const th = new URL(probe).hostname.replace(/^www\./, ""); const hh = new URL(home).hostname.replace(/^www\./, "");
  if (th !== hh && !th.endsWith(`.${hh}`) && !hh.endsWith(`.${th}`)) return { ok: false, error: "The template must stay on the platform's own website." };
  return { ok: true, value: t };
}

export const MAX_URL = 2000;

export type AiAction =
  | { kind: "prefill"; url: string; prompt: string }
  | { kind: "copy_open"; url: string; prompt: string }
  | { kind: "open_only"; url: string; prompt: string };

/** What a click does. Prefill only with a verified template and a URL that fits; otherwise copy + open (never truncate). */
export function aiAction(p: AiPlatform, defaultPrompt: string): AiAction {
  const prompt = (p.override.trim() || defaultPrompt).trim();
  if (p.promptUrl) {
    const url = p.promptUrl.replace("{prompt}", encodeURIComponent(prompt));
    if (url.length <= MAX_URL && safeHttps(url, MAX_URL)) return { kind: "prefill", url, prompt };
  }
  return { kind: p.fallback === "open_only" ? "open_only" : "copy_open", url: p.homepage, prompt };
}

export const aiMessage = (name: string, a: AiAction, copied: boolean) =>
  a.kind === "prefill" ? `Opening ${name} with the prompt filled in.`
  : a.kind === "open_only" ? `Opening ${name}.`
  : copied ? `Prompt copied. ${name} is opening: paste the prompt if the box is empty.`
  : `${name} is opening. Copying did not work, so copy the prompt shown below.`;

/** Cleans stored JSON of unknown shape into a valid AiConfig (never throws; bad rows are dropped or reset). */
export function parseAi(raw: string | null | undefined): AiConfig {
  const base = defaultAi();
  if (!raw) return base;
  try {
    const j = JSON.parse(raw) as Partial<AiConfig>;
    const prompt = checkPrompt(j.prompt);
    const heading = typeof j.heading === "string" && j.heading.trim() && j.heading.length <= 60 ? j.heading.trim() : DEFAULT_HEADING;
    const rows = Array.isArray(j.platforms) ? j.platforms : [];
    const platforms: AiPlatform[] = [];
    for (const r of rows.slice(0, 12)) {
      const x = r as Partial<AiPlatform>;
      const homepage = safeHttps(x.homepage);
      if (!homepage || typeof x.name !== "string" || !x.name.trim() || x.name.length > 40) continue;
      const tpl = checkTemplate(typeof x.promptUrl === "string" ? x.promptUrl : "", homepage);
      const ov = typeof x.override === "string" && x.override.trim() ? checkPrompt(x.override) : null;
      platforms.push({
        id: typeof x.id === "string" && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : `p${platforms.length}`,
        name: x.name.trim(), icon: (AI_ICONS as readonly string[]).includes(String(x.icon)) ? (x.icon as AiIcon) : "custom", homepage,
        promptUrl: tpl.ok && tpl.value ? tpl.value : (typeof x.id === "string" ? PREFILL[x.id] ?? "" : ""), enabled: x.enabled !== false, order: Number.isFinite(x.order) ? Number(x.order) : platforms.length,
        override: ov && ov.ok ? ov.value : "", fallback: x.fallback === "open_only" ? "open_only" : "copy_open",
      });
    }
    return { prompt: prompt.ok ? prompt.value : DEFAULT_PROMPT, heading, platforms: Array.isArray(j.platforms) ? platforms.sort((a, b) => a.order - b.order) : base.platforms };
  } catch { return base; }
}

export function parseSocial(raw: string | null | undefined): SocialLink[] {
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as Partial<SocialLink>[];
    if (!Array.isArray(rows)) return [];
    const out: SocialLink[] = [];
    for (const x of rows.slice(0, 20)) {
      const url = safeHttps(x.url);
      const platform = SOCIAL_PLATFORMS.some((p) => p.key === x.platform) ? (x.platform as SocialKey) : "custom";
      if (!url) continue;
      out.push({
        id: typeof x.id === "string" && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : `s${out.length}`, platform,
        label: typeof x.label === "string" ? x.label.trim().slice(0, 40) : "", url, enabled: x.enabled !== false,
        order: Number.isFinite(x.order) ? Number(x.order) : out.length, createdAt: Number(x.createdAt) || 0, updatedAt: Number(x.updatedAt) || 0,
      });
    }
    return out.sort((a, b) => a.order - b.order);
  } catch { return []; }
}

export const socialName = (l: Pick<SocialLink, "platform" | "label">) => l.label || SOCIAL_PLATFORMS.find((p) => p.key === l.platform)?.name || "Link";

/** Validates rows typed in the admin. Errors name the row; all-or-nothing. */
export function checkSocialRows(rows: unknown): { ok: true; rows: SocialLink[] } | { ok: false; error: string } {
  if (!Array.isArray(rows)) return { ok: false, error: "Nothing to save." };
  if (rows.length > 20) return { ok: false, error: "Twenty links at most." };
  const out: SocialLink[] = []; const now = Date.now();
  for (let i = 0; i < rows.length; i++) {
    const x = rows[i] as Partial<SocialLink>; const n = i + 1;
    if (!SOCIAL_PLATFORMS.some((p) => p.key === x.platform)) return { ok: false, error: `Link ${n}: choose a platform.` };
    const url = safeHttps(x.url);
    if (!url) return { ok: false, error: `Link ${n}: the address must be a full https:// link (no javascript:, http: or spaces).` };
    const label = typeof x.label === "string" ? x.label.trim() : "";
    if (label.length > 40) return { ok: false, error: `Link ${n}: the label is longer than 40 characters.` };
    if (x.platform === "custom" && !label) return { ok: false, error: `Link ${n}: a custom link needs a label (it becomes the accessible name).` };
    out.push({ id: typeof x.id === "string" && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : `s${now.toString(36)}${i}`, platform: x.platform as SocialKey, label, url, enabled: x.enabled !== false, order: i, createdAt: Number(x.createdAt) || now, updatedAt: now });
  }
  return { ok: true, rows: out };
}

export function checkAi(input: unknown): { ok: true; value: AiConfig } | { ok: false; error: string } {
  const j = input as Partial<AiConfig>;
  const pr = checkPrompt(j?.prompt);
  if (!pr.ok) return pr;
  const heading = typeof j.heading === "string" ? j.heading.trim() : "";
  if (!heading || heading.length > 60) return { ok: false, error: "The heading must be 1 to 60 characters." };
  if (!Array.isArray(j.platforms) || j.platforms.length > 12) return { ok: false, error: "Twelve AI platforms at most." };
  const out: AiPlatform[] = []; const seen = new Set<string>();
  for (let i = 0; i < j.platforms.length; i++) {
    const x = j.platforms[i] as Partial<AiPlatform>; const n = x.name?.trim() || `row ${i + 1}`;
    if (typeof x.name !== "string" || !x.name.trim() || x.name.length > 40) return { ok: false, error: `Platform ${i + 1}: a name of 1 to 40 characters is needed.` };
    const homepage = safeHttps(x.homepage);
    if (!homepage) return { ok: false, error: `${n}: the homepage must be a full https:// address.` };
    const t = checkTemplate(typeof x.promptUrl === "string" ? x.promptUrl : "", homepage);
    if (!t.ok) return { ok: false, error: `${n}: ${t.error}` };
    let override = "";
    if (typeof x.override === "string" && x.override.trim()) { const o = checkPrompt(x.override); if (!o.ok) return { ok: false, error: `${n}: ${o.error}` }; override = o.value; }
    const id = typeof x.id === "string" && /^[a-z0-9-]{1,40}$/.test(x.id) ? x.id : `p${Date.now().toString(36)}${i}`;
    if (seen.has(id)) return { ok: false, error: `${n}: duplicate row.` };
    seen.add(id);
    out.push({ id, name: x.name.trim(), icon: (AI_ICONS as readonly string[]).includes(String(x.icon)) ? (x.icon as AiIcon) : "custom", homepage, promptUrl: t.value, enabled: x.enabled !== false, order: i, override, fallback: x.fallback === "open_only" ? "open_only" : "copy_open" });
  }
  return { ok: true, value: { prompt: pr.value, heading, platforms: out } };
}

/** What the public footer may know (sent to the browser). */
export type FooterConfig = { social: { id: string; platform: SocialKey; label: string; url: string }[]; ai: { heading: string; prompt: string; platforms: AiPlatform[] } };

export function publicFooter(social: SocialLink[], ai: AiConfig): FooterConfig {
  return {
    social: social.filter((s) => s.enabled).map(({ id, platform, label, url }) => ({ id, platform, label, url })),
    ai: { heading: ai.heading, prompt: ai.prompt, platforms: ai.platforms.filter((p) => p.enabled) },
  };
}
