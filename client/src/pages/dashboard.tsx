import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/stats-cards";
import { TokensGrid } from "@/components/tokens-grid";
import { DonationTracker } from "@/components/donation-tracker";
import type { LaunchedToken, Donation } from "@shared/schema";

interface DashboardData {
  tokens: LaunchedToken[];
  donations: Donation[];
  stats: {
    totalTokens: number;
    totalDonated: string;
    totalVolume: string;
  };
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track launched tokens, trading volume, and blockchain-verified donations
          </p>
        </div>

        <StatsCards stats={data?.stats} isLoading={isLoading} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Launched Tokens</h2>
            <TokensGrid tokens={data?.tokens} isLoading={isLoading} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Charity Donations</h2>
            <DonationTracker donations={data?.donations} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
