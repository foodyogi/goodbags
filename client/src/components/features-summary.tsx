import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Shield, 
  Share2, 
  FlaskConical, 
  Award,
  ArrowRight,
  Heart,
  TrendingUp
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "75+ Verified Charities",
    description: "Choose from charities across 9 countries, verified with X accounts or Solana wallets",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Trophy,
    title: "Leaderboards & Trending",
    description: "See top givers, most traded tokens, and what's hot right now",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Award,
    title: "Earn Achievements",
    description: "Unlock 10 badges as you launch tokens and grow your impact",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Users,
    title: "My Impact Profile",
    description: "Track your stats, achievements, and share your impact with the community",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Charity Endorsements",
    description: "Anti-rug pull protection - charities can officially endorse tokens",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: FlaskConical,
    title: "Test Mode",
    description: "Try the full launch flow without spending SOL - risk-free experimentation",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function FeaturesSummary() {
  return (
    <section className="py-12 md:py-16" data-testid="section-features-summary">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            More Than Just Token Launching
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            GoodBags is a complete platform for creating impact through memecoins - 
            with gamification, community features, and transparency built in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="p-5 hover-elevate"
              data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${feature.bgColor}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/features">
            <Button variant="outline" className="gap-2" data-testid="button-view-all-features">
              View All Features
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
