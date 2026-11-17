import type { ChainTx } from "./btc-chain";
import { QUOTE_LOCK_MS } from "./amounts";

export type OpenAttempt = { id: number; expectedAtomic: bigint; expiresAtMs: number };
const MATCH_WINDOW_MS = 7 * 24 * 3600 * 1000;

/**
 * All customers pay into ONE address, so a payment belongs to the order whose unique amount it equals EXACTLY.
 * A transfer only counts for an order if it happened after that order's quote was created, so an old payment of
 * the same amount can never be attributed to a newer order. Returns attemptId -> its transfers; `unmatched` are
 * transfers that match no order (wrong amount, fee deducted by an exchange, unrelated deposit): admin review.
 */
export function matchPayments(attempts: readonly OpenAttempt[], txs: readonly ChainTx[], nowMs: number) {
  const byAttempt = new Map<number, ChainTx[]>();
  const unmatched: ChainTx[] = [];
  for (const tx of txs) {
    const t = tx.timeMs ?? nowMs; // unconfirmed = happening now
    if (nowMs - t > MATCH_WINDOW_MS) continue;
    const hit = attempts.find((a) => a.expectedAtomic === tx.sats && t >= a.expiresAtMs - QUOTE_LOCK_MS);
    if (hit) byAttempt.set(hit.id, [...(byAttempt.get(hit.id) ?? []), tx]);
    else unmatched.push(tx);
  }
  return { byAttempt, unmatched };
}
