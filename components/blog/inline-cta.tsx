import Link from "next/link";
import { Button } from "@/components/ui/button";

export type Cta = { title: string; text: string; label: string; href: string };

/** One quiet call to action under the article, chosen from the article's own category, tags and title. No invented numbers. */
export function ctaFor(a: { title: string; category: { name: string; slug: string } | null; tags: { name: string }[] }): Cta {
  const hay = `${a.title} ${a.category?.name ?? ""} ${a.tags.map((t) => t.name).join(" ")}`.toLowerCase();
  if (/custom|target|icp|segment|audience|build/.test(hay)) return { title: "Build a custom business contact list", text: "Tell us the industry, location and roles you need and we will review your request.", label: "Build a custom list", href: "/custom-list" };
  if (/data|source|verif|quality|research|database/.test(hay)) return { title: "Explore ready-made business contact lists", text: "Browse lists by industry and location, and request a free masked sample first.", label: "Browse lists", href: "/lists" };
  return { title: "Find business contacts for your next campaign", text: "Pick a ready-made list, or ask for a free masked sample before you decide.", label: "Browse lists", href: "/lists" };
}

export function InlineCta({ cta }: { cta: Cta }) {
  return (
    <aside aria-label="Related offer" className="mt-10 flex flex-col gap-4 rounded-2xl border border-sand-200 bg-sand-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-bold text-forest-900">{cta.title}</p><p className="mt-1 text-sm">{cta.text}</p></div>
      <Button asChild className="shrink-0"><Link href={cta.href}>{cta.label}</Link></Button>
    </aside>
  );
}
