import type { Metadata } from "next";
import { ApiForm } from "@/components/forms/api-form";
import { FormPage } from "@/components/shared/form-page";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: true },
};

export default function ContactPage() {
  return (
    <FormPage
      title="Contact"
      intro="Questions about a list, a payment or the data? Send a message."
      crumbs={[{ name: "Contact", href: "/contact" }]}
    >
      <ApiForm
        endpoint="/api/contact"
        submitLabel="Send message"
        successTitle="Message sent"
        successText="Thanks. We will reply by email."
        fields={[
          { name: "name", label: "Your name", type: "text", autoComplete: "name" },
          { name: "email", label: "Your email", type: "email", required: true },
          { name: "message", label: "Message", type: "textarea", required: true },
        ]}
      />
    </FormPage>
  );
}
