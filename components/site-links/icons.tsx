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
