// Capacity validation (pure). The marketing numbers (leads, initial sends, follow-ups, domain/inbox RANGES) are separate fields and never
// reduced silently. This check compares them with what the team really sets up for ONE order and flags mismatches for an admin decision.
// Nothing here says the service is ready: only an admin approval (with real inbox numbers) clears the gate.
export type CapacityInput = {
  leads: number; initialSends: number; followups: number;
  /** what the team really provisioned/plans for this order (admin-entered) */
  inboxes: number; domains: number; perInboxDaily: number; sendingDays: number;
  /** estimates sold: ranges */
  inboxesMin: number; inboxesMax: number; domainsMin: number; domainsMax: number;
  /** messages the team actually plans to send in this cycle (0 = not decided) */
  plannedMessages: number;
};
export type CapacityResult = { ceiling: number; monthlyCapacity: number; monthsForCeiling: number; issues: string[]; ok: boolean };

export function checkCapacity(i: CapacityInput): CapacityResult {
  const ceiling = i.leads * (1 + i.followups);
  const monthlyCapacity = Math.max(0, i.inboxes) * Math.max(0, i.perInboxDaily) * Math.max(0, i.sendingDays);
  const monthsForCeiling = monthlyCapacity > 0 ? Math.ceil((ceiling / monthlyCapacity) * 10) / 10 : Infinity;
  const issues: string[] = [];
  if (i.initialSends > i.leads) issues.push("Initial sends are higher than the number of leads.");
  if (i.inboxes <= 0) issues.push("No inboxes are confirmed for this order yet.");
  else {
    if (i.inboxes < i.inboxesMin) issues.push(`Confirmed inboxes (${i.inboxes}) are below the sold range (${i.inboxesMin}–${i.inboxesMax}).`);
    if (i.inboxes > i.inboxesMax && i.inboxesMax > 0) issues.push(`Confirmed inboxes (${i.inboxes}) are above the sold range (${i.inboxesMin}–${i.inboxesMax}).`);
  }
  if (i.domains <= 0) issues.push("No domains are confirmed for this order yet.");
  else if (i.domains < i.domainsMin) issues.push(`Confirmed domains (${i.domains}) are below the sold range (${i.domainsMin}–${i.domainsMax}).`);
  if (monthlyCapacity > 0 && i.plannedMessages > monthlyCapacity) issues.push(`Planned messages (${i.plannedMessages.toLocaleString("en-US")}) exceed one month of confirmed sending capacity (${monthlyCapacity.toLocaleString("en-US")}).`);
  if (monthlyCapacity > 0 && ceiling > monthlyCapacity) issues.push(`The theoretical ceiling (${ceiling.toLocaleString("en-US")} messages) needs about ${monthsForCeiling} months at the confirmed capacity. Agree the schedule with the customer; do not shorten the allocation silently.`);
  return { ceiling, monthlyCapacity, monthsForCeiling, issues, ok: issues.length === 0 };
}
