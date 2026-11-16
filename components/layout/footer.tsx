import Link from "next/link";

// Legal pages are placeholders until written and reviewed by a lawyer (CLAUDE.md section 10).
const cols = [
  {
    title: "Product",
    links: [
      ["All lists", "/lists"],
      ["Custom list", "/custom-list"],
      ["Pricing", "/pricing"],
      ["Request a sample", "/sample"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Data sources", "/data-sources"],
      ["Verification", "/verification"],
      ["Opt-out", "/opt-out"],
      ["FAQ", "/faq"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/legal/privacy"],
      ["Terms", "/legal/terms"],
      ["Refund & replacement", "/legal/refund-replacement"],
      ["Lawful use", "/legal/lawful-use"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-forest-900 text-sand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold text-sand-50">BeigeLeads</p>
          <p className="mt-3 text-sm text-sand-200">Pay once. Own the list.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-300">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-forest-700 py-5 text-center text-xs text-sand-300">
        &copy; {new Date().getFullYear()} BeigeLeads. All rights reserved.
      </div>
    </footer>
  );
}
