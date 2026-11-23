import { RESPONSE_MS, REMINDER_BEFORE_MS } from "./config";

export const deadlineFor = (submittedAt: number) => submittedAt + RESPONSE_MS;
export type DeadlineState = { state: "open" | "due-soon" | "overdue" | "responded" | "closed"; label: string };
const span = (ms: number) => { const m = Math.floor(Math.abs(ms) / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

export function deadlineState(i: { status: string; respondedAt: number | null; respondBy: number }, now: number): DeadlineState {
  if (i.respondedAt != null) return { state: "responded", label: "Responded" };
  if (i.status !== "new" && i.status !== "in_review") return { state: "closed", label: "No deadline" };
  const left = i.respondBy - now;
  if (left < 0) return { state: "overdue", label: `Overdue by ${span(left)}` };
  if (left <= REMINDER_BEFORE_MS) return { state: "due-soon", label: `Due in ${span(left)}` };
  return { state: "open", label: `Due in ${span(left)}` };
}
