"use client";
import { ApiForm } from "@/components/forms/api-form";

export function QuoteForm() {
  return (
    <ApiForm
      endpoint="/api/ev/quote"
      submitLabel="Send Quote Request"
      successTitle="Quote request received"
      successText="Thanks. Our team will review it and reply by email."
      fields={[
        { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
        { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
        { name: "estimatedCount", label: "Estimated number of emails", type: "text", required: true, placeholder: "For example 2,500,000" },
        { name: "requirements", label: "Requirements (optional)", type: "textarea", placeholder: "File format, timing, anything we should know" },
      ]}
    />
  );
}
