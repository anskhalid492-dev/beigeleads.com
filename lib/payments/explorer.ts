import { optionForWallet } from "./options";

/** Block-explorer link so the owner can check a buyer-claimed transaction by hand. */
export function explorerTxUrl(coin: string, network: string, txHash: string): string | null {
  const o = optionForWallet(coin, network);
  if (!o || !/^(0x)?[0-9a-fA-F]{16,128}$/.test(txHash)) return null;
  const test = network === o.test;
  const h = txHash.trim();
  if (o.chain === "bitcoin") return `https://mempool.space/${test ? "testnet4/" : ""}tx/${h}`;
  if (o.chain === "tron") return `https://${test ? "nile." : ""}tronscan.org/#/transaction/${h}`;
  return `https://${test ? "sepolia." : ""}etherscan.io/tx/${h.startsWith("0x") ? h : `0x${h}`}`;
}
