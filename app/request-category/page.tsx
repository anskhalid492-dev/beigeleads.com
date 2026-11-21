import type { Metadata } from "next";
import { ApiForm } from "@/components/forms/api-form";
import { FormPage } from "@/components/shared/form-page";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = {
  title: "Request a category",
  robots: { index: false, follow: true },
};

export default function RequestCategoryPage() {
  return (
    <FormPage
      title="Request a category"
      intro="Do not see your niche or country? Tell us what you need and we will look into it."
      crumbs={[{ name: "Request a category", href: "/request-category" }]}
    >
      <ApiForm
        endpoint="/api/category-request"
        submitLabel="Send request"
        successTitle="Thanks, we got it"
        successText="We read every request and use them to decide which lists to build next."
        fields={[
          { name: "email", label: "Your email", type: "email", required: true },
          { name: "requestedCategory", label: "Category or niche", type: "text", required: true, placeholder: "For example: veterinarians in Canada" },
          { name: "details", label: "Anything else we should know", type: "textarea" },
        ]}
      />
    </FormPage>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
