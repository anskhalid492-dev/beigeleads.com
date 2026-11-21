// Email Verification order state machine (pure). Every status change goes through `canMove`; admin and customer actions each
// have their own allowed targets, so a job can never be "Completed" without the admin action that requires a result file.
export const STATUSES = ["awaiting_payment", "awaiting_file", "file_submitted", "in_queue", "processing", "needs_action", "completed", "delivered", "cancelled", "refunded"] as const;
export type EvStatus = (typeof STATUSES)[number];
export const LABEL: Record<EvStatus, string> = {
  awaiting_payment: "Awaiting Payment", awaiting_file: "Awaiting File", file_submitted: "File Submitted", in_queue: "In Queue", processing: "Processing",
  needs_action: "Needs Customer Action", completed: "Completed", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};
export const TONE: Record<EvStatus, "good" | "warn" | "bad" | "info" | "mute"> = {
  awaiting_payment: "mute", awaiting_file: "warn", file_submitted: "info", in_queue: "info", processing: "info", needs_action: "warn", completed: "good", delivered: "good", cancelled: "bad", refunded: "bad",
};
export const isStatus = (s: string): s is EvStatus => (STATUSES as readonly string[]).includes(s);

const NEXT: Record<EvStatus, EvStatus[]> = {
  awaiting_payment: ["awaiting_file", "cancelled"],
  awaiting_file: ["file_submitted", "cancelled", "refunded"],
  file_submitted: ["in_queue", "processing", "needs_action", "cancelled", "refunded"],
  in_queue: ["processing", "needs_action", "cancelled", "refunded"],
  processing: ["in_queue", "completed", "needs_action", "cancelled", "refunded"],
  needs_action: ["file_submitted", "cancelled", "refunded"],
  completed: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};
export const canMove = (from: EvStatus, to: EvStatus) => NEXT[from].includes(to);
/** What an admin can set by hand (payment, file submission and delivery are set by their own real events). */
export const ADMIN_TARGETS: EvStatus[] = ["in_queue", "processing", "needs_action", "completed", "cancelled", "refunded"];
export const adminOptions = (from: EvStatus) => ADMIN_TARGETS.filter((t) => canMove(from, t));
/** The customer can add or replace files only in these states. */
export const canUpload = (s: EvStatus) => s === "awaiting_file" || s === "file_submitted" || s === "needs_action";
export const terminal = (s: EvStatus) => s === "cancelled" || s === "refunded";
