import { useQuery } from "@tanstack/react-query";

export const CHARITY_SHARE_LABEL = "Charity share earned (via Bags.fm, on-chain)";
export const CHARITY_SHARE_UNAVAILABLE = "Live data temporarily unavailable";

export interface TokenCharityShare {
  mint: string;
  charityId: string;
  available: boolean;
  feeConfigAddress: string | null;
  charityWallet: string | null;
  charityBps: number | null;
  lifetimeFeesLamports: string | null;
  charityEarnedLamports: string | null;
}

interface CharityShareResponse {
  available: boolean;
  tokens: TokenCharityShare[];
}

/**
 * Charity share earned across the live tokens that match `filter`.
 * earnedSol is null whenever any matching token's live data is missing,
 * so the UI shows "unavailable" rather than an understated total.
 */
export function useCharityShare(filter: (token: TokenCharityShare) => boolean = () => true) {
  const { data, isLoading, isError } = useQuery<CharityShareResponse>({
    queryKey: ["/api/charity-share"],
    staleTime: 5 * 60 * 1000,
  });

  const tokens = data?.tokens.filter(filter) ?? [];
  const listAvailable = !isError && !!data?.available;
  const complete = listAvailable && tokens.every((t) => t.available);
  const totalLamports = tokens.reduce((sum, t) => sum + BigInt(t.charityEarnedLamports ?? "0"), BigInt(0));

  return {
    isLoading,
    listAvailable,
    tokens,
    earnedSol: complete ? (Number(totalLamports) / 1e9).toFixed(4) : null,
  };
}
