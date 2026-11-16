import type { Metadata } from "next";
import Link from "next/link";
import { ApiForm } from "@/components/forms/api-form";
import { FormPage } from "@/components/shared/form-page";

export const metadata: Metadata = {
  title: "Opt out",
  robots: { index: false, follow: true },
};

export default function OptOutPage() {
  return (
    <FormPage
      title="Opt out"
      intro="Enter your email address and we will leave it out of every future file. We store a one-way hash of the address, not the address itself."
      crumbs={[{ name: "Opt out", href: "/opt-out" }]}
    >
      <ApiForm
        endpoint="/api/opt-out"
        submitLabel="Remove my email"
        successTitle="Request recorded"
        successText="This address will be left out of future files. Files already delivered to buyers cannot be recalled, but you will not appear in new ones."
        fields={[{ name: "email", label: "Email address to remove", type: "email", required: true }]}
      />
      <p className="mt-6 text-sm">
        Want a whole company domain removed? Use the{" "}
        <Link href="/contact" className="font-semibold underline underline-offset-4">
          contact form
        </Link>{" "}
        and we will confirm it with you first.
      </p>
    </FormPage>
  );
}
