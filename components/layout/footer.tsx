import Link from "next/link";
import { Button } from "@/components/ui/button";
import { competitors, compareHref, compareTitle } from "@/lib/compare";

// Legal and trust pages are placeholders until written and lawyer-reviewed (CLAUDE.md section 10).
const columns: { title: string; links: readonly (readonly [label: string, href: string])[] }[] = [
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Request a category", "/request-category"],
      ["Opt out", "/opt-out"],
    ],
  },
  {
    title: "Lists",
    links: [
      ["All lists", "/lists"],
      ["Dentists", "/lists/dentists"],
      ["Restaurants", "/lists/restaurants"],
      ["Ski shops", "/lists/ski-shops"],
      ["Custom list", "/custom-list"],
      ["Bundles", "/bundles"],
      ["Creators", "/creators"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Pricing", "/pricing"],
      ["How it works", "/how-it-works"],
      ["Request a sample", "/sample"],
      ["Use cases", "/use-cases"],
      ["Case studies", "/case-studies"],
      ["Blog", "/blog"],
      ["FAQ", "/faq"],
    ],
  },
  {
    title: "Compare",
    links: competitors.map((c) => [compareTitle(c.name), compareHref(c.slug)] as const),
  },
  {
    title: "Trust",
    links: [
      ["Data sources", "/data-sources"],
      ["Verification", "/verification"],
      ["Lawful use", "/legal/lawful-use"],
      ["Crypto payments", "/legal/crypto-payments"],
      ["GDPR", "/legal/gdpr"],
      ["CCPA", "/legal/ccpa"],
      ["CAN-SPAM", "/legal/can-spam"],
      ["CASL", "/legal/casl"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/legal/privacy"],
      ["Terms", "/legal/terms"],
      ["Refund & replacement", "/legal/refund-replacement"],
      ["Delivery", "/legal/delivery"],
      ["Cookies", "/legal/cookies"],
      ["Data processing", "/legal/dpa"],
    ],
  },
];

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
      {/* Call to action */}
      <div className="border-b border-forest-700">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-4 py-20">
          <h2 className="display max-w-xl text-5xl text-sand-50 sm:text-6xl">See a sample before you spend a cent.</h2>
          <Button asChild size="lg">
            <Link href="/sample">Request a free sample</Link>
          </Button>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-12 px-4 py-16 md:grid-cols-3 lg:grid-cols-6">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-semibold text-forest-300">{col.title}</p>
            <ul className="mt-5 space-y-3 text-[0.95rem]">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-sand-50 hover:underline underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Brand row */}
      <div className="border-t border-forest-700">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-sand-300">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <rect width="24" height="24" rx="5" fill="#fbf8f1" />
              <rect x="5" y="6" width="14" height="2.5" rx="1.25" fill="#0f2a1d" />
              <rect x="5" y="10.75" width="14" height="2.5" rx="1.25" fill="#0f2a1d" />
              <rect x="5" y="15.5" width="8" height="2.5" rx="1.25" fill="#2d6a4f" />
            </svg>
            <span className="display text-xl text-sand-50">BeigeLeads</span>
            <span className="hidden sm:inline">Pay once. Own the list.</span>
          </div>
          <p>&copy; {new Date().getFullYear()} BeigeLeads. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
