import { keccak_256 } from "@noble/hashes/sha3.js";
import type { ChainTx } from "./btc-chain";

// Reads incoming ETH and ERC-20 transfers from a Blockscout instance (free, keyless public instances; an optional
// API key can be passed). Field names follow Blockscout's documented REST API v2. NOT yet tested against the live service.
export const EVM_MAINNET_API = "https://eth.blockscout.com";
export const EVM_SEPOLIA_API = "https://eth-sepolia.blockscout.com";

type Num = string | number | null | undefined;
type NativeItem = { hash?: string; value?: Num; to?: { hash?: string } | null; status?: string | null; result?: string; block_number?: number | null; timestamp?: string | null; confirmations?: number };
type TokenItem = { transaction_hash?: string; total?: { value?: Num } | null; token?: { address_hash?: string; address?: string } | null; timestamp?: string | null; block_number?: number | null };

const low = (s?: string | null) => (s ?? "").toLowerCase();
const big = (v: Num): bigint | null => (typeof v === "string" && /^\d+$/.test(v) ? BigInt(v) : typeof v === "number" && Number.isInteger(v) ? BigInt(v) : null);
const ms = (t?: string | null) => { const n = t ? Date.parse(t) : NaN; return Number.isFinite(n) ? n : undefined; };

/** Native ETH sent to `address` whose amount is one we are waiting for. Pure, tested. */
export function parseNative(address: string, items: readonly NativeItem[], wanted: ReadonlySet<bigint>): ChainTx[] {
  const out: ChainTx[] = [];
  for (const i of items) {
    if (low(i.to?.hash) !== low(address) || !i.hash) continue;
    if (i.status === "error" || (i.result && i.result !== "success" && i.result !== "pending" && i.result !== "awaiting_internal_transactions")) continue;
    const v = big(i.value);
    if (v === null || !wanted.has(v)) continue;
    out.push({ txid: i.hash, sats: v, confirmations: i.block_number ? Math.max(0, i.confirmations ?? 0) : 0, timeMs: ms(i.timestamp) });
  }
  return out;
}

/** ERC-20 transfers of `contract` to us with a wanted amount. Confirmations are filled in afterwards. */
export function parseErc20(contract: string, items: readonly TokenItem[], wanted: ReadonlySet<bigint>): ChainTx[] {
  const out: ChainTx[] = [];
  for (const i of items) {
    if (!i.transaction_hash || low(i.token?.address_hash ?? i.token?.address) !== low(contract)) continue;
    const v = big(i.total?.value);
    if (v === null || !wanted.has(v)) continue;
    out.push({ txid: i.transaction_hash, sats: v, confirmations: 0, timeMs: ms(i.timestamp) });
  }
  return out;
}

async function getJson<T>(url: string, fetcher: typeof fetch, apiKey?: string): Promise<T> {
  const u = apiKey ? `${url}${url.includes("?") ? "&" : "?"}apikey=${encodeURIComponent(apiKey)}` : url;
  const res = await fetcher(u, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`evm api ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchEvmPayments(
  cfg: { base: string; apiKey?: string },
  address: string,
  asset: { kind: "native" } | { kind: "erc20"; contract: string },
  wanted: ReadonlySet<bigint>,
  fetcher: typeof fetch = fetch,
): Promise<ChainTx[]> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("unexpected address format");
  if (asset.kind === "native") {
    const r = await getJson<{ items?: NativeItem[] }>(`${cfg.base}/api/v2/addresses/${address}/transactions?filter=to`, fetcher, cfg.apiKey);
    return parseNative(address, r.items ?? [], wanted);
  }
  const r = await getJson<{ items?: TokenItem[] }>(`${cfg.base}/api/v2/addresses/${address}/token-transfers?type=ERC-20&filter=to`, fetcher, cfg.apiKey);
  const txs = parseErc20(asset.contract, r.items ?? [], wanted);
  // Token transfers carry no confirmation count: ask for the transaction (only for amounts we are waiting for).
  for (const t of txs) {
    try {
      const tx = await getJson<{ confirmations?: number; status?: string | null }>(`${cfg.base}/api/v2/transactions/${t.txid}`, fetcher, cfg.apiKey);
      t.confirmations = tx.status === "error" ? 0 : Math.max(0, tx.confirmations ?? 0);
    } catch { t.confirmations = 0; }
  }
  return txs;
}

/** EIP-55: mixed-case addresses must have a valid checksum (catches typos); all-lowercase/uppercase are accepted. */
export function isEvmAddress(v: string): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return false;
  const body = v.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) return true;
  const hash = [...keccak_256(new TextEncoder().encode(body.toLowerCase()))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return [...body].every((c, i) => (/[a-f]/i.test(c) ? (parseInt(hash[i], 16) >= 8 ? c === c.toUpperCase() : c === c.toLowerCase()) : true));
}
