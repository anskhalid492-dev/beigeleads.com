// Every way a buyer can pay. One entry per (coin, chain). Wallet rows store `coin` + `network` and are mapped back here.
export type Chain = "bitcoin" | "tron" | "evm";
export type PayOption = {
  id: string;
  coin: "BTC" | "USDT" | "USDC" | "ETH";
  label: string;
  chain: Chain;
  decimals: number;
  /** price source group (stablecoins are treated as $1 after a depeg check) */
  rateCoin: "BTC" | "ETH" | "USDT" | "USDC";
  mainnet: string; // wallet.network on mainnet
  test: string; // wallet.network on the test network
  /** smallest unique-amount step: 1 sat, 0.0001 USDT/USDC, 1e-8 ETH */
  step: bigint;
  /** token contract on mainnet (tokens only) */
  contract?: string;
  testNetworkName: string;
  mainNetworkName: string;
};

export const OPTIONS: Record<string, PayOption> = {
  BTC: { id: "BTC", coin: "BTC", label: "Bitcoin (BTC)", chain: "bitcoin", decimals: 8, rateCoin: "BTC", mainnet: "mainnet", test: "testnet", step: 1n, mainNetworkName: "the Bitcoin (BTC) network", testNetworkName: "the Bitcoin testnet" },
  "USDT-TRC20": { id: "USDT-TRC20", coin: "USDT", label: "USDT on TRON (TRC20)", chain: "tron", decimals: 6, rateCoin: "USDT", mainnet: "TRC20", test: "nile", step: 100n, mainNetworkName: "the TRON (TRC20) network", testNetworkName: "the TRON Nile test network" },
  "USDT-ERC20": { id: "USDT-ERC20", coin: "USDT", label: "USDT token on Ethereum (ERC20)", chain: "evm", decimals: 6, rateCoin: "USDT", mainnet: "ERC20", test: "ERC20-sepolia", step: 100n, contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7", mainNetworkName: "the Ethereum network (ERC20)", testNetworkName: "the Ethereum Sepolia test network" },
  "USDC-ERC20": { id: "USDC-ERC20", coin: "USDC", label: "USDC token on Ethereum (ERC20)", chain: "evm", decimals: 6, rateCoin: "USDC", mainnet: "ERC20", test: "ERC20-sepolia", step: 100n, contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", mainNetworkName: "the Ethereum network (ERC20)", testNetworkName: "the Ethereum Sepolia test network" },
  ETH: { id: "ETH", coin: "ETH", label: "Ethereum (ETH coin)", chain: "evm", decimals: 18, rateCoin: "ETH", mainnet: "ethereum", test: "sepolia", step: 10_000_000_000n, mainNetworkName: "the Ethereum network", testNetworkName: "the Ethereum Sepolia test network" },
};

export const OPTION_IDS = Object.keys(OPTIONS) as [string, ...string[]];

/** Map a stored wallet / attempt row back to its option. */
export function optionForWallet(coin: string, network: string): PayOption | undefined {
  return Object.values(OPTIONS).find((o) => o.coin === coin && (o.mainnet === network || o.test === network));
}
export const isTestNetwork = (o: PayOption, network: string) => o.test === network;
