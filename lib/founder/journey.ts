// Pure journey rules (CLAUDE.md section 173): which email is due for one customer, and what the frequency limits allow.
// No network, no D1: everything it needs is in `Facts`, so it is fully unit-tested.
import type { FounderMeta } from "@/lib/system-emails/types";
import type { CsSettings } from "./settings";

const H = 3600;
export type Sent = { key: string; at: number; reference: string; status: "sent" | "scheduled" | "failed" | "skipped" | "cancelled" | "dry_run"; reactivation?: boolean };
export type Facts = {
  now: number;
  customer: { status: "active" | "paused" | "cancelled"; enrolledAt: number };
  firstPaidAt: number | null;
  firstFulfilledAt: number | null;
  paidAts: number[];           // every real-money, non-service paid order, ascending
  lastPaidAt: number | null;
  history: Sent[];
  unsubscribedAll: boolean;
  prefs: Record<"recs" | "products" | "founder" | "education" | "offers", boolean>;
  frequency: "normal" | "less";
  supportOpen: boolean;
  unhappy: boolean;            // low feedback score not yet resolved
  feedbackGiven: boolean;
  shared: { business: boolean; audience: boolean; goals: boolean };
  hasResource: boolean;
  segmentation: boolean;       // purchased a list that has industry/location fields
  /** Event candidates the data layer found (reward code, new article, feedback, resolved case...). Reference = the unique thing. */
  events: Record<string, { reference: string; dueAt: number }[]>;
};
export type Cand = { key: string; reference: string; dueAt: number; priority: number };
export type Skip = { key: string; reference: string; reason: string };

export const isOptionalClass = (k: FounderMeta["klass"]) => k === "lifecycle" || k === "promotional";

/** Base eligibility for one template and one customer, ignoring frequency. Returns a skip reason or null. */
export function skipReason(key: string, f: FounderMeta, x: Facts, _s: CsSettings): string | null {
  if (x.customer.status !== "active") return `customer ${x.customer.status}`;
  if (isOptionalClass(f.klass)) {
    if (x.unsubscribedAll) return "unsubscribed";
    if (f.pref && !x.prefs[f.pref]) return `preference off (${f.pref})`;
    if (x.supportOpen) return "support request open";
    if (x.unhappy && f.klass === "promotional") return "unhappy feedback: promotional paused";
  }
  const n = f.id.replace("CS-", "");
  const done = (k: string) => x.history.some((h) => h.key.startsWith(`cs${k}_`) && (h.status === "sent" || h.status === "scheduled"));
  if (n === "04" && (x.feedbackGiven || done("25"))) return "feedback already handled";
  if (n === "10" && x.feedbackGiven) return "feedback already given";
  if (n === "25" && (x.feedbackGiven || recent(x, "10", 21 * 24 * H))) return "feedback already given or day-30 email too recent";
  if (n === "07" && x.shared.business) return "business already shared";
  if (n === "08" && x.shared.audience) return "audience already shared";
  if (n === "11" && (x.shared.goals || recentOrder(x, 30 * 24 * H))) return "goals shared or ordered recently";
  if (n === "12" && recentOrder(x, 30 * 24 * H)) return "ordered in the last 30 days";
  if (["13", "14"].includes(n) && !x.hasResource) return "no published resource";
  if (n === "15" && !x.segmentation) return "no segmentation fields in purchase";
  return null;
}
const recent = (x: Facts, n: string, secs: number) => x.history.some((h) => h.key.startsWith(`cs${n}_`) && h.status === "sent" && x.now - h.at < secs);
const recentOrder = (x: Facts, secs: number) => x.lastPaidAt != null && x.now - x.lastPaidAt < secs;

/** Every email that is due now (anchor + delay reached, not expired, not already planned) with a skip list that says why not. */
export function plan(templates: { key: string; f: FounderMeta }[], x: Facts, s: CsSettings): { due: Cand[]; skipped: Skip[] } {
  const due: Cand[] = []; const skipped: Skip[] = [];
  for (const { key, f } of templates) {
    if (!s.enabled[key]) continue;
    if (f.anchor === "manual") continue;
    const delay = (s.delays[key] ?? f.delayHours) * H;
    const list: { reference: string; dueAt: number }[] = [];
    if (f.anchor === "first_paid" && x.firstPaidAt != null) list.push({ reference: "-", dueAt: x.firstPaidAt + delay });
    else if (f.anchor === "first_fulfilled" && x.firstFulfilledAt != null) list.push({ reference: "-", dueAt: x.firstFulfilledAt + delay });
    else if (f.anchor === "event") list.push(...(x.events[key] ?? []).map((e) => ({ reference: e.reference, dueAt: e.dueAt })));
    for (const c of list) {
      if (c.dueAt > x.now) continue;
      if (f.expireHours > 0 && x.now > c.dueAt + f.expireHours * H) { skipped.push({ key, reference: c.reference, reason: "no longer relevant (expired)" }); continue; }
      if (x.history.some((h) => h.key === key && h.reference === c.reference && h.status !== "failed" && h.status !== "cancelled")) continue;
      const why = skipReason(key, f, x, s);
      if (why) { skipped.push({ key, reference: c.reference, reason: why }); continue; }
      due.push({ key, reference: c.reference, dueAt: c.dueAt, priority: f.priority });
    }
  }
  due.sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
  return { due, skipped };
}

/** Frequency limits for ONE optional email. Service/support and `exemptFromCaps` emails skip these. Returns a reason or null. */
export function capReason(f: FounderMeta, x: Facts, s: CsSettings): string | null {
  if (!isOptionalClass(f.klass) || f.exemptFromCaps) return null;
  const sent = x.history.filter((h) => (h.status === "sent" || h.status === "scheduled") && h.at > 0);
  const last = sent.reduce((m, h) => Math.max(m, h.at), 0);
  if (last && x.now - last < s.caps.minGapHours * H) return `minimum gap of ${s.caps.minGapHours} hours`;
  const week = sent.filter((h) => x.now - h.at < 7 * 24 * H).length;
  const first = x.firstPaidAt != null && x.now - x.firstPaidAt < 7 * 24 * H;
  const lim = x.frequency === "less" ? Math.min(1, s.caps.perWeekMax) : first ? s.caps.firstWeekMax : s.caps.perWeekMax;
  if (week >= lim) return first ? "first-week limit reached" : "weekly limit reached";
  if (sent.filter((h) => x.now - h.at < 30 * 24 * H).length >= s.caps.per30Max) return "30-day limit reached";
  if (f.reactivation && reactivationUnanswered(x) >= s.caps.reactivationMax && f.id !== "CS-36") return "reactivation limit reached";
  return null;
}
/** Reactivation attempts sent since the last purchase (a purchase or a reply resets the count). */
export function reactivationUnanswered(x: Facts): number {
  const since = x.lastPaidAt ?? 0;
  return x.history.filter((h) => h.reactivation && h.status === "sent" && h.at > since).length;
}

/** The ONE email to send now: the most important due email that the frequency limits allow. No bursts: at most one per run. */
export function choose(due: Cand[], meta: Map<string, FounderMeta>, x: Facts, s: CsSettings): { pick: Cand | null; held: Skip[] } {
  const held: Skip[] = [];
  for (const c of due) {
    const f = meta.get(c.key)!;
    if (f.id === "CS-36" && reactivationUnanswered(x) < s.caps.reactivationMax) { held.push({ key: c.key, reference: c.reference, reason: "waiting for the reactivation limit" }); continue; }
    const r = capReason(f, x, s);
    if (r) { held.push({ key: c.key, reference: c.reference, reason: r }); continue; }
    // Never two emails on the same day, even a non-capped one.
    const today = x.history.some((h) => (h.status === "sent" || h.status === "scheduled") && x.now - h.at < 20 * H && isOptionalClass(f.klass));
    if (today && !f.exemptFromCaps) { held.push({ key: c.key, reference: c.reference, reason: "already emailed today" }); continue; }
    return { pick: c, held };
  }
  return { pick: null, held };
}
