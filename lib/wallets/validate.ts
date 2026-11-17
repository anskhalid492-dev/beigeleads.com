import { bech32, bech32m, createBase58check } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2.js";
import { isEvmAddress } from "@/lib/payments/evm-chain";
import { optionForWallet } from "@/lib/payments/options";

// Wallets hold PUBLIC receiving addresses only. Customers pay straight into these.
export type WalletKind = { coin: "BTC" | "USDT" | "USDC" | "ETH"; network: string }; // network values: see lib/payments/options.ts

const b58c = createBase58check(sha256);

function isBtcAddress(network: "mainnet" | "testnet", v: string): boolean {
  const hrp = network === "mainnet" ? "bc" : "tb";
  if (v.toLowerCase().startsWith(`${hrp}1`)) {
    if (v !== v.toLowerCase() && v !== v.toUpperCase()) return false; // mixed case is invalid
    const s = v.toLowerCase();
    for (const codec of [bech32, bech32m]) {
      try {
        const d = codec.decode(s as `${string}1${string}`, 120);
        if (d.prefix !== hrp) continue;
        const version = d.words[0];
        if ((version === 0 && codec === bech32) || (version >= 1 && version <= 16 && codec === bech32m)) return true;
      } catch { /* try the other codec */ }
    }
    return false;
  }
  try {
    const b = b58c.decode(v);
    const ok = network === "mainnet" ? [0x00, 0x05] : [0x6f, 0xc4];
    return b.length === 21 && ok.includes(b[0]);
  } catch {
    return false;
  }
}

function isTronAddress(v: string): boolean {
  try {
    const b = b58c.decode(v);
    return b.length === 21 && b[0] === 0x41;
  } catch {
    return false;
  }
}

/** Throws a user-readable Error when the value is not an acceptable public address. */
export function validateWalletValue(kind: WalletKind, raw: string): string {
  const v = raw.trim();
  if (!v) throw new Error("Value is empty.");
  if (/\s/.test(v)) throw new Error("Value must not contain spaces.");
  if (/^[a-z]?(prv|pub)[0-9A-Za-z]{20,}$/.test(v) || v.split(" ").length > 3) {
    throw new Error("Paste a receiving ADDRESS, never a private key, extended key or seed phrase.");
  }
  const opt = optionForWallet(kind.coin, kind.network);
  if (!opt) throw new Error("Unsupported coin or network.");
  if (opt.chain === "bitcoin") {
    const net = kind.network === opt.mainnet ? "mainnet" : "testnet";
    if (!isBtcAddress(net, v)) throw new Error(`Not a valid Bitcoin ${net} address.`);
  } else if (opt.chain === "tron") {
    if (!isTronAddress(v)) throw new Error("Not a valid TRON address (starts with T and passes the checksum).");
  } else if (!isEvmAddress(v)) {
    throw new Error("Not a valid Ethereum address (0x + 40 hex characters; mixed case must pass the checksum).");
  }
  return v;
}

export const mask = (v: string) => (v.length > 14 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v);
