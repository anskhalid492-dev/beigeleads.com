/**
 * USD prices from free public APIs. Needs at least 2 sources that agree; blocks
 * checkout otherwise. Fetchers are injectable so tests never touch the network.
 */
export type PriceSource = { name: string; fetch: () => Promise<number> };
export type RateCoin = "BTC" | "USDT";

export const MAX_SPREAD = 0.015; // sources may differ by at most 1.5%
export const MAX_DEPEG = 0.02; // stablecoin must be within 2% of $1
export const MIN_SOURCES = 2;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const num = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error("bad price");
  return n;
};

export function defaultSources(coin: RateCoin): PriceSource[] {
  if (coin === "BTC") {
    return [
      { name: "binance", fetch: async () => num(((await getJson("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")) as { price: string }).price) },
      { name: "kraken", fetch: async () => num(((await getJson("https://api.kraken.com/0/public/Ticker?pair=XBTUSD")) as { result: Record<string, { c: string[] }> }).result.XXBTZUSD.c[0]) },
      { name: "coinbase", fetch: async () => num(((await getJson("https://api.coinbase.com/v2/prices/BTC-USD/spot")) as { data: { amount: string } }).data.amount) },
      { name: "coingecko", fetch: async () => num(((await getJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")) as { bitcoin: { usd: number } }).bitcoin.usd) },
    ];
  }
  return [
    { name: "kraken", fetch: async () => num(((await getJson("https://api.kraken.com/0/public/Ticker?pair=USDTUSD")) as { result: Record<string, { c: string[] }> }).result.USDTZUSD.c[0]) },
    { name: "coinbase", fetch: async () => num(((await getJson("https://api.coinbase.com/v2/prices/USDT-USD/spot")) as { data: { amount: string } }).data.amount) },
    { name: "coingecko", fetch: async () => num(((await getJson("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd")) as { tether: { usd: number } }).tether.usd) },
  ];
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Throws if too few sources or they disagree. Returns the median. */
export function aggregate(prices: number[]): number {
  if (prices.length < MIN_SOURCES) throw new Error("not enough price sources");
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  if ((hi - lo) / lo > MAX_SPREAD) throw new Error("price sources disagree");
  return median(prices);
}

export function assertStablecoinPeg(price: number): void {
  if (Math.abs(price - 1) > MAX_DEPEG) throw new Error("stablecoin depeg");
}

export async function fetchUsdPrice(coin: RateCoin, sources: PriceSource[] = defaultSources(coin)): Promise<number> {
  const settled = await Promise.allSettled(sources.map((s) => s.fetch()));
  const prices = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const price = aggregate(prices);
  if (coin === "USDT") assertStablecoinPeg(price);
  return price;
}

const CACHE_TTL_SECONDS = 60; // KV minimum

/** KV-cached price (60s). The checkout locks the returned rate for 30 minutes. */
export async function getUsdPriceCached(kv: KVNamespace, coin: RateCoin): Promise<string> {
  const key = `rate:${coin}`;
  const hit = await kv.get(key);
  if (hit) return hit;
  const market = await fetchUsdPrice(coin); // throws on disagreement or depeg
  const price = coin === "USDT" ? 1 : market; // stablecoins are treated as exactly $1
  const str = price.toFixed(8);
  await kv.put(key, str, { expirationTtl: CACHE_TTL_SECONDS });
  return str;
}
