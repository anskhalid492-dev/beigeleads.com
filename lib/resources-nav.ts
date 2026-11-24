import { BookOpen, BookText, CircleDollarSign, FileCheck2, Gauge, GraduationCap, HelpCircle, Image as ImageIcon, Newspaper, Route, Sparkles, Users, Bot, type LucideIcon } from "lucide-react";

export type ResourceLink = { name: string; href: string; text: string; icon: LucideIcon };

/** Single source for the header Resources menu and the footer Resources column (same order). */
export const RESOURCE_GROUPS: { heading: string; links: ResourceLink[] }[] = [
  {
    heading: "Buy with confidence",
    links: [
      { name: "Pricing", href: "/pricing", text: "How one-time pricing works", icon: CircleDollarSign },
      { name: "How It Works", href: "/how-it-works", text: "From search to delivery", icon: Route },
      { name: "Request a Sample", href: "/sample", text: "See a masked sample first", icon: Sparkles },
      { name: "Email List Verification", href: "/email-list-verification", text: "Verify a list you already own", icon: FileCheck2 },
      { name: "Team Purchase Requests", href: "/team-purchase-requests", text: "Ask a manager to approve", icon: Users },
    ],
  },
  {
    heading: "Learn",
    links: [
      { name: "Blog", href: "/blog", text: "Articles on B2B data and outreach", icon: Newspaper },
      { name: "Guides", href: "/guides", text: "Step-by-step playbooks", icon: BookOpen },
      { name: "Glossary", href: "/glossary", text: "Plain-English data terms", icon: BookText },
      { name: "Case Studies", href: "/case-studies", text: "Illustrative use cases", icon: GraduationCap },
      { name: "Benchmarks", href: "/benchmarks", text: "Sourced industry numbers", icon: Gauge },
    ],
  },
  {
    heading: "Help and tools",
    links: [
      { name: "Help Center", href: "/help-center", text: "Answers and how-tos", icon: HelpCircle },
      { name: "AI Assistant", href: "/ai-assistant", text: "Meet Pilo", icon: Bot },
      { name: "Media Kit", href: "/media-kit", text: "Logos, colours, fonts", icon: ImageIcon },
    ],
  },
];

export const RESOURCE_LINKS = RESOURCE_GROUPS.flatMap((g) => g.links);
