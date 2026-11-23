import type { Content, TemplateDef } from "./types";

export type SubjectIdea = { style: "Professional and direct" | "Friendly and personalized" | "Concise and action-oriented"; subject: string };

/**
 * Three deterministic subject ideas built from the template's own event and the variables it really has.
 * No AI and no claim about open rates: these are just clear wordings to choose from.
 */
export function suggestSubjects(def: TemplateDef, _c: Content): SubjectIdea[] {
  void _c;
  const has = (k: string) => def.vars.includes(k);
  const ref = has("order_number") ? " #{{order_number}}" : has("request_reference") ? " {{request_reference}}" : "";
  const what = has("product_name") ? "{{product_name}}" : "your request";
  const name = has("first_name") ? "{{first_name}}, " : "";
  const topic: Record<string, [string, string, string]> = {
    product_delivery: [`Your BeigeLeads list is ready: ${what}`, `${name}your ${what} is ready to download`, `Download ${what}`],
    sample_request_received: ["We received your BeigeLeads sample request", `${name}we've received your sample request`, "Sample request received"],
    sample_delivery: [`Your BeigeLeads sample for ${what} is ready`, `${name}your sample is ready to review`, `View your ${what} sample`],
    custom_request_received: [`Your custom list request${ref} is under review`, `${name}we're reviewing your custom list request`, `Custom list request${ref} received`],
    creator_inquiry_received: ["We received your creator list inquiry — BeigeLeads", `We received your creator list inquiry${has("first_name") ? ", {{first_name}}" : ""}`, "Creator list inquiry received"],
    contact_received: ["We have received your message to BeigeLeads", `We've received your message${has("first_name") ? ", {{first_name}}" : ""}`, `Message received${ref}`],
    order_confirmation: [`Your BeigeLeads order${ref} is confirmed`, `${name}your BeigeLeads order${ref} is confirmed`, `Order${ref} confirmed`],
    payment_received: [`Payment confirmed for ${what}`, `Thanks${has("first_name") ? ", {{first_name}}" : ""}: your payment is confirmed`, `Payment confirmed`],
    payment_pending: [`Payment pending for BeigeLeads order${ref}`, `${name}we're waiting to confirm your payment`, `Payment pending${ref}`],
    payment_failed: [`We couldn't confirm payment for order${ref}`, `${name}let's sort out your payment for order${ref}`, `Payment not confirmed${ref}`],
    custom_quote: ["Your custom B2B data quote is ready", `${name}your custom quote is ready`, "Review your custom quote"],
    category_request_received: ["Your requested business category is under review", `${name}thanks for your category suggestion`, "Category request received"],
    delivery_issue: [`An update about your BeigeLeads order${ref}`, `${name}an update on your order${ref}`, `Order${ref}: delivery update`],
    partner_application_received: ["We've received your BeigeLeads partner application", `${name}we've received your partner application`, "Partner application received"],
    partner_application_approved: ["Your BeigeLeads partner application is approved", `${name}welcome to the BeigeLeads partner program`, "You're approved: your 50% code"],
    partner_application_declined: ["Update on your BeigeLeads partner application", `${name}an update on your partner application`, "Partner application update"],
    refund_update: [`Update on your BeigeLeads request${ref}`, `${name}here's the latest on your request${ref}`, `Request${ref}: status update`],
  };
  const t = topic[def.key];
  const [a, b, c] = t ?? [`[BeigeLeads] ${def.name}${ref}`, `[BeigeLeads] ${def.name}${ref}`, `[BeigeLeads] ${def.name}`];
  return [
    { style: "Professional and direct", subject: a },
    { style: "Friendly and personalized", subject: b.charAt(0).toUpperCase() === b.charAt(0) || b.startsWith("{{") ? b : b.charAt(0).toUpperCase() + b.slice(1) },
    { style: "Concise and action-oriented", subject: c },
  ];
}
