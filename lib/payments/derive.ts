import { HDKey } from "@scure/bip32";
import { bech32 } from "@scure/base";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * BTC receiving addresses from a PUBLIC extended key only (native SegWit, BIP84).
 * Private keys / seed phrases are rejected on purpose.
 */
const VERSIONS = {
  zpub: { private: 0x04b2430c, public: 0x04b24746, hrp: "bc" },
  vpub: { private: 0x045f18bc, public: 0x045f1cf6, hrp: "tb" }, // testnet
} as const;

export type XpubKind = keyof typeof VERSIONS;

export function detectKind(key: string): XpubKind {
  if (/^[xyztuvYZ]prv/i.test(key) || /^[a-z]prv/.test(key)) {
    throw new Error("private keys are never accepted; provide a public key (zpub)");
  }
  if (key.startsWith("zpub")) return "zpub";
  if (key.startsWith("vpub")) return "vpub";
  throw new Error("unsupported key: use a native SegWit zpub (mainnet) or vpub (testnet)");
}

export function deriveBtcAddress(extendedPub: string, index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= 2 ** 31) throw new Error("invalid index");
  const kind = detectKind(extendedPub.trim());
  const v = VERSIONS[kind];
  const root = HDKey.fromExtendedKey(extendedPub.trim(), { private: v.private, public: v.public });
  if (root.privateKey) throw new Error("private keys are never accepted");
  const child = root.deriveChild(0).deriveChild(index); // external chain, then index
  if (!child.publicKey) throw new Error("could not derive key");
  const hash160 = ripemd160(sha256(child.publicKey));
  return bech32.encode(v.hrp, [0, ...bech32.toWords(hash160)]);
}
