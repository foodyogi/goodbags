import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, TrendingUp, Trophy, Sparkles, Target } from "lucide-react";

interface CommunityImpactProps {
  tokenName: string;
  tokenSymbol: string;
  charityName: string | null;
  totalDonated: string;
  donationCount: number;
  isApproved?: boolean;
}

function formatSol(value: string | null | undefined): string {
  if (!value) return "0";
  const num = parseFloat(value);
  if (num === 0) return "0";
  if (num < 0.001) return "< 0.001";
  if (num < 1) return num.toFixed(4);
  return num.toFixed(2);
}

function formatUsd(solAmount: string): string {
  const sol = parseFloat(solAmount) || 0;
  const usdValue = sol * 150;
  if (usdValue < 1) return "< $1";
  if (usdValue < 1000) return `~$${usdValue.toFixed(0)}`;
  return `~$${(usdValue / 1000).toFixed(1)}K`;
}

function getMilestoneProgress(donated: number): { current: number; next: number; label: string } {
  const milestones = [
    { threshold: 0.1, label: "First Steps" },
    { threshold: 1, label: "Getting Started" },
    { threshold: 10, label: "Growing Impact" },
    { threshold: 50, label: "Community Champion" },
    { threshold: 100, label: "Impact Leader" },
    { threshold: 500, label: "Charity Hero" },
    { threshold: 1000, label: "Legendary" },
  ];
  
  for (let i = 0; i < milestones.length; i++) {
    if (donated < milestones[i].threshold) {
      const prev = i > 0 ? milestones[i - 1].threshold : 0;
      return {
        current: donated,
        next: milestones[i].threshold,
        label: milestones[i].label,
      };
    }
  }
  
  return {
    current: donated,
    next: donated,
    label: "Legendary",
  };
}

export function CommunityImpact({ 
  tokenName, 
  tokenSymbol, 
  charityName, 
  totalDonated, 
  donationCount,
  isApproved 
}: CommunityImpactProps) {
  const donatedNum = parseFloat(totalDonated) || 0;
  const milestone = getMilestoneProgress(donatedNum);
  const progress = milestone.next > 0 ? Math.min((milestone.current / milestone.next) * 100, 100) : 100;

  return (
    <Card className="overflow-hidden" data-testid="card-community-impact">
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-1">
        <CardHeader className="bg-card rounded-t-lg pb-3">
          <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-community-impact">
            <Users className="h-5 w-5 text-purple-500" />
            Community Impact
            {isApproved && (
              <Badge variant="default" className="bg-green-600 ml-auto" data-testid="badge-charity-endorsed">
                <Sparkles className="h-3 w-3 mr-1" />
                Charity Endorsed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="pt-4 space-y-6">
        <div className="text-center py-4 rounded-lg bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/10" data-testid="section-donation-summary">
          <p className="text-sm text-muted-foreground mb-1" data-testid="text-donation-intro">
            Together, the ${tokenSymbol} community has donated
          </p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
            <span className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent" data-testid="text-community-donated">
              {formatSol(totalDonated)} SOL
            </span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-usd-equivalent">
            {formatUsd(totalDonated)} USD equivalent
          </p>
          {charityName && (
            <p className="text-sm font-medium mt-2" data-testid="text-charity-name">
              to <span className="text-pink-600">{charityName}</span>
            </p>
          )}
        </div>

        <div className="space-y-2" data-testid="section-milestone-progress">
          <div className="flex justify-between items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground" data-testid="text-next-milestone">
              <Target className="h-4 w-4" />
              Next Milestone: {milestone.label}
            </span>
            <span className="font-medium" data-testid="text-milestone-target">{milestone.next} SOL</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-milestone" />
          <p className="text-xs text-center text-muted-foreground" data-testid="text-sol-to-go">
            {(milestone.next - milestone.current).toFixed(2)} SOL to go!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30" data-testid="stat-donations-made">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-500">
              <TrendingUp className="h-5 w-5" />
              {donationCount}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-donations-made-label">Donations Made</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30" data-testid="stat-milestone-status">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-purple-500">
              <Trophy className="h-5 w-5" />
              {milestone.label.split(" ")[0]}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-milestone-status-label">Milestone Status</p>
          </div>
        </div>

        {donationCount > 0 && (
          <div className="text-center pt-2 border-t" data-testid="section-donation-cta">
            <p className="text-sm text-muted-foreground" data-testid="text-donation-cta">
              Every trade with ${tokenSymbol} automatically donates to charity.
            </p>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-donation-cta-secondary">
              Be part of the movement. Trade to donate more!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
