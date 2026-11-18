import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Trophy, 
  Award, 
  Users, 
  Shield, 
  Share2,
  Globe,
  TrendingUp,
  Rocket,
  CheckCircle,
  Coins,
  Twitter,
  Code,
  Eye,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";
import {
  NEW_LAUNCH_MAX_CHARITY_PERCENT,
  NEW_LAUNCH_MIN_CHARITY_PERCENT,
  NEW_LAUNCH_SPLITS,
  formatPercent,
} from "@shared/feeSplit";

const coreFeatures = [
  {
    icon: Rocket,
    title: "Easy Token Launching",
    description: "Create and launch your own Solana charity coin in minutes. Just provide a name, symbol and image, and we handle the blockchain complexity.",
    details: [
      "No coding required",
      "Automatic metadata creation",
      "Instant liquidity on Meteora",
      "Built-in trading fees for charity"
    ],
    color: "bg-primary",
  },
  {
    icon: Heart,
    title: "Charity Directory",
    description: "Pick a charity that has completed onboarding. US nonprofits onboard through our application, which checks the organization's EIN through Every.org, then its email and its Solana wallet or X account, before manual approval.",
    details: [
      "Categories: hunger, education, health, animals, environment, and more",
      "The directory also lists nonprofits from public records, which can't be chosen until they onboard",
      "Self-serve registration is for US nonprofits with an EIN listed on Every.org",
      "Search more nonprofits with Solana wallets through the Change API"
    ],
    color: "bg-pink-500",
  },
  {
    icon: Coins,
    title: "Transparent Fee Split",
    description: `On a new coin, at least ${NEW_LAUNCH_MIN_CHARITY_PERCENT}% of shared trading fees go to your chosen charity, up to ${NEW_LAUNCH_MAX_CHARITY_PERCENT}% if you donate your full creator share.`,
    details: [
      `Charity: ${formatPercent(NEW_LAUNCH_SPLITS[0].charityPercent)} to ${formatPercent(NEW_LAUNCH_SPLITS[NEW_LAUNCH_SPLITS.length - 1].charityPercent)} of shared fees`,
      `FYI buyback: ${formatPercent(NEW_LAUNCH_SPLITS[0].buybackPercent)}, reserved for FYI token buybacks (none executed yet)`,
      `Creator: ${formatPercent(NEW_LAUNCH_SPLITS[NEW_LAUNCH_SPLITS.length - 1].creatorPercent)} to ${formatPercent(NEW_LAUNCH_SPLITS[0].creatorPercent)}, including the 25% Bags.fm pays the deployer`,
      "The split is written into the coin's on-chain fee config at launch"
    ],
    color: "bg-green-500",
  },
];

const gamificationFeatures = [
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Compete and track top performers across multiple categories.",
    details: [
      "Top Charity Share: coins ranked by charity share earned",
      "Most Traded: Highest volume tokens",
      "Hot Now: Trending based on recent activity",
      "Real-time updates as trades happen"
    ],
  },
  {
    icon: Award,
    title: "Achievement Badges",
    description: "Unlock 10 unique achievements as you grow your impact on the platform.",
    badges: [
      { name: "First Launch", desc: "Launch your first token" },
      { name: "Serial Launcher", desc: "Launch 5+ tokens" },
      { name: "Generous Giver", desc: "Your coins earn charities 1+ SOL" },
      { name: "Impact Hero", desc: "Your coins earn charities 10+ SOL" },
      { name: "Legendary Philanthropist", desc: "Your coins earn charities 100+ SOL" },
      { name: "Volume Driver", desc: "Generate 10+ SOL in trading volume" },
      { name: "Market Maker", desc: "Generate 100+ SOL volume" },
      { name: "Community Builder", desc: "Have tokens with 10+ unique traders" },
      { name: "Charity Endorsed", desc: "Get a token endorsed by a charity" },
      { name: "Trusted Creator", desc: "Have 3+ endorsed tokens" },
    ],
  },
  {
    icon: TrendingUp,
    title: "Trending Tokens",
    description: "Discover what's hot right now with our real-time trending algorithm.",
    details: [
      "'New' badge for tokens launched within 24 hours",
      "'Hot' badge for high-activity tokens",
      "Algorithm combines recency, activity, and value metrics",
      "Quick stats and time-ago display"
    ],
  },
];

const personalFeatures = [
  {
    icon: Users,
    title: "My Impact Profile",
    description: "Your personal dashboard showing everything you've accomplished on GoodBags.",
    details: [
      "All your launched tokens in one place",
      "Aggregate stats: charity share earned, launch buy volume",
      "Your earned achievement badges",
      "Personal impact score"
    ],
  },
  {
    icon: Share2,
    title: "Shareable Public Profiles",
    description: "Share your impact with the world. Every creator gets a public profile page.",
    details: [
      "Unique profile URL: goodbags.tech/profile/[wallet]",
      "Shows all your tokens and achievements",
      "One-click sharing to Twitter/X",
      "Perfect for building social proof"
    ],
  },
  {
    icon: Twitter,
    title: "Social Sharing",
    description: "Built-in tools to celebrate and share your milestones.",
    details: [
      "Share token launches on Twitter/X",
      "Share charity endorsements",
      "Share impact milestones",
      "Pre-filled tweets for easy posting"
    ],
  },
];

const securityFeatures = [
  {
    icon: Shield,
    title: "Charity Approval Portal",
    description: "Charities can approve or deny coins launched in their name after verifying with their official X account.",
    details: [
      "Charities verify identity via X (Twitter) OAuth",
      "Dedicated portal for reviewing token details",
      "Charities can officially endorse or deny tokens",
      "Endorsed tokens display an endorsement badge",
      "Denied tokens show clear warnings to traders",
      "Full audit trail of all approval decisions"
    ],
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Everything is verifiable on the Solana blockchain.",
    details: [
      "Every charity fee claim listed with its Solscan transaction",
      "Buyback page shows that no buybacks have been executed yet",
      "Every charity wallet verified server-side",
      "Audit logs for all platform actions"
    ],
  },
];

const advancedFeatures = [
  {
    icon: Twitter,
    title: "X Account Payouts",
    description: "Charities can claim their share with their X account through the Bags.fm claim system, no wallet setup required.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "FYI Buyback Share",
    description: "A share of each coin's fees is reserved for FYI token buybacks. None have been executed yet.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Code,
    title: "Embeddable Widgets",
    description: "Add impact badges and tickers to your own website. Show off your impact anywhere.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Globe,
    title: "Dual Platform Visibility",
    description: "Your tokens appear on both GoodBags and Bags.fm, doubling your exposure and trading volume.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-28 w-28 md:h-40 md:w-40 rounded-2xl object-contain" />
          </div>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Platform Features
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-features">
            Everything GoodBags Offers
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From token launching to gamification, transparency to community building - 
            discover the features that make GoodBags charity fundraising infrastructure on Solana.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Core Features
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {coreFeatures.map((feature) => (
              <Card key={feature.title} className="h-full" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${feature.color} text-white mb-3`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Gamification & Engagement
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {gamificationFeatures.map((feature) => (
              <Card key={feature.title} className="h-full" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 mb-3">
                    <feature.icon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  {feature.details && (
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {feature.badges && (
                    <div className="flex flex-wrap gap-1.5">
                      {feature.badges.map((badge) => (
                        <Badge 
                          key={badge.name} 
                          variant="outline" 
                          className="text-xs"
                          title={badge.desc}
                        >
                          {badge.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Personal & Social Features
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {personalFeatures.map((feature) => (
              <Card key={feature.title} className="h-full" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-3">
                    <feature.icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-500" />
            Security & Trust
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {securityFeatures.map((feature) => (
              <Card key={feature.title} className="h-full" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-3">
                    <feature.icon className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-500" />
            Advanced Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {advancedFeatures.map((feature) => (
              <Card key={feature.title} className="p-5" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
        </section>

        <section className="text-center">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Launch your first impact token today and join the community of creators making a difference.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="gap-2" data-testid="button-launch-token">
                  <Rocket className="h-5 w-5" />
                  Launch Your Token
                </Button>
              </Link>
              <Link href="/my-impact">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-view-impact">
                  <Users className="h-5 w-5" />
                  View My Impact
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
