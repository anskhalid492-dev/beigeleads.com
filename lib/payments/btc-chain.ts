// Reads Bitcoin payments from the free mempool.space API. Pure parsing is separate from fetching so it can be tested.
export type ChainTx = { txid: string; sats: bigint; confirmations: number };

type MempoolTx = {
  txid: string;
  vout: { scriptpubkey_address?: string; value: number }[];
  status: { confirmed: boolean; block_height?: number };
};

export const BTC_API = { mainnet: "https://mempool.space/api", testnet: "https://mempool.space/testnet/api" } as const;

/** Sums what each transaction pays to `address`. Ignores transactions that pay it nothing. */
export function summarizeTxs(address: string, txs: readonly MempoolTx[], tipHeight: number): ChainTx[] {
  const out: ChainTx[] = [];
  for (const tx of txs) {
    let sats = 0n;
    for (const o of tx.vout) if (o.scriptpubkey_address === address) sats += BigInt(o.value);
    if (sats === 0n) continue;
    const h = tx.status.confirmed ? tx.status.block_height : undefined;
    const confirmations = h !== undefined && tipHeight >= h ? tipHeight - h + 1 : 0;
    out.push({ txid: tx.txid, sats, confirmations });
  }
  return out;
}

async function getJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const res = await fetcher(url, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`chain api ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchBtcPayments(base: string, address: string, fetcher: typeof fetch = fetch): Promise<ChainTx[]> {
  if (!/^(bc1|tb1)[a-z0-9]{20,90}$/.test(address)) throw new Error("unexpected address format");
  const [tip, txs] = await Promise.all([
    getJson<number>(`${base}/blocks/tip/height`, fetcher),
    getJson<MempoolTx[]>(`${base}/address/${address}/txs`, fetcher),
  ]);
  return summarizeTxs(address, txs, tip);
}
