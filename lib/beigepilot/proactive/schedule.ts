// Session timing for proactive messages. Pure: the browser feeds it time and flags, tests drive it with a fake clock.
import type { Stage } from "./types";

export type SState = {
  sid: string;
  activeMs: number; // visible-tab browsing time in this session
  stage: number; // messages already shown: 0..3
  lastShownMs: number; // activeMs when the last message appeared (-1 = none)
  hiddenAtMs: number; // activeMs when the last bubble went away (-1 = none yet)
  stop: boolean; // dismissed, clicked, or the visitor started chatting: no more messages this session
  shown: string[]; // template ids already used
  nextTryMs: number; // when to ask the server again after it had nothing suitable
  last?: Stage; // stage of the most recent bubble (for analytics attribution)
  tpl?: string; // template id of that bubble
  pg?: string; // page kind it appeared on
  search?: string;
  recent: string[]; // paths of recently viewed single-segment /lists pages
  events: string[]; // analytics already sent, "stage:event"
};
export const freshState = (sid: string): SState => ({ sid, activeMs: 0, stage: 0, lastShownMs: -1, hiddenAtMs: -1, stop: false, shown: [], nextTryMs: 0, recent: [], events: [] });

/** Add elapsed time, but only while the tab is visible, and never more than 1.5 s per tick (a sleeping laptop must not "fast-forward" the schedule). */
export function advance(s: SState, dtMs: number, visible: boolean): SState {
  if (!visible || dtMs <= 0) return s;
  return { ...s, activeMs: s.activeMs + Math.min(dtMs, 1500) };
}

export type Gate = { chatOpen: boolean; bubbleVisible: boolean; pathBlocked: boolean; mobileBlocked: boolean };
export const MIN_BETWEEN_MS = 20_000;

/** The stage that is due right now, or null. Only ever the NEXT stage, so several messages can never fire at once. */
export function dueStage(s: SState, delays: readonly number[], g: Gate): Stage | null {
  if (s.stop || s.stage >= 3 || g.chatOpen || g.bubbleVisible || g.pathBlocked || g.mobileBlocked) return null;
  if (s.activeMs < s.nextTryMs) return null;
  if (s.stage > 0 && s.hiddenAtMs >= 0 && s.activeMs - s.hiddenAtMs < MIN_BETWEEN_MS) return null;
  const next = (s.stage + 1) as Stage;
  return s.activeMs >= delays[next - 1] * 1000 ? next : null;
}

export const onShown = (s: SState, stage: Stage, id: string, page = ""): SState => ({ ...s, stage, lastShownMs: s.activeMs, shown: [...s.shown, id], last: stage, tpl: id, pg: page });
export const onHidden = (s: SState): SState => ({ ...s, hiddenAtMs: s.activeMs });
export const onNothing = (s: SState): SState => ({ ...s, nextTryMs: s.activeMs + 20_000 });
export const onStop = (s: SState): SState => ({ ...s, stop: true });
export const markEvent = (s: SState, key: string): { s: SState; fresh: boolean } => (s.events.includes(key) ? { s, fresh: false } : { s: { ...s, events: [...s.events, key] }, fresh: true });
