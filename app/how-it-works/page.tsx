import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Hero } from "@/components/how-it-works/hero";
import { StepNav } from "@/components/how-it-works/step-nav";
import { MiniSearch } from "@/components/how-it-works/mini-search";
import { DataExplorer, type ExplorerSheet } from "@/components/how-it-works/data-explorer";
import { PackageDemo } from "@/components/how-it-works/package-demo";
import { CheckoutIllustration, DeliveryEmail, Step } from "@/components/how-it-works/journey";
import { Benefits, FinalCta, Head, HowFaq, PurchaseModels, ReadyVsCustom, TrustSection, VerificationPipeline } from "@/components/how-it-works/sections";
import { getCategories, getCountry, getProducts } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";
import { SITE_URL } from "@/lib/site";

const DESC = "How to buy a B2B business contact list with BeigeLeads: find a list, preview a masked sample, choose a package, pay once, and receive your CSV, Excel or TXT file by email.";

export const metadata: Metadata = {
  title: "How BeigeLeads works: buy business contact lists once | BeigeLeads",
  description: DESC,
  alternates: { canonical: "/how-it-works" },
  robots: { index: false, follow: true }, // site-wide noindex until launch (TODO-BEFORE-LAUNCH.md)
};

export default function HowItWorksPage() {
  const cats = getCategories();
  const products = getProducts();
  const first = products[0];

  // Example searches come from the real catalog.
  const examples = [...cats.map((c) => `${c.name} in the US`), "Restaurants in Chicago"].slice(0, 4);

  const sheets: ExplorerSheet[] = cats
    .map((c): ExplorerSheet | null => {
      const p = products.find((x) => x.categorySlug === c.slug);
      const rows = productSamples[c.slug];
      if (!p || !rows) return null;
      return { slug: c.slug, label: c.name, productSlug: p.slug, country: getCountry(p.countrySlug)?.name ?? "", rows: rows.slice(0, 5) };
    })
    .filter((s): s is ExplorerSheet => !!s);

  const steps = [
    ["Find", "Search by industry, country or city", "/#find-leads"],
    ["Preview", "Inspect a masked sample", "/sample"],
    ["Choose a package", "Pick the size and fields", "/lists"],
    ["Pay securely", "One payment at checkout", "/lists"],
    ["Receive your list", "A download link by email", "/help/delivery/how-you-receive-your-list"],
  ] as const;

  return (
    <>
      <Breadcrumbs items={[{ name: "How it works", href: "/how-it-works" }]} wide />
      <Hero />

      <section className="bg-sand-100 py-16 lg:py-20" aria-labelledby="journey-h">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div id="journey-h"><Head title="Five steps from search to your file" text="Here is exactly what happens at each stage." /></div>
          <div className="mt-8"><StepNav /></div>

          <Step id="step-find" n="1" title="Find the businesses you actually want to reach." text="Discover lists by industry, country, city or business category. Search in plain words and we match them against the real catalog." bullets={["Type an industry and a place, like “dentists in the US”.", "See the matching lists, or a close alternative with a clear note.", "No match? Send us a custom list request instead."]} cta={{ href: "/lists", label: "Explore Available Lists" }}>
            <MiniSearch examples={examples} />
          </Step>

          <Step id="step-preview" n="2" title="Know what’s inside before you buy." text="Open a list to inspect masked sample records and the fields it includes. Contact details are hidden in every sample, so nothing private is given away." bullets={["Business name, address, city, country, phone, email and website.", "Emails, phones and street addresses are masked.", "Want more? Request a free masked sample and our team emails it to you."]} cta={{ href: "/sample", label: "Request a Free Sample" }} flip>
            <DataExplorer sheets={sheets.slice(0, 1)} />
          </Step>

          <Step id="step-package" n="3" title="The right amount of data. One straightforward price." text="Every list comes in packages: Starter, Pro and Complete. Pricing varies by product and package, and you see it on the product page before you pay." bullets={["Compare package sizes side by side.", "Every package lists the fields it includes.", "No account, no add-ons, no recurring charge."]} cta={{ href: "/lists", label: "Browse List Packages" }}>
            {first && <PackageDemo packages={first.packages} fields={first.fields} showNumbers={!first.placeholderData} productTitle={first.title} />}
          </Step>

          <Step id="step-pay" n="4" title="One payment. No recurring commitment." text="Checkout is in cryptocurrency. You see an exact amount, the network and the address, and we confirm your order as soon as the blockchain confirms the payment." bullets={["Pay once for the package you chose.", "Checkout shows the coins that are currently open.", "Real orders start at checkout from a product page."]} cta={{ href: "/help/payments/how-payment-confirmation-works", label: "How payment confirmation works" }} flip>
            <CheckoutIllustration />
          </Step>

          <Step id="step-receive" n="5" title="Your business contacts, delivered to your inbox." text="After your payment is confirmed, we process the order and email you a download link. The file is opened through a secure HTTPS link we set up for your list." bullets={["Formats: CSV, Excel or TXT.", "Downloads are unlimited under the current delivery policy.", "Delivery is usually instant, and can take up to 12 hours at most."]} cta={{ href: "/help/delivery/how-you-receive-your-list", label: "How delivery works" }}>
            <DeliveryEmail listTitle={first?.title ?? "Your list"} />
          </Step>
        </div>
      </section>

      <ReadyVsCustom />

      <section className="py-16 lg:py-24" aria-labelledby="data-h">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div id="data-h"><Head title="Here’s what your business contact data looks like." text="A spreadsheet-style view of the columns you receive. Switch lists and click a heading to follow one column down." /></div>
          <div className="mt-10"><DataExplorer sheets={sheets} /></div>
        </div>
      </section>

      <VerificationPipeline />
      <Benefits />
      <PurchaseModels />
      <TrustSection />
      <HowFaq />
      <FinalCta />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "HowTo", name: "How to buy a business contact list with BeigeLeads", description: DESC,
        step: steps.map(([name, text], i) => ({ "@type": "HowToStep", position: i + 1, name, text })),
      }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "How BeigeLeads works", description: DESC, url: `${SITE_URL}/how-it-works`, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
    </>
  );
}
