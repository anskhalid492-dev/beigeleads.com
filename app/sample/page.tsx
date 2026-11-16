import type { Metadata } from "next";
import { ApiForm } from "@/components/forms/api-form";
import { FormPage } from "@/components/shared/form-page";
import { getCategories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Request a free sample",
  robots: { index: false, follow: true },
};

export default async function SamplePage(props: PageProps<"/sample">) {
  const sp = await props.searchParams;
  const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const product = pick(sp.product);
  const category = pick(sp.category);

  return (
    <FormPage
      title="Request a free sample"
      intro="Tell us where to send it. A sample shows the real layout with emails masked. No payment details needed."
      crumbs={[{ name: "Request a sample", href: "/sample" }]}
    >
      <ApiForm
        endpoint="/api/sample"
        submitLabel="Request sample"
        successTitle="Request received"
        successText="Check your inbox for a confirmation. We will email you when a sample is ready."
        defaults={{ product, category }}
        fields={[
          { name: "email", label: "Your email", type: "email", required: true },
          {
            name: "product",
            label: "Which list",
            type: "select",
            options: getProducts().map((p) => ({ value: p.slug, label: p.title })),
          },
          {
            name: "category",
            label: "Or a category you need",
            type: "select",
            options: getCategories().map((c) => ({ value: c.slug, label: c.name })),
          },
        ]}
      />
    </FormPage>
  );
}
