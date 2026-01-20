import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementBadges, calculateAchievements } from "@/components/achievement-badges";
import { TokenCard } from "@/components/token-card";
import { 
  User, 
  Trophy, 
  Heart, 
  TrendingUp, 
  Rocket,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type LaunchedToken, TOKEN_APPROVAL_STATUS } from "@shared/schema";

function formatSol(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 0.001 && value > 0) return "< 0.001";
  return value.toFixed(3);
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function PublicProfilePage() {
  const params = useParams<{ wallet: string }>();
  const walletAddress = params.wallet;
  
  const { data: allTokens, isLoading } = useQuery<LaunchedToken[]>({
    queryKey: ["/api/tokens"],
  });
  
  const userTokens = allTokens?.filter(t => t.creatorWallet === walletAddress && !t.isTest) || [];
  const achievements = allTokens ? calculateAchievements(allTokens, walletAddress) : [];
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  
  const stats = {
    totalTokens: userTokens.length,
    totalDonated: userTokens.reduce((sum, t) => sum + parseFloat(t.charityDonated || "0"), 0),
    totalVolume: userTokens.reduce((sum, t) => sum + parseFloat(t.tradingVolume || "0"), 0),
    totalDonations: userTokens.reduce((sum, t) => sum + (t.donationCount || 0), 0),
    endorsedTokens: userTokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED).length,
  };
  
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (!walletAddress || userTokens.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-profile-not-found">Profile Not Found</h2>
              <p className="text-muted-foreground" data-testid="text-profile-not-found-desc">
                This creator hasn't launched any tokens on GoodBags yet.
              </p>
            </div>
            <a href="/">
              <Button data-testid="button-go-home">
                Explore GoodBags
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-8">
      <Card className="overflow-hidden" data-testid="card-public-profile-header">
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" data-testid="title-public-profile">Creator Profile</h1>
                {stats.endorsedTokens > 0 && (
                  <Badge className="bg-green-600" data-testid="badge-verified-creator">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Verified Creator
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-1" data-testid="text-public-wallet-address">
                {truncateAddress(walletAddress)}
              </p>
              
              {unlockedAchievements.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2" data-testid="section-public-compact-badges">
                  {unlockedAchievements.slice(0, 6).map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div 
                        key={achievement.id}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border ${achievement.bgColor} ${achievement.borderColor}`}
                        title={achievement.name}
                      >
                        <Icon className={`h-4 w-4 ${achievement.color}`} />
                      </div>
                    );
                  })}
                  {unlockedAchievements.length > 6 && (
                    <Badge variant="secondary">+{unlockedAchievements.length - 6} more</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-public-tokens-launched">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Rocket className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-public-tokens-launched">{stats.totalTokens}</p>
                <p className="text-sm text-muted-foreground">Tokens Launched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-public-total-donated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-public-total-donated">{formatSol(stats.totalDonated)}</p>
                <p className="text-sm text-muted-foreground">SOL Donated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-public-total-volume">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-public-total-volume">{formatSol(stats.totalVolume)}</p>
                <p className="text-sm text-muted-foreground">SOL Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-public-achievements">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-public-achievements">{unlockedAchievements.length}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" data-testid="title-public-tokens">
              <Rocket className="h-5 w-5 text-primary" />
              Launched Tokens ({userTokens.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {userTokens.slice(0, 6).map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
            {userTokens.length > 6 && (
              <div className="text-center mt-4">
                <a href="/dashboard">
                  <Button variant="outline" data-testid="button-view-all-public-tokens">
                    View All {userTokens.length} Tokens
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <AchievementBadges tokens={allTokens || []} walletAddress={walletAddress} />
        </div>
      </div>
    </div>
  );
}
