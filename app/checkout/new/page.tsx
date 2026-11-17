import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ApiForm } from "@/components/forms/api-form";
import { FormPage } from "@/components/shared/form-page";
import { formatUsd, getProduct } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewCheckout(props: PageProps<"/checkout/new">) {
  const sp = await props.searchParams;
  const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const product = getProduct(pick(sp.product));
  const pkg = product?.packages.find((p) => p.name === pick(sp.package));
  const open = getCloudflareContext().env.CHECKOUT_ENABLED === "true";

  if (!open || !product || !pkg) {
    return (
      <FormPage title="Checkout opens soon" intro="We are finishing and testing payments. Request a free sample in the meantime." crumbs={[{ name: "Checkout", href: "/checkout/new" }]}>
        <p>{!product || !pkg ? "Pick a package on a list page to start an order." : "Checkout is not open yet."}</p>
      </FormPage>
    );
  }
  return (
    <FormPage
      title={`Buy ${product.name}`}
      intro={`${pkg.name} package: ${pkg.records.toLocaleString("en-US")} records for ${formatUsd(pkg.priceUsdCents)}. One payment in Bitcoin, no account. We email your download link to the address below.`}
      crumbs={[{ name: product.name, href: `/product/${product.slug}` }, { name: "Checkout", href: "/checkout/new" }]}
    >
      <ApiForm
        endpoint="/api/checkout"
        submitLabel="Continue to payment"
        successTitle="Creating your order"
        successText="Taking you to the payment page."
        hidden={{ product: product.slug, package: pkg.name, coin: "BTC" }}
        fields={[{ name: "email", label: "Email for your download link", type: "email", required: true }]}
      />
    </FormPage>
  );
}
