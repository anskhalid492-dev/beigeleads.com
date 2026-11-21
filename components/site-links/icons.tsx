import { Globe, MessageCircle, Sparkles, Link2 } from "lucide-react";
import { BRAND_PATHS } from "@/lib/site-links/brand-paths";

/** Brand glyph from Simple Icons data; a plain generic icon where no glyph is bundled (Grok, custom links). Never an empty tile. */
export function Glyph({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const d = BRAND_PATHS[name];
  if (d) return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false"><path d={d} /></svg>;
  if (name === "grok") return <Sparkles className={className} aria-hidden />;
  if (name === "chatgpt") return <MessageCircle className={className} aria-hidden />;
  if (name === "custom") return <Link2 className={className} aria-hidden />;
  return <Globe className={className} aria-hidden />;
}

export const AI_TILE: Record<string, string> = {
  chatgpt: "#10a37f", perplexity: "#1f7a8c", grok: "#111827", gemini: "#4b6fe0", claude: "#c96442", custom: "#2d6a4f",
};

const GOOGLE_G = [
  ["#4285F4", "M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"],
  ["#34A853", "M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"],
  ["#FBBC05", "M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.62H1.27a12 12 0 0 0 0 10.76l4-3.09z"],
  ["#EA4335", "M12 4.75c1.76 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"],
] as const;

/** Full-colour mark for the footer pills (brand colours as published by each platform). Falls back to the plain glyph. */
export function ColorGlyph({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  if (name === "gemini") return <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">{GOOGLE_G.map(([c, d]) => <path key={c} fill={c} d={d} />)}</svg>;
  if (name === "grok") return <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden focusable="false"><path d="M20.5 8.2A9 9 0 1 0 21 13" stroke="#111" strokeWidth="2.6" strokeLinecap="round" /></svg>;
  if (name === "claude") return <span className="text-[#c96442]"><Glyph name={name} className={className} /></span>;
  if (name === "perplexity") return <span className="text-[#1b3a4b]"><Glyph name={name} className={className} /></span>;
  if (name === "chatgpt") return <span className="text-[#111]"><Glyph name={name} className={className} /></span>;
  return <Glyph name={name} className={className} />;
}
