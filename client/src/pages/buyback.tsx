import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  ExternalLink, 
  Coins, 
  RefreshCw,
  Clock,
  ArrowRight,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { FyiCoin } from "@/components/fyi-coin";
import { ThemedLogo } from "@/components/themed-logo";

interface BuybackStats {
  totalSolSpent: string;
  totalFyiBought: string;
  totalTransactions: number;
  walletAddress: string;
}

interface Buyback {
  id: string;
  solAmount: string;
  fyiAmount: string;
  transactionSignature: string;
  status: string;
  executedAt: string;
}

const BUYBACK_WALLET = "8pgMzffWjeuYvjYQkyfvWpzKWQDvjXAm4iQB1auvQZH8";
const FYI_TOKEN_MINT = "N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbNKgvBAGS";

function truncateSignature(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

function StatCard({ icon: Icon, label, value, color, useFyiCoin }: { icon?: React.ElementType; label: string; value: string; color: string; useFyiCoin?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {useFyiCoin ? (
            <FyiCoin size="md" />
          ) : (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
              {Icon && <Icon className="h-6 w-6 text-white" />}
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BuybackPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<BuybackStats>({
    queryKey: ["/api/buyback/stats"],
    refetchInterval: 60000,
  });

  const { data: history, isLoading: historyLoading } = useQuery<Buyback[]>({
    queryKey: ["/api/buyback/history"],
    refetchInterval: 60000,
  });

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-28 w-28 md:h-40 md:w-40 rounded-2xl object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 mb-4" data-testid="badge-buyback">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Automated Buyback</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-buyback">
            FYI Token Buyback Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            0.15% of all trading fees on GoodBags automatically buy FYI tokens. 
            This creates constant buy pressure and supports the ecosystem. 
            Every transaction is publicly verifiable.
          </p>
        </div>

        <div className="mb-8 p-4 rounded-lg bg-muted/30 border border-border" data-testid="section-how-it-works">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            How It Works
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">0.15% Buyback Fee</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Buyback Wallet</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background">
              <Clock className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium">Auto-Swap Every Hour</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background">
              <FyiCoin size="sm" />
              <span className="text-sm font-medium">FYI Buy Pressure</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={Coins}
                label="Total SOL Spent"
                value={`${parseFloat(stats?.totalSolSpent ?? "0").toFixed(4)} SOL`}
                color="bg-primary"
              />
              <StatCard
                label="Total FYI Bought"
                value={`${parseFloat(stats?.totalFyiBought ?? "0").toFixed(2)} FYI`}
                color=""
                useFyiCoin={true}
              />
              <StatCard
                icon={RefreshCw}
                label="Total Buybacks"
                value={String(stats?.totalTransactions ?? 0)}
                color="bg-secondary"
              />
              <StatCard
                icon={Clock}
                label="Next Check"
                value="~60 min"
                color="bg-blue-500 dark:bg-blue-600"
              />
            </>
          )}
        </div>

        <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20" data-testid="section-wallet-info">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Buyback Wallet Address</p>
              <p className="font-mono text-sm" data-testid="text-buyback-wallet">{BUYBACK_WALLET}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" asChild data-testid="link-view-wallet">
                <a 
                  href={`https://solscan.io/account/${BUYBACK_WALLET}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Wallet on Solscan
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild data-testid="link-view-fyi">
                <a 
                  href={`https://solscan.io/token/${FYI_TOKEN_MINT}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View FYI Token
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Card data-testid="section-buyback-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Buyback Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Buybacks Yet</h3>
                <p className="text-muted-foreground">
                  Buybacks will appear here once the wallet accumulates enough SOL (minimum 0.015 SOL).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((buyback) => (
                  <div 
                    key={buyback.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/30"
                    data-testid={`buyback-row-${buyback.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={buyback.status === "SUCCESS" ? "default" : "secondary"}>
                        {buyback.status}
                      </Badge>
                      <span className="text-sm">
                        {format(new Date(buyback.executedAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-medium">
                        {parseFloat(buyback.solAmount).toFixed(4)} SOL
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {parseFloat(buyback.fyiAmount).toFixed(2)} FYI
                      </span>
                      {buyback.transactionSignature && (
                        <a
                          href={`https://solscan.io/tx/${buyback.transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          data-testid={`link-tx-${buyback.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {truncateSignature(buyback.transactionSignature)}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
