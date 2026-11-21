// DFY order stages (pure). Payment, onboarding submission and cancellation by the customer are set by their own real events.
// Ready to Launch / Campaign Active are gated in store.ts (capacity approved, infrastructure verified, copy approved).
export const STAGES = ["awaiting_payment", "awaiting_onboarding", "onboarding_submitted", "infrastructure_planning", "domain_purchasing", "inbox_configuration", "inbox_ramp_up", "lead_sourcing", "lead_verification", "copywriting", "awaiting_client_approval", "ready_to_launch", "campaign_active", "testing_optimization", "reporting", "renewal_pending", "paused", "cancelled", "completed"] as const;
export type Stage = (typeof STAGES)[number];
export const LABEL: Record<Stage, string> = {
  awaiting_payment: "Awaiting Payment", awaiting_onboarding: "Awaiting Onboarding", onboarding_submitted: "Onboarding Submitted", infrastructure_planning: "Infrastructure Planning",
  domain_purchasing: "Domain Purchasing", inbox_configuration: "Inbox Configuration", inbox_ramp_up: "Inbox Ramp-Up", lead_sourcing: "Lead Sourcing", lead_verification: "Lead Verification",
  copywriting: "Copywriting", awaiting_client_approval: "Awaiting Client Approval", ready_to_launch: "Ready to Launch", campaign_active: "Campaign Active",
  testing_optimization: "Testing & Optimization", reporting: "Reporting", renewal_pending: "Renewal Pending", paused: "Paused", cancelled: "Cancelled", completed: "Completed",
};
export const isStage = (s: string): s is Stage => (STAGES as readonly string[]).includes(s);
export const terminal = (s: Stage) => s === "cancelled" || s === "completed";
/** Stages an admin may set by hand. Payment and the customer's onboarding submission are real events, not buttons. */
export const ADMIN_STAGES: Stage[] = STAGES.filter((s) => s !== "awaiting_payment" && s !== "awaiting_onboarding" && s !== "onboarding_submitted" && s !== "paused");
export const LAUNCH_STAGES: Stage[] = ["ready_to_launch", "campaign_active", "testing_optimization", "reporting"];
export const live = (s: Stage) => ["campaign_active", "testing_optimization", "reporting", "renewal_pending"].includes(s);

export function canMove(from: Stage, to: Stage): boolean {
  if (from === to || terminal(from)) return false;
  if (from === "awaiting_payment") return to === "awaiting_onboarding" || to === "cancelled";
  if (to === "awaiting_payment") return false;
  if (from === "paused") return to === "cancelled";                       // resume uses its own action
  if (from === "awaiting_onboarding") return to === "onboarding_submitted" || to === "cancelled" || to === "paused";
  if (to === "awaiting_onboarding") return false;
  if (to === "onboarding_submitted") return false;
  return true;                                                           // admin may move forward or back for rework
}
