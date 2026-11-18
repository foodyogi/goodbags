import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Heart, Rocket, TrendingUp, RefreshCw, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CHARITY_SHARE_LABEL, CHARITY_SHARE_UNAVAILABLE, FEE_CLAIMS_LABEL, useCharityShare } from "@/components/charity-share-earned";

interface DashboardStats {
  totalTokens: number;
  totalDonated: string;
  totalVolume: string;
  totalPlatformFees: string;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  testId: string;
  valueClassName?: string;
}

function StatCard({ icon: Icon, label, value, subtext, color, testId, valueClassName = "text-2xl md:text-3xl truncate" }: StatCardProps) {
  return (
    <Card className="p-4 md:p-6" data-testid={testId}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`${valueClassName} font-bold`} data-testid={`${testId}-value`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </Card>
  );
}

export function LiveImpactStats() {
  const { data, isLoading, dataUpdatedAt } = useQuery<{ stats: DashboardStats }>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 30000,
  });

  const charityShare = useCharityShare();

  const stats = data?.stats;
  const formattedVolume = stats ? parseFloat(stats.totalVolume).toFixed(2) : "0";
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <section id="proof" className="py-12 md:py-16 scroll-mt-20" data-testid="section-live-impact">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 mb-4" data-testid="badge-live-stats">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Live Platform Stats</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="heading-impact-stats">
            Real-Time Impact Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Token and launch figures come from GoodBags launch records. 
            Charity share comes from Bags.fm lifetime fees and each token's on-chain fee split. Fee claims are
            on-chain transactions in which a charity's wallet claimed its share.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading || charityShare.isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={Heart}
                label={CHARITY_SHARE_LABEL}
                value={charityShare.earnedSol !== null ? `${charityShare.earnedSol} SOL` : CHARITY_SHARE_UNAVAILABLE}
                valueClassName={charityShare.earnedSol !== null ? undefined : "text-base"}
                subtext="Bags.fm lifetime fees x each token's on-chain charity share. Verify on each token page."
                color="bg-pink-500 dark:bg-pink-600"
                testId="stat-charity-share"
              />
              <StatCard
                icon={ShieldCheck}
                label={FEE_CLAIMS_LABEL}
                value={charityShare.claimedSol !== null ? `${charityShare.claimedSol} SOL` : CHARITY_SHARE_UNAVAILABLE}
                valueClassName={charityShare.claimedSol !== null ? undefined : "text-base"}
                subtext={charityShare.claimedSol !== null
                  ? `${charityShare.claims.length} claims by charity wallets, each with a Solscan link on its token page`
                  : undefined}
                color="bg-green-600 dark:bg-green-700"
                testId="stat-fee-claims"
              />
              <StatCard
                icon={Rocket}
                label="Tokens Launched"
                value={stats ? String(stats.totalTokens) : CHARITY_SHARE_UNAVAILABLE}
                valueClassName={stats ? undefined : "text-base"}
                subtext="Live tokens with an on-chain launch transaction"
                color="bg-primary"
                testId="stat-tokens-launched"
              />
              <StatCard
                icon={TrendingUp}
                label="Launch Buy Volume"
                value={stats ? `${formattedVolume} SOL` : CHARITY_SHARE_UNAVAILABLE}
                valueClassName={stats ? undefined : "text-base"}
                subtext="Initial buys recorded at launch, later trading not tracked"
                color="bg-secondary"
                testId="stat-trading-volume"
              />
            </>
          )}
        </div>

        {lastUpdated && (
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground" data-testid="text-last-updated">
            <RefreshCw className="h-3 w-3" />
            <span>Auto-refreshes every 30 seconds. Last updated: {lastUpdated}</span>
          </div>
        )}
      </div>
    </section>
  );
}
