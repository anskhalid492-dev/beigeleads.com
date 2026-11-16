import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://beigeleads.com"),
  // TEMPORARY: keep placeholder content out of search engines until real data ships.
  // Remove this line (and app/robots.ts disallow) at launch. See TODO-BEFORE-LAUNCH.md.
  robots: { index: false, follow: false },
  title: { default: "BeigeLeads: pay once, own the list", template: "%s | BeigeLeads" },
  description:
    "Verified business contact lists by category, country and city. One-time purchase, no subscription.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
