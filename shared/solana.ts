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

// Food Yoga International charity wallet: the @fflglobal Bags.fm wallet that
// receives FYI's charity share of GoodBags token royalties
export const FYI_CHARITY_WALLET = "3psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr";

// Bags.fm wallet managed by founder Paul Rodney Turner. Receives creator fees
// and the fees of the separate $FYI coin. NOT the charity recipient.
export const FYI_COIN_FEE_WALLET = "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP";

// A real Solana transaction signature: base58, 87 or 88 characters.
// This checks the format only, it does not prove the transaction exists on-chain.
const TX_SIGNATURE_REGEX = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

export function isValidTxSignature(value: unknown): value is string {
  return typeof value === "string" && TX_SIGNATURE_REGEX.test(value);
}

// Public donation totals only count records with a real transaction signature
export function verifiedDonationTotals(
  donations: { amount: string; transactionSignature: string }[],
): { totalDonated: string; donationCount: number } {
  const verified = donations.filter((d) => isValidTxSignature(d.transactionSignature));
  return {
    totalDonated: verified.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(9),
    donationCount: verified.length,
  };
}
