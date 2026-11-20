// One interface over OpenAI, Anthropic (Claude) and Google Gemini. Server-side only: the key never leaves the Worker.
// Messages are kept in a neutral shape and converted per provider, so switching provider needs no other code change.
export const PROVIDER_IDS = ["openai", "anthropic", "gemini"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];
export const PROVIDER_LABEL: Record<ProviderId, string> = { openai: "OpenAI", anthropic: "Anthropic Claude", gemini: "Google Gemini" };
export const isProviderId = (v: unknown): v is ProviderId => PROVIDER_IDS.includes(v as ProviderId);

export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> };
export type Call = { id: string; name: string; args: Record<string, unknown> };
export type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; calls?: Call[]; raw?: unknown }
  | { role: "tool"; results: { id: string; name: string; content: string }[] };
export type Completion = { text: string; calls: Call[]; tokensIn: number; tokensOut: number; raw?: unknown };
export type CallCfg = { model: string; temperature: number; maxTokens: number; timeoutMs?: number };

export class ProviderError extends Error {
  constructor(message: string, readonly kind: "auth" | "quota" | "bad_model" | "server" | "timeout" | "other" = "other") { super(message); }
}

type Json = Record<string, unknown>;
const T = (ms?: number) => AbortSignal.timeout(ms ?? 25_000);

async function send(url: string, init: RequestInit, ms?: number): Promise<Json> {
  let res: Response;
  try { res = await fetch(url, { ...init, signal: T(ms) }); }
  catch (e) { throw new ProviderError(e instanceof Error && e.name === "TimeoutError" ? "The AI provider took too long to answer." : "Could not reach the AI provider.", e instanceof Error && e.name === "TimeoutError" ? "timeout" : "server"); }
  const text = await res.text();
  let body: Json = {};
  try { body = JSON.parse(text) as Json; } catch { /* keep empty */ }
  if (res.ok) return body;
  const detail = String(((body.error as Json | undefined)?.message as string) ?? "").slice(0, 200);
  if (res.status === 401 || res.status === 403) throw new ProviderError("The provider rejected the API key.", "auth");
  if (res.status === 429) throw new ProviderError("The provider reports a rate limit or quota problem.", "quota");
  if (res.status === 404 || res.status === 400) throw new ProviderError(`The provider refused the request${detail ? `: ${detail}` : ""}`, res.status === 404 ? "bad_model" : "other");
  throw new ProviderError(`The provider had a server error (${res.status}).`, "server");
}

/* ---------------- model lists (also the connection test) ---------------- */

export async function listModels(p: ProviderId, key: string): Promise<string[]> {
  if (p === "openai") {
    const b = await send("https://api.openai.com/v1/models", { headers: { authorization: `Bearer ${key}` } });
    return ((b.data as { id: string }[]) ?? []).map((m) => m.id).filter((id) => /^(gpt|o\d|chatgpt)/.test(id) && !/(audio|realtime|image|tts|transcribe|embedding|moderation|search|instruct)/.test(id)).sort();
  }
  if (p === "anthropic") {
    const b = await send("https://api.anthropic.com/v1/models?limit=100", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
    return ((b.data as { id: string }[]) ?? []).map((m) => m.id).sort();
  }
  const b = await send("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key } });
  return ((b.models as { name: string; supportedGenerationMethods?: string[] }[]) ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, "")).filter((n) => /gemini/.test(n)).sort();
}

/* ---------------- completions ---------------- */

export async function complete(p: ProviderId, key: string, cfg: CallCfg, system: string, msgs: Msg[], tools: ToolDef[]): Promise<Completion> {
  return p === "openai" ? openai(key, cfg, system, msgs, tools) : p === "anthropic" ? anthropic(key, cfg, system, msgs, tools) : gemini(key, cfg, system, msgs, tools);
}

const parseArgs = (s: unknown): Record<string, unknown> => { try { const v = typeof s === "string" ? JSON.parse(s || "{}") : s; return v && typeof v === "object" ? (v as Record<string, unknown>) : {}; } catch { return {}; } };

async function openai(key: string, cfg: CallCfg, system: string, msgs: Msg[], tools: ToolDef[]): Promise<Completion> {
  const messages: Json[] = [{ role: "system", content: system }];
  for (const m of msgs) {
    if (m.role === "user") messages.push({ role: "user", content: m.text });
    else if (m.role === "assistant") messages.push({ role: "assistant", content: m.text || null, ...(m.calls?.length ? { tool_calls: m.calls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: JSON.stringify(c.args) } })) } : {}) });
    else for (const r of m.results) messages.push({ role: "tool", tool_call_id: r.id, content: r.content });
  }
  const reasoning = /^(o\d|gpt-5)/.test(cfg.model);
  const b = await send("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: cfg.model, messages, max_completion_tokens: cfg.maxTokens, ...(reasoning ? {} : { temperature: cfg.temperature }), ...(tools.length ? { tools: tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } })), tool_choice: "auto" } : {}) }),
  }, cfg.timeoutMs);
  const msg = ((b.choices as Json[])?.[0]?.message ?? {}) as Json;
  const u = (b.usage ?? {}) as Json;
  return {
    text: typeof msg.content === "string" ? msg.content : "",
    calls: ((msg.tool_calls as Json[]) ?? []).map((c) => ({ id: String(c.id), name: String((c.function as Json)?.name), args: parseArgs((c.function as Json)?.arguments) })),
    tokensIn: Number(u.prompt_tokens ?? 0), tokensOut: Number(u.completion_tokens ?? 0),
  };
}

async function anthropic(key: string, cfg: CallCfg, system: string, msgs: Msg[], tools: ToolDef[]): Promise<Completion> {
  const messages: Json[] = [];
  for (const m of msgs) {
    if (m.role === "user") messages.push({ role: "user", content: m.text });
    else if (m.role === "assistant") {
      const content: Json[] = [];
      if (m.text) content.push({ type: "text", text: m.text });
      for (const c of m.calls ?? []) content.push({ type: "tool_use", id: c.id, name: c.name, input: c.args });
      messages.push({ role: "assistant", content });
    } else messages.push({ role: "user", content: m.results.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.content })) });
  }
  const b = await send("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: cfg.model, max_tokens: cfg.maxTokens, temperature: cfg.temperature, system, messages, ...(tools.length ? { tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })) } : {}) }),
  }, cfg.timeoutMs);
  const blocks = (b.content as Json[]) ?? [];
  const u = (b.usage ?? {}) as Json;
  return {
    text: blocks.filter((x) => x.type === "text").map((x) => String(x.text)).join(""),
    calls: blocks.filter((x) => x.type === "tool_use").map((x) => ({ id: String(x.id), name: String(x.name), args: parseArgs(x.input) })),
    tokensIn: Number(u.input_tokens ?? 0), tokensOut: Number(u.output_tokens ?? 0),
  };
}

async function gemini(key: string, cfg: CallCfg, system: string, msgs: Msg[], tools: ToolDef[]): Promise<Completion> {
  const contents: Json[] = [];
  for (const m of msgs) {
    if (m.role === "user") contents.push({ role: "user", parts: [{ text: m.text }] });
    else if (m.role === "assistant") {
      // Replay the model's own parts when we have them (newer Gemini models need their thought signatures back).
      const parts = Array.isArray(m.raw) && m.raw.length ? (m.raw as Json[]) : [...(m.text ? [{ text: m.text }] : []), ...(m.calls ?? []).map((c) => ({ functionCall: { name: c.name, args: c.args } }))];
      contents.push({ role: "model", parts });
    } else contents.push({ role: "user", parts: m.results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.content } } })) });
  }
  const b = await send(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: cfg.temperature, maxOutputTokens: cfg.maxTokens }, ...(tools.length ? { tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }] } : {}) }),
  }, cfg.timeoutMs);
  const parts = (((b.candidates as Json[])?.[0]?.content as Json)?.parts as Json[]) ?? [];
  const u = (b.usageMetadata ?? {}) as Json;
  return {
    text: parts.filter((x) => typeof x.text === "string" && !x.thought).map((x) => String(x.text)).join(""),
    calls: parts.filter((x) => x.functionCall).map((x, i) => ({ id: `g${i}`, name: String((x.functionCall as Json).name), args: parseArgs((x.functionCall as Json).args) })),
    tokensIn: Number(u.promptTokenCount ?? 0), tokensOut: Number(u.candidatesTokenCount ?? 0), raw: parts,
  };
}
