import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Heart, TrendingUp, Medal, Crown, Award, Flame, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { type LaunchedToken } from "@shared/schema";

interface TokenLeaderboardProps {
  tokens: LaunchedToken[];
  limit?: number;
}

type LeaderboardType = "donations" | "volume" | "hot";

interface RankedToken extends LaunchedToken {
  rank: number;
  score: number;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getRankBadgeStyle(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400";
    case 2:
      return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-gray-300";
    case 3:
      return "bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500";
    default:
      return "";
  }
}

function formatSol(value: string | null): string {
  if (!value) return "0";
  const num = parseFloat(value);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 0.001 && num > 0) return "< 0.001";
  return num.toFixed(3);
}

function calculateHotScore(token: LaunchedToken): number {
  const donations = parseFloat(token.charityDonated || "0");
  const volume = parseFloat(token.tradingVolume || "0");
  const donationCount = token.donationCount || 0;
  
  const launchDate = new Date(token.launchedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
  
  const recencyBonus = Math.max(0, 100 - hoursAgo);
  const activityScore = donationCount * 10;
  const valueScore = (donations * 100) + (volume * 10);
  
  return recencyBonus + activityScore + valueScore;
}

function LeaderboardRow({ token, type }: { token: RankedToken; type: LeaderboardType }) {
  const isTopThree = token.rank <= 3;
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isTopThree ? "bg-muted/50" : "hover-elevate"
      }`}
      data-testid={`leaderboard-row-${token.id}`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
        isTopThree ? getRankBadgeStyle(token.rank) : "bg-muted"
      }`}>
        {getRankIcon(token.rank)}
      </div>
      
      <Avatar className="h-10 w-10 rounded-lg border border-border">
        <AvatarImage src={token.imageUrl || undefined} alt={token.name} />
        <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold">
          {token.symbol.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate" data-testid={`leaderboard-name-${token.id}`}>{token.name}</p>
          <Badge variant="secondary" className="font-mono text-xs shrink-0">
            {token.symbol}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {token.charityName || "Community Token"}
        </p>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          {type === "donations" && <Heart className="h-3 w-3 text-pink-500" />}
          {type === "volume" && <TrendingUp className="h-3 w-3 text-green-500" />}
          {type === "hot" && <Flame className="h-3 w-3 text-orange-500" />}
          <span className="font-bold" data-testid={`leaderboard-score-${token.id}`}>
            {type === "hot" 
              ? Math.round(token.score).toLocaleString()
              : `${formatSol(type === "donations" ? token.charityDonated : token.tradingVolume)} SOL`
            }
          </span>
        </div>
        {type === "donations" && (
          <p className="text-xs text-muted-foreground">
            {token.donationCount || 0} donations
          </p>
        )}
      </div>
      
      <Link href={`/token/${token.mintAddress}`}>
        <Button variant="ghost" size="icon" data-testid={`button-leaderboard-view-${token.id}`}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export function TokenLeaderboard({ tokens, limit = 10 }: TokenLeaderboardProps) {
  const liveTokens = tokens.filter(t => !t.isTest);
  
  const getRankedTokens = (type: LeaderboardType): RankedToken[] => {
    let sorted: LaunchedToken[];
    
    switch (type) {
      case "donations":
        sorted = [...liveTokens].sort((a, b) => 
          parseFloat(b.charityDonated || "0") - parseFloat(a.charityDonated || "0")
        );
        break;
      case "volume":
        sorted = [...liveTokens].sort((a, b) => 
          parseFloat(b.tradingVolume || "0") - parseFloat(a.tradingVolume || "0")
        );
        break;
      case "hot":
        sorted = [...liveTokens].sort((a, b) => 
          calculateHotScore(b) - calculateHotScore(a)
        );
        break;
    }
    
    return sorted.slice(0, limit).map((token, index) => ({
      ...token,
      rank: index + 1,
      score: type === "hot" ? calculateHotScore(token) : 0,
    }));
  };

  if (liveTokens.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-token-leaderboard">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2" data-testid="title-token-leaderboard">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Token Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="donations" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="donations" className="gap-1" data-testid="tab-donations">
              <Heart className="h-3 w-3" />
              Top Givers
            </TabsTrigger>
            <TabsTrigger value="volume" className="gap-1" data-testid="tab-volume">
              <TrendingUp className="h-3 w-3" />
              Most Traded
            </TabsTrigger>
            <TabsTrigger value="hot" className="gap-1" data-testid="tab-hot">
              <Flame className="h-3 w-3" />
              Hot Now
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="donations" className="space-y-1 mt-0">
            {getRankedTokens("donations").map((token) => (
              <LeaderboardRow key={token.id} token={token} type="donations" />
            ))}
          </TabsContent>
          
          <TabsContent value="volume" className="space-y-1 mt-0">
            {getRankedTokens("volume").map((token) => (
              <LeaderboardRow key={token.id} token={token} type="volume" />
            ))}
          </TabsContent>
          
          <TabsContent value="hot" className="space-y-1 mt-0">
            {getRankedTokens("hot").map((token) => (
              <LeaderboardRow key={token.id} token={token} type="hot" />
            ))}
            <p className="text-xs text-center text-muted-foreground pt-2" data-testid="text-hot-explanation">
              Hot score combines recent activity, donations, and trading volume
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
