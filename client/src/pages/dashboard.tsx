import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { StatsCards } from "@/components/stats-cards";
import { TokensGrid } from "@/components/tokens-grid";
import { DonationTracker } from "@/components/donation-tracker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Wallet, Rocket, Coins, TrendingUp, Heart, FlaskConical, Zap } from "lucide-react";
import { Link } from "wouter";
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

type TokenFilter = "all" | "live" | "test";

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");

  const { data: globalData, isLoading: globalLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { data: myTokens, isLoading: myTokensLoading } = useQuery<LaunchedToken[]>({
    queryKey: ["/api/tokens/creator", walletAddress],
    enabled: !!walletAddress,
  });

  // Filter tokens based on selected filter
  const filteredMyTokens = useMemo(() => {
    if (!myTokens) return undefined;
    switch (tokenFilter) {
      case "live":
        return myTokens.filter(t => !t.isTest);
      case "test":
        return myTokens.filter(t => t.isTest);
      default:
        return myTokens;
    }
  }, [myTokens, tokenFilter]);

  const filteredGlobalTokens = useMemo(() => {
    if (!globalData?.tokens) return undefined;
    switch (tokenFilter) {
      case "live":
        return globalData.tokens.filter(t => !t.isTest);
      case "test":
        return globalData.tokens.filter(t => t.isTest);
      default:
        return globalData.tokens;
    }
  }, [globalData?.tokens, tokenFilter]);

  // Count live vs test tokens for badges
  const liveTokenCount = myTokens?.filter(t => !t.isTest).length ?? 0;
  const testTokenCount = myTokens?.filter(t => t.isTest).length ?? 0;

  const myDonations = globalData?.donations?.filter(d => 
    myTokens?.some(t => t.mintAddress === d.tokenMint)
  ) ?? [];

  const myStats = filteredMyTokens ? {
    totalTokens: filteredMyTokens.length,
    totalDonated: filteredMyTokens.reduce((sum, t) => sum + parseFloat(t.charityDonated || "0"), 0).toFixed(4),
    totalVolume: filteredMyTokens.reduce((sum, t) => sum + parseFloat(t.tradingVolume || "0"), 0).toFixed(4),
  } : null;

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-dashboard">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your launched tokens, trading volume, and blockchain-verified donations
            </p>
          </div>
          <Link href="/">
            <Button className="gap-2" data-testid="button-launch-new">
              <Rocket className="h-4 w-4" />
              Launch New Token
            </Button>
          </Link>
        </div>

        {connected ? (
          <Tabs defaultValue="my-tokens" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList data-testid="tabs-dashboard">
                <TabsTrigger value="my-tokens" className="gap-2" data-testid="tab-my-tokens">
                  <Wallet className="h-4 w-4" />
                  My Tokens
                  {myTokens && myTokens.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{myTokens.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all-tokens" className="gap-2" data-testid="tab-all-tokens">
                  <Coins className="h-4 w-4" />
                  All Tokens
                </TabsTrigger>
              </TabsList>
              <p className="text-sm text-muted-foreground hidden md:block">
                Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </p>
            </div>

            <TabsContent value="my-tokens" className="space-y-8">
              {myTokensLoading ? (
                <TokensGrid tokens={undefined} isLoading={true} />
              ) : myTokens && myTokens.length > 0 ? (
                <>
                  {/* Live/Test Filter Toggle */}
                  {(liveTokenCount > 0 || testTokenCount > 0) && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-muted-foreground">Show:</span>
                      <ToggleGroup 
                        type="single" 
                        value={tokenFilter} 
                        onValueChange={(v) => v && setTokenFilter(v as TokenFilter)}
                        data-testid="toggle-token-filter"
                      >
                        <ToggleGroupItem value="all" className="gap-2" data-testid="filter-all">
                          All
                          <Badge variant="secondary" className="text-xs">{myTokens.length}</Badge>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="live" className="gap-2" data-testid="filter-live">
                          <Zap className="h-3 w-3" />
                          Live
                          <Badge variant="secondary" className="text-xs">{liveTokenCount}</Badge>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="test" className="gap-2" data-testid="filter-test">
                          <FlaskConical className="h-3 w-3" />
                          Test
                          <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-600 dark:text-purple-400">{testTokenCount}</Badge>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card data-testid="stat-my-tokens">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Coins className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {tokenFilter === "test" ? "Test Tokens" : tokenFilter === "live" ? "Live Tokens" : "My Tokens"}
                            </p>
                            <p className="text-2xl font-bold">{myStats?.totalTokens}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card data-testid="stat-my-volume">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                            <TrendingUp className="h-6 w-6 text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Volume</p>
                            <p className="text-2xl font-bold">{myStats?.totalVolume} SOL</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card data-testid="stat-my-donated">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10">
                            <Heart className="h-6 w-6 text-pink-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Donated</p>
                            <p className="text-2xl font-bold">{myStats?.totalDonated} SOL</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">
                          {tokenFilter === "test" ? "My Test Tokens" : tokenFilter === "live" ? "My Live Tokens" : "My Launched Tokens"}
                        </h2>
                        <Badge variant="outline">{filteredMyTokens?.length ?? 0} token{filteredMyTokens?.length !== 1 ? "s" : ""}</Badge>
                      </div>
                      <TokensGrid tokens={filteredMyTokens} isLoading={myTokensLoading} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4">My Donations</h2>
                      <DonationTracker donations={myDonations} isLoading={globalLoading} />
                    </div>
                  </div>
                </>
              ) : (
                <Card className="border-dashed" data-testid="card-no-tokens">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Coins className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No tokens launched yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Launch your first memecoin to support charities and see your impact here!
                    </p>
                    <Link href="/">
                      <Button className="gap-2" data-testid="button-empty-launch">
                        <Rocket className="h-4 w-4" />
                        Launch Your First Token
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="all-tokens" className="space-y-8">
              <StatsCards stats={globalData?.stats} isLoading={globalLoading} />
              
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">All Launched Tokens</h2>
                  <TokensGrid tokens={filteredGlobalTokens} isLoading={globalLoading} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
                  <DonationTracker donations={globalData?.donations} isLoading={globalLoading} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <Card className="border-primary/20 bg-primary/5" data-testid="card-connect-wallet">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-lg font-semibold mb-1">Connect your wallet to see your tokens</h3>
                    <p className="text-muted-foreground">
                      Connect your Solana wallet to view tokens you've launched and track your charity impact.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <StatsCards stats={globalData?.stats} isLoading={globalLoading} />

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">All Launched Tokens</h2>
                <TokensGrid tokens={globalData?.tokens} isLoading={globalLoading} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
                <DonationTracker donations={globalData?.donations} isLoading={globalLoading} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
