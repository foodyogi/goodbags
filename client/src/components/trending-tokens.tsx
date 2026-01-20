import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Flame, Heart, TrendingUp, ArrowRight, Clock, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { type LaunchedToken, TOKEN_APPROVAL_STATUS } from "@shared/schema";

interface TrendingTokensProps {
  tokens: LaunchedToken[];
  limit?: number;
}

interface TrendingToken extends LaunchedToken {
  trendScore: number;
  isNew: boolean;
  isHot: boolean;
}

function calculateTrendScore(token: LaunchedToken): number {
  const donations = parseFloat(token.charityDonated || "0");
  const volume = parseFloat(token.tradingVolume || "0");
  const donationCount = token.donationCount || 0;
  
  const launchDate = new Date(token.launchedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
  
  const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / (24 * 7)));
  
  const activityScore = (donationCount * 15) + (donations * 100) + (volume * 20);
  
  const endorsementBonus = token.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED ? 50 : 0;
  
  return (activityScore * recencyMultiplier) + endorsementBonus;
}

function isNewToken(token: LaunchedToken): boolean {
  const launchDate = new Date(token.launchedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
  return hoursAgo < 24;
}

function isHotToken(token: LaunchedToken): boolean {
  const donationCount = token.donationCount || 0;
  const volume = parseFloat(token.tradingVolume || "0");
  return donationCount >= 3 || volume >= 1;
}

function formatSol(value: string | null): string {
  if (!value) return "0";
  const num = parseFloat(value);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 0.001 && num > 0) return "< 0.001";
  return num.toFixed(3);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function TrendingTokenRow({ token, rank }: { token: TrendingToken; rank: number }) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover-elevate"
      data-testid={`trending-row-${token.id}`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold">
        {rank}
      </div>
      
      <Avatar className="h-10 w-10 rounded-lg border border-border">
        <AvatarImage src={token.imageUrl || undefined} alt={token.name} />
        <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold">
          {token.symbol.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate" data-testid={`trending-name-${token.id}`}>{token.name}</p>
          {token.isNew && (
            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600 dark:text-blue-400 shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {token.isHot && (
            <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600 dark:text-orange-400 shrink-0">
              <Flame className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          )}
          {token.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED && (
            <Badge variant="default" className="text-xs bg-green-600 shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Endorsed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" />
            {formatSol(token.charityDonated)} SOL
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {formatSol(token.tradingVolume)} SOL
          </span>
          <span>{formatTimeAgo(new Date(token.launchedAt))}</span>
        </div>
      </div>
      
      <Link href={`/token/${token.mintAddress}`}>
        <Button variant="ghost" size="icon" data-testid={`button-trending-view-${token.id}`}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export function TrendingTokens({ tokens, limit = 5 }: TrendingTokensProps) {
  const liveTokens = tokens.filter(t => !t.isTest);
  
  const trendingTokens: TrendingToken[] = liveTokens
    .map(token => ({
      ...token,
      trendScore: calculateTrendScore(token),
      isNew: isNewToken(token),
      isHot: isHotToken(token),
    }))
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit);
  
  if (trendingTokens.length === 0) {
    return null;
  }
  
  return (
    <Card data-testid="card-trending-tokens">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2" data-testid="title-trending-tokens">
          <Flame className="h-5 w-5 text-orange-500" />
          Trending Now
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {trendingTokens.map((token, index) => (
          <TrendingTokenRow 
            key={token.id} 
            token={token} 
            rank={index + 1}
          />
        ))}
        
        <div className="pt-3 text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" data-testid="button-view-all-trending">
              View All Tokens
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
