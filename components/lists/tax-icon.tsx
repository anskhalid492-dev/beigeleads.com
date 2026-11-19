import { Briefcase, Building2, Globe2, Mail, MessageCircle, Phone, Users, type LucideProps } from "lucide-react";
import type { TaxIcon } from "@/lib/taxonomy";

const MAP = { mail: Mail, phone: Phone, message: MessageCircle, briefcase: Briefcase, users: Users, building: Building2, globe: Globe2 } as const;
export function TaxIconSvg({ name, ...p }: { name: TaxIcon } & LucideProps) {
  const I = MAP[name];
  return <I aria-hidden {...p} />;
}
