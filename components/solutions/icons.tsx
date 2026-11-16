import { ChartColumn, Compass, Crosshair, HeartPulse, House, MailPlus, Presentation, ShoppingCart, Sparkles, Store, Target, UsersRound, type LucideIcon } from "lucide-react";
import type { Solution } from "@/lib/solutions";

const map: Record<Solution["icon"], LucideIcon> = {
  Target, MailPlus, Crosshair, Presentation, ChartColumn, Store, HeartPulse, House, UsersRound, ShoppingCart, Sparkles, Compass,
};

export function SolutionIcon({ name, className }: { name: Solution["icon"]; className?: string }) {
  const I = map[name];
  return <I className={className} aria-hidden />;
}
