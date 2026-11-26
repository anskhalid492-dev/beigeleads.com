// Founder-led Customer Success: fixed identity facts (CLAUDE.md section 173). Nothing here is editable from the admin
// except WHICH of the authorised senders a template uses.
import type { CommClass, PrefKey, SenderId } from "@/lib/system-emails/types";

export const FOUNDER_NAME = "Anus";
export const FOUNDER_TITLE = "Founder, BeigeLeads";
/** Display name on every founder email. */
export const SENDER_DISPLAY = "Anus — Founder, BeigeLeads";
export const REPLY_TO = "hello@beigeleads.com";
export const CATEGORY = "Founder-Led Customer Success";
export const SITE = "https://beigeleads.com";

/** The three authorised sender addresses. They are ONE identity (the founder), never presented as different people. */
export const SENDERS: Record<SenderId, { email: string; use: string }> = {
  A: { email: "anus@beigeleads.com", use: "Welcome, relationship building, education, long-term check-ins" },
  B: { email: "mranus@beigeleads.com", use: "Feedback, customer experience and support follow-ups" },
  C: { email: "anas@beigeleads.com", use: "Product recommendations, valid offers, catalog discoveries" },
};
export const SENDER_IDS = Object.keys(SENDERS) as SenderId[];
export const fromHeader = (id: SenderId) => `${SENDER_DISPLAY} <${SENDERS[id].email}>`;
export const senderDomain = (id: SenderId) => SENDERS[id].email.split("@")[1]!;

export const CLASS_LABEL: Record<CommClass, string> = {
  service: "Service (about their order)",
  support: "Support (answers their request)",
  lifecycle: "Optional lifecycle",
  promotional: "Optional promotional",
};
/** Only service and support emails ignore an unsubscribe. Everything else is optional and stops. */
export const isOptional = (k: CommClass) => k === "lifecycle" || k === "promotional";

export const PREF_LABEL: Record<PrefKey, string> = {
  recs: "Relevant database recommendations",
  products: "New product announcements",
  founder: "Founder updates and personal check-ins",
  education: "Educational resources",
  offers: "Returning customer offers",
};
export const PREF_KEYS = Object.keys(PREF_LABEL) as PrefKey[];

/** Services we sell as services: their orders never start a database journey. */
export const SERVICE_SLUGS = ["email-verification", "dfy-outbound", "dfy-ownership"] as const;
/** Payment networks that mean real money (test-network orders never enrol a customer). */
export const REAL_NETWORKS = ["mainnet", "TRC20", "ERC20", "ethereum"] as const;
