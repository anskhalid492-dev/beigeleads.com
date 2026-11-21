import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/pricing-page";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = {
  title: "One-Time Business Email List Pricing",
  description: "Buy business email lists and B2B contact databases with a one-time payment. No subscriptions, no credits. Preview a masked sample, pick a package, pay once.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "One-Time Business Email List Pricing", description: "Pay once, own the list. No subscriptions, no credits.", url: "/pricing", type: "website" },
};

export default PricingPage;

export const metadata: Metadata = fitMeta(metadataRaw);
