import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Heart, TrendingUp, Rocket } from "lucide-react";

interface StatsData {
  totalTokens: number;
  totalDonated: string;
  totalVolume: string;
}

interface StatsCardsProps {
  stats?: StatsData;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Tokens Launched",
      value: stats?.totalTokens ?? 0,
      icon: Rocket,
      suffix: "",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
    },
    {
      title: "Total Donated",
      value: stats?.totalDonated ?? "0",
      icon: Heart,
      suffix: " SOL",
      gradient: "from-pink-500/20 to-pink-500/5",
      iconColor: "text-pink-500",
    },
    {
      title: "Trading Volume",
      value: stats?.totalVolume ?? "0",
      icon: TrendingUp,
      suffix: " SOL",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`bg-gradient-to-br ${card.gradient} border-border/50`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/60">
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                <span className="text-lg font-normal text-muted-foreground">{card.suffix}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
