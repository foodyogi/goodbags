import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementBadges, calculateAchievements } from "@/components/achievement-badges";
import { TokenCard } from "@/components/token-card";
import { 
  User, 
  Wallet, 
  Trophy, 
  Heart, 
  TrendingUp, 
  Rocket,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { type LaunchedToken, TOKEN_APPROVAL_STATUS } from "@shared/schema";
import { SiX } from "react-icons/si";

function formatSol(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 0.001 && value > 0) return "< 0.001";
  return value.toFixed(3);
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function MyImpactPage() {
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  
  const walletAddress = publicKey?.toBase58();
  
  const { data: allTokens, isLoading } = useQuery<LaunchedToken[]>({
    queryKey: ["/api/tokens"],
  });
  
  const myTokens = allTokens?.filter(t => t.creatorWallet === walletAddress && !t.isTest) || [];
  const achievements = allTokens ? calculateAchievements(allTokens, walletAddress) : [];
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  
  const stats = {
    totalTokens: myTokens.length,
    totalDonated: myTokens.reduce((sum, t) => sum + parseFloat(t.charityDonated || "0"), 0),
    totalVolume: myTokens.reduce((sum, t) => sum + parseFloat(t.tradingVolume || "0"), 0),
    totalDonations: myTokens.reduce((sum, t) => sum + (t.donationCount || 0), 0),
    endorsedTokens: myTokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED).length,
  };
  
  const profileUrl = walletAddress 
    ? `${window.location.origin}/profile/${walletAddress}`
    : "";
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShareTwitter = () => {
    const text = `I've launched ${stats.totalTokens} tokens on @GoodBagsIO and generated ${formatSol(stats.totalDonated)} SOL in charity donations! Check out my impact profile:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };
  
  if (!connected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-connect-wallet">Connect Your Wallet</h2>
              <p className="text-muted-foreground" data-testid="text-connect-wallet-desc">
                Connect your Solana wallet to view your personal impact profile, achievements, and statistics.
              </p>
            </div>
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
  
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-8">
      <Card className="overflow-hidden" data-testid="card-profile-header">
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" data-testid="title-profile">My Impact Profile</h1>
                {stats.endorsedTokens > 0 && (
                  <Badge className="bg-green-600" data-testid="badge-verified-creator">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Verified Creator
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-1" data-testid="text-wallet-address">
                {walletAddress ? truncateAddress(walletAddress) : ""}
              </p>
              
              {unlockedAchievements.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2" data-testid="section-compact-badges">
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
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} data-testid="button-copy-profile-link">
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareTwitter} data-testid="button-share-twitter">
                <SiX className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-tokens-launched">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Rocket className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-tokens-launched">{stats.totalTokens}</p>
                <p className="text-sm text-muted-foreground">Tokens Launched</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-total-donated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-total-donated">{formatSol(stats.totalDonated)}</p>
                <p className="text-sm text-muted-foreground">SOL Donated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-total-volume">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-total-volume">{formatSol(stats.totalVolume)}</p>
                <p className="text-sm text-muted-foreground">SOL Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-achievements">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="value-achievements">{unlockedAchievements.length}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" data-testid="title-my-tokens">
              <Rocket className="h-5 w-5 text-primary" />
              My Tokens ({myTokens.length})
            </h2>
            {myTokens.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No tokens launched yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Launch your first token to start making an impact!
                  </p>
                  <a href="/">
                    <Button data-testid="button-launch-first-token">
                      Launch Your First Token
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myTokens.slice(0, 6).map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            )}
            {myTokens.length > 6 && (
              <div className="text-center mt-4">
                <a href="/dashboard">
                  <Button variant="outline" data-testid="button-view-all-tokens">
                    View All {myTokens.length} Tokens
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
