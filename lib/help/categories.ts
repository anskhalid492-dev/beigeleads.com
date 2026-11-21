import type { HelpCategory } from "./types";

export const helpCategories: readonly HelpCategory[] = [
  { slug: "getting-started", name: "Getting started", icon: "rocket", description: "What BeigeLeads is, how it works and how to find your list." },
  { slug: "products", name: "Products & business data", icon: "database", description: "What is in a list, record counts, packages and coverage." },
  { slug: "pricing", name: "Pricing & purchasing", icon: "tag", description: "One-time pricing, packages and what happens after you pay." },
  { slug: "payments", name: "Payments & billing", icon: "wallet", description: "Crypto payments, confirmations, refunds and replacements." },
  { slug: "delivery", name: "Downloads & delivery", icon: "download", description: "How your list reaches you, and what to do if it does not." },
  { slug: "data-quality", name: "Data quality & verification", icon: "shield", description: "How data is verified, kept fresh and how samples work." },
  { slug: "custom-list", name: "Custom list builder", icon: "list", description: "Ask for a list that is not in the catalog." },
  { slug: "privacy-compliance", name: "Privacy, compliance & policies", icon: "scale", description: "Responsible use, opt-outs, sources and legal pages." },
  { slug: "b2b-databases", name: "B2B databases", icon: "database", description: "What a database holds, how it is organised, verified and refreshed." },
  { slug: "orders-checkout", name: "Orders & checkout", icon: "wallet", description: "Checkout, crypto payment, order confirmation, files and discounts." },
  { slug: "email-verification", name: "Email list verification", icon: "mail", description: "Submit a list, read the results and download them." },
  { slug: "dfy-outbound", name: "DFY Outbound", icon: "rocket", description: "The managed cold email service: packages, setup, copy and reports." },
  { slug: "account-support", name: "Account, privacy & support", icon: "scale", description: "Downloads, your information, terms, refunds and help with an order." },
  { slug: "pilo-website", name: "Pilo & website features", icon: "bot", description: "The Pilo assistant, its discount rules and the AI discovery links." },
  { slug: "troubleshooting", name: "Troubleshooting & support", icon: "life-buoy", description: "Fixes for common problems and how to reach us." },
];
