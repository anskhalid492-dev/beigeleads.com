import { Database, Download, LifeBuoy, ListPlus, Rocket, Scale, ShieldCheck, Tag, Wallet, type LucideIcon } from "lucide-react";

const map: Record<string, LucideIcon> = { rocket: Rocket, database: Database, tag: Tag, wallet: Wallet, download: Download, shield: ShieldCheck, list: ListPlus, scale: Scale, "life-buoy": LifeBuoy };

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const I = map[name] ?? Rocket;
  return <I className={className} aria-hidden />;
}
