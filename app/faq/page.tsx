import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { CtaBand } from "@/components/shared/cta-band";

export const metadata: Metadata = {
  title: "FAQ",
  alternates: { canonical: "/faq" },
  robots: { index: false, follow: true }, // remove with the site-wide noindex at launch
};

const items = [
  ["Is this a subscription?", "No. You pay once for a list and download the file. There is no monthly fee and no account to keep."],
  ["Can I see the data before I buy?", "Yes. Each list page shows a masked sample, and you can request a free sample by email."],
  ["How do I pay?", "In crypto. Bitcoin and USDT (TRC20) are planned for launch, with more coins later. You never need a bank card."],
  ["What file format do I get?", "A CSV file that opens in Excel, Google Sheets and most email tools. The list page shows the exact fields."],
  ["Do I need an account?", "No. You give an email address so we can send your download link."],
  ["Which countries and categories do you cover?", "Lists are added category by category and country by country. If yours is missing, request it and we will tell you if it is on the way."],
  ["Can people ask to be removed?", "Yes. Anyone can use the opt-out page. Removed addresses are left out of future files."],
  ["Who do I contact with a problem?", "Use the contact page and include your order details if you have them."],
] as const;

export default function FaqPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />
      <Faq heading="Frequently asked questions" items={items} />
      <CtaBand />
    </>
  );
}
