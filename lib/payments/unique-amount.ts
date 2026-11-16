/**
 * USDT TRC20 launches with ONE receiving address, so each open order gets a unique
 * decimal amount (e.g. 49.0137). Base amount is rounded up to 4 decimals, then a
 * random 0.0001..0.0999 offset is added that no other open order uses.
 */
const STEP = 100n; // 0.0001 USDT in 1e-6 units
const MAX_OFFSET = 999; // up to 0.0999 USDT

export function allocateUniqueAmount(
  baseAtomic: bigint,
  taken: ReadonlySet<bigint>,
  random: () => number = Math.random,
): bigint {
  const rounded = ((baseAtomic + STEP - 1n) / STEP) * STEP;
  const start = Math.floor(random() * MAX_OFFSET) + 1;
  for (let i = 0; i < MAX_OFFSET; i++) {
    const offset = ((start - 1 + i) % MAX_OFFSET) + 1;
    const candidate = rounded + BigInt(offset) * STEP;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("no unique amount available; too many open orders for this base amount");
}
