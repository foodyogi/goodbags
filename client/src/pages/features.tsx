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
  FlaskConical,
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
import goodbagsLogo from "@assets/goodbagsLOGO_1769291918959.png";

const coreFeatures = [
  {
    icon: Rocket,
    title: "Easy Token Launching",
    description: "Create and launch your own Solana memecoin in minutes. Just provide a name, symbol, and image - we handle all the blockchain complexity.",
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
    title: "75+ Verified Charities",
    description: "Choose from over 75 verified charities across 9 countries. Every charity is vetted to ensure donations reach real causes.",
    details: [
      "Categories: hunger, education, health, animals, environment, and more",
      "Charities from USA, UK, India, and 6 more countries",
      "Filter by X account or Solana wallet availability",
      "Real-time charity search with 1.3M+ nonprofits via Change API"
    ],
    color: "bg-pink-500",
  },
  {
    icon: Coins,
    title: "Transparent 1% Fee",
    description: "The lowest fee structure in the space. Just 1% per trade, with 75% going directly to your chosen charity.",
    details: [
      "0.75% goes directly to charity",
      "0.25% funds automatic FYI token buybacks",
      "No hidden fees or creator cuts",
      "All transactions verifiable on blockchain"
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
      "Top Givers: Tokens ranked by total charity donations",
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
      { name: "Generous Giver", desc: "Donate 1+ SOL to charity" },
      { name: "Impact Hero", desc: "Donate 10+ SOL total" },
      { name: "Legendary Philanthropist", desc: "Donate 100+ SOL" },
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
      "Aggregate stats: SOL donated, volume generated",
      "Your earned achievement badges",
      "Personal impact score"
    ],
  },
  {
    icon: Share2,
    title: "Shareable Public Profiles",
    description: "Share your impact with the world. Every creator gets a public profile page.",
    details: [
      "Unique profile URL: goodbags.io/profile/[wallet]",
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
    title: "Charity Endorsement System",
    description: "Our anti-rug pull protection ensures charities approve tokens launched in their name.",
    details: [
      "Charities receive email notifications for new tokens",
      "Charities can officially endorse or deny tokens",
      "Endorsed tokens get a special badge",
      "Denied tokens show warnings to traders",
      "Full audit trail of all decisions"
    ],
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Everything is verifiable on the Solana blockchain.",
    details: [
      "All donations tracked with transaction signatures",
      "Buyback history visible on dashboard",
      "Every charity wallet verified server-side",
      "Audit logs for all platform actions"
    ],
  },
];

const advancedFeatures = [
  {
    icon: FlaskConical,
    title: "Test Mode",
    description: "Try the entire token launch flow without connecting a wallet or spending SOL. Perfect for learning how the platform works.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Twitter,
    title: "X Account Payouts",
    description: "Charities can claim donations via their Twitter/X handle through the Bags.fm claim system - no wallet setup required.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Automatic FYI Buybacks",
    description: "Platform fees automatically purchase FYI tokens every hour, creating continuous buy pressure and platform sustainability.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Code,
    title: "Embeddable Widgets",
    description: "Add impact badges and donation tickers to your own website. Show off your impact anywhere.",
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
          <div className="flex justify-center mb-4">
            <img 
              src={goodbagsLogo} 
              alt="GoodBags Logo" 
              className="h-20 w-20 rounded-xl object-contain"
            />
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
            discover all the features that make GoodBags the best platform for impactful memecoins.
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
