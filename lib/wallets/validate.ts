import { createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import { deriveBtcAddress, detectKind } from "@/lib/payments/derive";

export type WalletKind = { coin: "BTC"; network: "mainnet" | "testnet" } | { coin: "USDT"; network: "TRC20" };

const b58c = createBase58check(sha256);

/** Public data only. Throws a user-readable Error when the value is not acceptable. */
export function validateWalletValue(kind: WalletKind, raw: string): string {
  const v = raw.trim();
  if (!v) throw new Error("Value is empty.");
  if (/\s/.test(v)) throw new Error("Value must not contain spaces.");
  if (kind.coin === "BTC") {
    const k = detectKind(v); // rejects private keys and legacy xpub
    if (kind.network === "mainnet" && k !== "zpub") throw new Error("Mainnet needs a zpub.");
    if (kind.network === "testnet" && k !== "vpub") throw new Error("Testnet needs a vpub.");
    deriveBtcAddress(v, 0); // proves the key parses and is public
    return v;
  }
  try {
    const bytes = b58c.decode(v);
    if (bytes.length !== 21 || bytes[0] !== 0x41) throw new Error();
  } catch {
    throw new Error("Not a valid TRON address (must start with T and pass the checksum).");
  }
  return v;
}

export const mask = (v: string) => (v.length > 14 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v);
