import { BrandLogo } from "@/components/shared/brand-logo";
import Link from "next/link";
import { FooterCta } from "./footer-cta";
import { competitors, compareHref } from "@/lib/compare";

import { solutions } from "@/lib/solutions";

type Link_ = readonly [label: string, href: string];
type Column = { title: string; links?: readonly Link_[]; groups?: readonly { heading: string; links: readonly Link_[] }[] };

// Exactly six columns, in this order. Legal merges the former Trust and Legal columns.
// Legal pages are drafts until written and lawyer-reviewed (CLAUDE.md section 10).
const compareLabel = (name: string) => (name === "subscription tools" ? "Subscription Tools" : name);

const columns: Column[] = [
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Data Reseller Partners", "/partners"],
      ["Request a Category", "/request-category"],
      ["Opt Out", "/opt-out"],
    ],
  },
  {
    title: "Lists",
    links: [
      ["All Lists", "/lists"],
      ["Dentists", "/lists/dentists"],
      ["Restaurants", "/lists/restaurants"],
      ["Ski Shops", "/lists/ski-shops"],
      ["Custom Lists", "/custom-list"],
      ["Bundles", "/bundles"],
      ["Creators", "/creators"],
    ],
  },
  {
    title: "Solutions",
    links: [...solutions.slice(0, 6).map((x) => [x.navName, `/solutions/${x.slug}`] as const), ["All Solutions", "/solutions"]],
  },
  {
    title: "Compare",
    links: [...competitors.slice(0, 5).map((c) => [`BeigeLeads vs ${compareLabel(c.name)}`, compareHref(c.slug)] as const), ["All Comparisons", "/compare"]],
  },
  {
    title: "Resources",
    links: [
      ["Pricing", "/pricing"],
      ["How It Works", "/how-it-works"],
      ["Request a Sample", "/sample"],
      ["Team Purchase Requests", "/team-purchase-requests"],
      ["AI Assistant", "/ai-assistant"],
      ["Case Studies", "/case-studies"],
      ["Blog", "/blog"],
      ["Guides", "/guides"],
      ["Glossary", "/glossary"],
      ["Media Kit", "/media-kit"],
      ["Help Center", "/help-center"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Data Sources", "/data-sources"],
      ["Data Verification", "/verification"],
      ["Lawful Use", "/legal/lawful-use"],
      ["GDPR", "/legal/gdpr"],
      ["CCPA", "/legal/ccpa"],
      ["CAN-SPAM", "/legal/can-spam"],
      ["CASL", "/legal/casl"],
      ["Privacy Policy", "/legal/privacy"],
      ["Terms & Conditions", "/legal/terms"],
      ["Refund & Returns", "/legal/refund-replacement"],
      ["Delivery Policy", "/legal/delivery"],
      ["Cookie Policy", "/legal/cookies"],
      ["Data Processing Policy", "/legal/dpa"],
    ],
  },
];

const linkCls = "hover:text-sand-50 hover:underline underline-offset-4";

export function Footer() {
  return (
    <footer
      className="text-sand-100"
      style={{
        backgroundColor: "var(--color-forest-900)",
        backgroundImage:
          "radial-gradient(60rem 28rem at 0% 100%, rgba(45,106,79,0.45), transparent 70%), radial-gradient(40rem 20rem at 100% 0%, rgba(45,106,79,0.18), transparent 70%)",
      }}
    >
      <FooterCta />

      {/* Link columns */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-12 px-4 py-16 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-8">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-semibold text-forest-300">{col.title}</p>
            {col.links && (
              <ul className="mt-5 space-y-3 text-[0.95rem]">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className={linkCls}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {col.groups?.map((g) => (
              <div key={g.heading} className="mt-5 first:mt-5">
                <p className="text-xs font-semibold text-sand-300">{g.heading}</p>
                <ul className="mt-2.5 space-y-3 text-[0.95rem]">
                  {g.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className={linkCls}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ))}
      </div>

      {/* Brand row */}
      <div className="border-t border-forest-700">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-sand-300 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo variant="dark" className="h-8 w-auto" />
            <span className="hidden sm:inline">Pay once. Own the list.</span>
          </div>
          <p>&copy; {new Date().getFullYear()} BeigeLeads. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
