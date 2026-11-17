import type { ChainTx } from "./btc-chain";

// Reads incoming USDT (TRC20) transfers from TronGrid. `only_confirmed=true` returns only final (solidified)
// transfers, so a transfer we see is already confirmed (confirmations = 1 means "final").
export const TRON_MAINNET = { api: "https://api.trongrid.io", usdt: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" } as const;

type TronTransfer = { transaction_id: string; to: string; value: string; block_timestamp: number; token_info?: { address?: string } };

/** Keeps transfers of the expected token sent TO `address`. Pure, tested. */
export function summarizeTransfers(address: string, contract: string, rows: readonly TronTransfer[]): ChainTx[] {
  const out: ChainTx[] = [];
  for (const r of rows) {
    if (r.to !== address) continue;
    if (r.token_info?.address && r.token_info.address !== contract) continue;
    if (!/^\d+$/.test(r.value)) continue;
    out.push({ txid: r.transaction_id, sats: BigInt(r.value), confirmations: 1, timeMs: r.block_timestamp });
  }
  return out;
}

export async function fetchTronPayments(
  cfg: { api: string; usdt: string },
  address: string,
  sinceMs: number,
  fetcher: typeof fetch = fetch,
  apiKey?: string,
): Promise<ChainTx[]> {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error("unexpected address format");
  const url = `${cfg.api}/v1/accounts/${address}/transactions/trc20?only_confirmed=true&only_to=true&limit=200&min_timestamp=${Math.floor(sinceMs)}&contract_address=${cfg.usdt}`;
  const res = await fetcher(url, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json", ...(apiKey ? { "TRON-PRO-API-KEY": apiKey } : {}) } });
  if (!res.ok) throw new Error(`tron api ${res.status}`);
  const body = (await res.json()) as { data?: TronTransfer[] };
  return summarizeTransfers(address, cfg.usdt, body.data ?? []);
}
