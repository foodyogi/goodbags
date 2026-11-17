/**
 * Solana network config - Single Source of Truth
 *
 * All GoodBags tokens live on Solana mainnet. Build every explorer link with
 * solscanUrl() so the cluster is never hardcoded per page.
 */

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

export const SOLANA_CLUSTER = "mainnet-beta" as SolanaCluster;

// Food Yoga International (FYI) token mint on Bags.fm (mainnet)
// Must match FEATURED_TOKEN_MINT, which the server buyback service reads
export const FYI_TOKEN_MINT = "N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbGKgvBAGS";

export function solscanUrl(type: "tx" | "account" | "token", id: string): string {
  const url = `https://solscan.io/${type}/${id}`;
  return SOLANA_CLUSTER === "mainnet-beta" ? url : `${url}?cluster=${SOLANA_CLUSTER}`;
}
