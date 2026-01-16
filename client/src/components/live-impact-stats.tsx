import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Coins, Heart, Rocket, TrendingUp, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
}

function StatCard({ icon: Icon, label, value, subtext, color, testId }: StatCardProps) {
  return (
    <Card className="p-4 md:p-6" data-testid={testId}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl md:text-3xl font-bold truncate" data-testid={`${testId}-value`}>{value}</p>
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

  const stats = data?.stats;
  const formattedDonated = stats ? parseFloat(stats.totalDonated).toFixed(4) : "0";
  const formattedVolume = stats ? parseFloat(stats.totalVolume).toFixed(2) : "0";
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <section className="py-12 md:py-16" data-testid="section-live-impact">
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
            All statistics are pulled directly from the blockchain. 
            Every donation and transaction is publicly verifiable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
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
                label="Total Donated to Charity"
                value={`${formattedDonated} SOL`}
                subtext="Verified on-chain"
                color="bg-pink-500 dark:bg-pink-600"
                testId="stat-total-donated"
              />
              <StatCard
                icon={Rocket}
                label="Tokens Launched"
                value={String(stats?.totalTokens ?? 0)}
                subtext="Impact tokens created"
                color="bg-primary"
                testId="stat-tokens-launched"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Trading Volume"
                value={`${formattedVolume} SOL`}
                subtext="Across all tokens"
                color="bg-secondary"
                testId="stat-trading-volume"
              />
              <StatCard
                icon={Coins}
                label="FYI Buyback Pool"
                value={`${parseFloat(stats?.totalPlatformFees ?? "0").toFixed(4)} SOL`}
                subtext="Auto-buying FYI tokens"
                color="bg-blue-500 dark:bg-blue-600"
                testId="stat-buyback-pool"
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
