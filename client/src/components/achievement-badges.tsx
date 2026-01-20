import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Rocket, 
  Star, 
  Flame, 
  Crown, 
  Heart, 
  Zap, 
  Shield, 
  Sparkles,
  Trophy,
  Target,
  Award,
  Medal
} from "lucide-react";
import { type LaunchedToken, TOKEN_APPROVAL_STATUS } from "@shared/schema";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Rocket;
  color: string;
  bgColor: string;
  borderColor: string;
  requirement: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementBadgesProps {
  tokens: LaunchedToken[];
  walletAddress?: string;
  compact?: boolean;
}

export function calculateAchievements(tokens: LaunchedToken[], walletAddress?: string): Achievement[] {
  const userTokens = walletAddress 
    ? tokens.filter(t => t.creatorWallet === walletAddress && !t.isTest)
    : tokens.filter(t => !t.isTest);
  
  const totalDonated = userTokens.reduce((sum, t) => sum + parseFloat(t.charityDonated || "0"), 0);
  const totalVolume = userTokens.reduce((sum, t) => sum + parseFloat(t.tradingVolume || "0"), 0);
  const totalDonationCount = userTokens.reduce((sum, t) => sum + (t.donationCount || 0), 0);
  const approvedTokens = userTokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED).length;
  
  return [
    {
      id: "first-launch",
      name: "First Launch",
      description: "Launch your first token on GoodBags",
      icon: Rocket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      requirement: "Launch 1 token",
      unlocked: userTokens.length >= 1,
      progress: userTokens.length,
      maxProgress: 1,
    },
    {
      id: "serial-launcher",
      name: "Serial Launcher",
      description: "Launch 5 or more tokens",
      icon: Zap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      requirement: "Launch 5 tokens",
      unlocked: userTokens.length >= 5,
      progress: userTokens.length,
      maxProgress: 5,
    },
    {
      id: "generous-giver",
      name: "Generous Giver",
      description: "Generate 1 SOL in charity donations",
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      requirement: "1 SOL donated",
      unlocked: totalDonated >= 1,
      progress: Math.min(totalDonated, 1),
      maxProgress: 1,
    },
    {
      id: "impact-hero",
      name: "Impact Hero",
      description: "Generate 10 SOL in charity donations",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      requirement: "10 SOL donated",
      unlocked: totalDonated >= 10,
      progress: Math.min(totalDonated, 10),
      maxProgress: 10,
    },
    {
      id: "legendary-philanthropist",
      name: "Legendary Philanthropist",
      description: "Generate 100 SOL in charity donations",
      icon: Crown,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      requirement: "100 SOL donated",
      unlocked: totalDonated >= 100,
      progress: Math.min(totalDonated, 100),
      maxProgress: 100,
    },
    {
      id: "volume-driver",
      name: "Volume Driver",
      description: "Generate 10 SOL in trading volume",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      requirement: "10 SOL volume",
      unlocked: totalVolume >= 10,
      progress: Math.min(totalVolume, 10),
      maxProgress: 10,
    },
    {
      id: "market-maker",
      name: "Market Maker",
      description: "Generate 100 SOL in trading volume",
      icon: Trophy,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      requirement: "100 SOL volume",
      unlocked: totalVolume >= 100,
      progress: Math.min(totalVolume, 100),
      maxProgress: 100,
    },
    {
      id: "community-builder",
      name: "Community Builder",
      description: "Receive 10 donations across your tokens",
      icon: Target,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      requirement: "10 donations received",
      unlocked: totalDonationCount >= 10,
      progress: totalDonationCount,
      maxProgress: 10,
    },
    {
      id: "charity-endorsed",
      name: "Charity Endorsed",
      description: "Get a token officially endorsed by a charity",
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      requirement: "1 endorsed token",
      unlocked: approvedTokens >= 1,
      progress: approvedTokens,
      maxProgress: 1,
    },
    {
      id: "trusted-creator",
      name: "Trusted Creator",
      description: "Get 3 tokens officially endorsed by charities",
      icon: Award,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      requirement: "3 endorsed tokens",
      unlocked: approvedTokens >= 3,
      progress: approvedTokens,
      maxProgress: 3,
    },
  ];
}

function AchievementBadge({ achievement, compact }: { achievement: Achievement; compact?: boolean }) {
  const Icon = achievement.icon;
  
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
              achievement.unlocked 
                ? `${achievement.bgColor} ${achievement.borderColor}` 
                : "bg-muted/30 border-muted opacity-40 grayscale"
            }`}
            data-testid={`badge-achievement-${achievement.id}`}
          >
            <Icon className={`h-5 w-5 ${achievement.unlocked ? achievement.color : "text-muted-foreground"}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {!achievement.unlocked && achievement.progress !== undefined && (
              <p className="text-xs text-muted-foreground">
                Progress: {achievement.progress.toFixed(2)} / {achievement.maxProgress}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        achievement.unlocked 
          ? `${achievement.bgColor} ${achievement.borderColor}` 
          : "bg-muted/10 border-muted/30 opacity-60"
      }`}
      data-testid={`card-achievement-${achievement.id}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
        achievement.unlocked ? achievement.bgColor : "bg-muted/30"
      } ${achievement.unlocked ? "" : "grayscale"}`}>
        <Icon className={`h-6 w-6 ${achievement.unlocked ? achievement.color : "text-muted-foreground"}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium ${achievement.unlocked ? "" : "text-muted-foreground"}`} data-testid={`text-achievement-name-${achievement.id}`}>
            {achievement.name}
          </p>
          {achievement.unlocked && (
            <Sparkles className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground" data-testid={`text-achievement-desc-${achievement.id}`}>
          {achievement.description}
        </p>
        {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
          <div className="mt-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full ${achievement.bgColor.replace('/10', '/50')}`}
                style={{ width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {achievement.progress.toFixed(2)} / {achievement.maxProgress} {achievement.requirement.split(" ").slice(-1)[0]}
            </p>
          </div>
        )}
      </div>
      
      {achievement.unlocked && (
        <Badge variant="default" className="bg-green-600 shrink-0">
          Unlocked
        </Badge>
      )}
    </div>
  );
}

export function AchievementBadges({ tokens, walletAddress, compact = false }: AchievementBadgesProps) {
  const achievements = calculateAchievements(tokens, walletAddress);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  if (compact) {
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    
    if (unlockedAchievements.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2" data-testid="badges-compact">
        {unlockedAchievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} compact />
        ))}
      </div>
    );
  }
  
  return (
    <Card data-testid="card-achievements">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between" data-testid="title-achievements">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-yellow-500" />
            Achievements
          </div>
          <Badge variant="secondary" data-testid="badge-achievement-count">
            {unlockedCount} / {achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </CardContent>
    </Card>
  );
}
