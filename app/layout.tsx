import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { PopupHost } from "@/components/popups/host";
import { BeigePilot } from "@/components/beigepilot/widget";
import { PublicChrome } from "@/components/layout/public-chrome";
import { JsonLd } from "@/components/shared/json-ld";
import { getCategories, getCountries } from "@/lib/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://beigeleads.com"),
  // TEMPORARY: keep placeholder content out of search engines until real data ships.
  // Remove this line (and app/robots.ts disallow) at launch. See TODO-BEFORE-LAUNCH.md.
  robots: { index: false, follow: false },
  title: { default: "BeigeLeads: pay once, own the list", template: "%s | BeigeLeads" },
  description:
    "Verified business contact lists by category, country and city. One-time purchase, no subscription.",
  openGraph: { siteName: "BeigeLeads", type: "website", images: [{ url: "/brand/social/beigeleads-og-1200x630.png", width: 1200, height: 630, alt: "BeigeLeads: Pay once. Own the list." }] },
  twitter: { card: "summary_large_image", images: ["/brand/social/beigeleads-og-1200x630.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <PublicChrome><AnnouncementBanner /><Header lists={{ industries: getCategories().map((c) => ({ slug: c.slug, name: c.name })), countries: getCountries().map((k) => ({ slug: k.slug, name: k.name })) }} /></PublicChrome>
        <main className="flex-1">{children}</main>
        <PublicChrome><Footer /></PublicChrome>
        <PopupHost />
        <BeigePilot />
        <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/brand/png/beigeleads-symbol-light.png` }} />
      </body>
    </html>
  );
}
