import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidTxSignature, solscanUrl } from "@shared/solana";

export const CHARITY_SHARE_LABEL = "Charity share earned (via Bags.fm, on-chain)";
export const FEE_CLAIMS_LABEL = "Verified on-chain fee claims";
export const CHARITY_SHARE_UNAVAILABLE = "Live data temporarily unavailable";

export interface FeeClaim {
  signature: string;
  amountLamports: string;
  timestamp: string;
}

export interface TokenCharityShare {
  mint: string;
  charityId: string;
  symbol: string;
  name: string;
  available: boolean;
  feeConfigAddress: string | null;
  charityWallet: string | null;
  charityBps: number | null;
  lifetimeFeesLamports: string | null;
  charityEarnedLamports: string | null;
  claimsAvailable: boolean;
  claimsSource: "bags" | "rpc" | null;
  claims: FeeClaim[];
}

export interface TokenFeeClaim extends FeeClaim {
  mint: string;
  symbol: string;
}

interface CharityShareResponse {
  available: boolean;
  tokens: TokenCharityShare[];
}

export function lamportsToSol(lamports: bigint | string): string {
  return (Number(BigInt(lamports)) / 1e9).toFixed(4);
}

function sumLamports(values: string[]): bigint {
  return values.reduce((sum, v) => sum + BigInt(v), BigInt(0));
}

/**
 * Charity share earned and verified fee claims across the live tokens that match `filter`.
 * Each total is null whenever any matching token's data for it is missing,
 * so the UI shows "unavailable" rather than an understated total.
 */
export function useCharityShare(filter: (token: TokenCharityShare) => boolean = () => true) {
  const { data, isLoading, isError } = useQuery<CharityShareResponse>({
    queryKey: ["/api/charity-share"],
    staleTime: 5 * 60 * 1000,
  });

  const tokens = data?.tokens.filter(filter) ?? [];
  const listAvailable = !isError && !!data?.available;
  const earnedComplete = listAvailable && tokens.every((t) => t.available);
  const claimsComplete = listAvailable && tokens.every((t) => t.claimsAvailable);

  const claims: TokenFeeClaim[] = tokens
    .flatMap((t) => t.claims.map((c) => ({ ...c, mint: t.mint, symbol: t.symbol })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    isLoading,
    listAvailable,
    tokens,
    earnedSol: earnedComplete
      ? lamportsToSol(sumLamports(tokens.map((t) => t.charityEarnedLamports ?? "0")))
      : null,
    claimedSol: claimsComplete ? lamportsToSol(sumLamports(claims.map((c) => c.amountLamports))) : null,
    claimsAvailable: claimsComplete,
    claims,
  };
}

export interface TokenFigures {
  earnedSol: number | null;
  claimedSol: number | null;
  claimCount: number | null;
}

/**
 * Per-token charity share earned and verified fee claims, by mint,
 * for lists that rank or summarise tokens. null = live data unavailable.
 */
export function useTokenFigures(): (mint: string) => TokenFigures {
  const { tokens, listAvailable } = useCharityShare();
  const byMint = new Map(tokens.map((t) => [t.mint, t]));

  return (mint) => {
    const t = byMint.get(mint);
    if (!listAvailable || !t) return { earnedSol: null, claimedSol: null, claimCount: null };
    return {
      earnedSol: t.available ? Number(BigInt(t.charityEarnedLamports ?? "0")) / 1e9 : null,
      claimedSol: t.claimsAvailable ? Number(sumLamports(t.claims.map((c) => c.amountLamports))) / 1e9 : null,
      claimCount: t.claimsAvailable ? t.claims.length : null,
    };
  };
}

export function formatFigureSol(value: number | null): string {
  if (value === null) return CHARITY_SHARE_UNAVAILABLE;
  if (value > 0 && value < 0.001) return "< 0.001 SOL";
  return `${value.toFixed(3)} SOL`;
}

interface FeeClaimsListProps {
  claims: TokenFeeClaim[];
  available: boolean;
  isLoading?: boolean;
  showToken?: boolean;
  limit?: number;
}

export function FeeClaimsList({ claims, available, isLoading, showToken, limit }: FeeClaimsListProps) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!available) return <p className="text-sm text-muted-foreground">{CHARITY_SHARE_UNAVAILABLE}</p>;
  if (claims.length === 0) {
    return <p className="text-sm text-muted-foreground">No fee claims by the charity yet.</p>;
  }

  return (
    <div className="space-y-2" data-testid="list-fee-claims">
      {claims.slice(0, limit).map((claim) => (
        <div
          key={claim.signature}
          className="flex flex-wrap justify-between items-center gap-2 p-3 rounded-lg bg-muted/30"
          data-testid={`fee-claim-${claim.signature.slice(0, 8)}`}
        >
          <div>
            <p className="font-medium">
              {lamportsToSol(claim.amountLamports)} SOL
              {showToken && <span className="text-muted-foreground font-normal"> · ${claim.symbol}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{format(new Date(claim.timestamp), "MMM d, yyyy")}</p>
          </div>
          {isValidTxSignature(claim.signature) && (
            <a href={solscanUrl("tx", claim.signature)} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-view-claim-${claim.signature.slice(0, 8)}`}>
                <ExternalLink className="h-3 w-3" />
                View TX
              </Button>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
