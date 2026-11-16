/** Payment classification and the order state machine. Pure functions, fully tested. */
export const TOLERANCE_BPS = 100n; // 1%

export type OrderStatus = "pending" | "paid" | "expired" | "partial" | "late_payment" | "refunded";

export type Classification =
  | { kind: "waiting_confirmations" }
  | { kind: "paid"; overpaidAtomic: bigint } // overpaidAtomic > 0 => flag for refund/credit
  | { kind: "partial"; remainingAtomic: bigint }
  | { kind: "late_payment" };

export function classifyPayment(i: {
  expectedAtomic: bigint;
  receivedAtomic: bigint;
  confirmations: number;
  confirmationsNeeded: number;
  seenAtMs: number;
  expiresAtMs: number;
}): Classification {
  if (i.expectedAtomic <= 0n) throw new Error("invalid expected amount");
  if (i.seenAtMs > i.expiresAtMs) return { kind: "late_payment" }; // admin decides manually
  if (i.confirmations < i.confirmationsNeeded) return { kind: "waiting_confirmations" };
  const minOk = (i.expectedAtomic * (10_000n - TOLERANCE_BPS)) / 10_000n;
  if (i.receivedAtomic < minOk) {
    return { kind: "partial", remainingAtomic: i.expectedAtomic - i.receivedAtomic };
  }
  const maxOk = (i.expectedAtomic * (10_000n + TOLERANCE_BPS)) / 10_000n;
  return { kind: "paid", overpaidAtomic: i.receivedAtomic > maxOk ? i.receivedAtomic - i.expectedAtomic : 0n };
}

const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["paid", "expired", "partial", "late_payment"],
  partial: ["paid", "expired", "late_payment", "refunded"],
  expired: ["late_payment"],
  late_payment: ["paid", "refunded"],
  paid: ["refunded"],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** Idempotent: re-applying the same status is a no-op, anything illegal throws. */
export function transition(from: OrderStatus, to: OrderStatus): { changed: boolean; status: OrderStatus } {
  if (from === to) return { changed: false, status: from };
  if (!canTransition(from, to)) throw new Error(`illegal order transition ${from} -> ${to}`);
  return { changed: true, status: to };
}

/** Minimum confirmations. Wallet setting can only raise it. */
export function confirmationsNeeded(coin: string, network: string, usdCents: number, walletMin: number): number {
  let base: number;
  if (coin === "BTC") base = usdCents >= 100_000 ? 3 : 2; // 3 for $1,000+
  else if (network === "tron") base = 1; // watcher reads TronGrid's solidified (final) data
  else base = 12; // EVM mainnet; lower on L2 when added
  return Math.max(base, walletMin);
}
