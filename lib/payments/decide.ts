import { classifyPayment } from "./state";

export type SeenTx = { sats: bigint; confirmations: number; seenAtMs: number };
export type Decision =
  | { action: "none" }
  | { action: "expire" }
  | { action: "paid"; overpaidAtomic: bigint; receivedAtomic: bigint }
  | { action: "partial"; remainingAtomic: bigint; receivedAtomic: bigint }
  | { action: "late"; receivedAtomic: bigint };

/** What should happen to one payment attempt right now? Pure and idempotent: applying it twice changes nothing. */
export function decideAttempt(i: {
  expectedAtomic: bigint;
  txs: readonly SeenTx[];
  confirmationsNeeded: number;
  expiresAtMs: number;
  nowMs: number;
  orderStatus: "pending" | "partial" | "expired" | "late_payment" | "paid" | "refunded";
}): Decision {
  if (i.orderStatus === "paid" || i.orderStatus === "refunded") return { action: "none" };
  if (i.txs.length === 0) return i.nowMs > i.expiresAtMs && i.orderStatus === "pending" ? { action: "expire" } : { action: "none" };

  const receivedAtomic = i.txs.reduce((s, t) => s + t.sats, 0n);
  const c = classifyPayment({
    expectedAtomic: i.expectedAtomic,
    receivedAtomic,
    confirmations: Math.min(...i.txs.map((t) => t.confirmations)), // the weakest transaction decides
    confirmationsNeeded: i.confirmationsNeeded,
    seenAtMs: Math.min(...i.txs.map((t) => t.seenAtMs)),
    expiresAtMs: i.expiresAtMs,
  });
  switch (c.kind) {
    case "waiting_confirmations": return { action: "none" };
    case "late_payment": return i.orderStatus === "late_payment" ? { action: "none" } : { action: "late", receivedAtomic };
    case "partial": return i.orderStatus === "partial" ? { action: "none" } : { action: "partial", remainingAtomic: c.remainingAtomic, receivedAtomic };
    case "paid": return { action: "paid", overpaidAtomic: c.overpaidAtomic, receivedAtomic };
  }
}
