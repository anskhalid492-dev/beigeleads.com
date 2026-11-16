/**
 * Exact crypto amount math. Everything is BigInt "atomic units" (satoshi for BTC,
 * 1e-6 for USDT). Never use floats for money.
 */

export type CoinSpec = { coin: string; network: string; decimals: number };

export const COINS = {
  BTC: { coin: "BTC", network: "bitcoin", decimals: 8 },
  USDT_TRC20: { coin: "USDT", network: "tron", decimals: 6 },
} as const satisfies Record<string, CoinSpec>;

const RATE_SCALE = 8; // rates are held as integers scaled by 1e8

/** "67123.45" -> 6712345000000n (scaled by 1e8). Rejects junk. */
export function parseRate(rate: string): bigint {
  if (!/^\d+(\.\d{1,12})?$/.test(rate)) throw new Error("invalid rate");
  const [whole, frac = ""] = rate.split(".");
  const fracPadded = (frac + "0".repeat(RATE_SCALE)).slice(0, RATE_SCALE);
  const v = BigInt(whole + fracPadded);
  if (v <= 0n) throw new Error("rate must be positive");
  return v;
}

/** Rounds UP so the buyer never underpays because of rounding. */
export function usdCentsToAtomic(usdCents: number, rate: string, decimals: number): bigint {
  if (!Number.isInteger(usdCents) || usdCents <= 0) throw new Error("invalid usd cents");
  const scaledRate = parseRate(rate); // USD per 1 coin, x1e8
  // atomic = cents/100 USD / (rate USD per coin) * 10^decimals
  const num = BigInt(usdCents) * 10n ** BigInt(decimals) * 10n ** BigInt(RATE_SCALE);
  const den = scaledRate * 100n;
  return (num + den - 1n) / den;
}

export function formatAtomic(atomic: bigint, decimals: number): string {
  if (atomic < 0n) throw new Error("negative amount");
  const s = atomic.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals);
  return decimals === 0 ? whole : `${whole}.${frac}`;
}

export function parseAtomic(decimal: string, decimals: number): bigint {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(decimal);
  if (!m) throw new Error("invalid amount");
  const frac = m[2] ?? "";
  if (frac.length > decimals) throw new Error("too many decimals");
  return BigInt(m[1] + (frac + "0".repeat(decimals)).slice(0, decimals));
}

export const QUOTE_LOCK_MS = 30 * 60 * 1000;

export type Quote = {
  coin: string;
  network: string;
  usdCents: number;
  rate: string;
  atomic: bigint;
  amount: string;
  expiresAt: number; // epoch ms
};

export function buildQuote(spec: CoinSpec, usdCents: number, rate: string, now: number): Quote {
  const atomic = usdCentsToAtomic(usdCents, rate, spec.decimals);
  return {
    coin: spec.coin,
    network: spec.network,
    usdCents,
    rate,
    atomic,
    amount: formatAtomic(atomic, spec.decimals),
    expiresAt: now + QUOTE_LOCK_MS,
  };
}
