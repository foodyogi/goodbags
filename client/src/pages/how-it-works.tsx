import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Shield, 
  Heart, 
  Coins, 
  TrendingUp, 
  CheckCircle,
  Rocket,
  Lock,
  Eye,
  FileCheck,
  ArrowRight,
  User,
  Wallet,
  AtSign,
  Calculator
} from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";

const steps = [
  {
    step: 1,
    title: "Choose a Verified Charity",
    description: "Select from 75+ verified charities across categories like hunger, environment, education, health, and more.",
    icon: Heart,
    color: "bg-pink-500 dark:bg-pink-600",
  },
  {
    step: 2,
    title: "Set Your Creator Donation %",
    description: "Choose how much of your 0.20% creator share to donate back to charity (0%, 25%, 50%, 75%, or 100%).",
    icon: User,
    color: "bg-blue-500 dark:bg-blue-600",
  },
  {
    step: 3,
    title: "Launch on Solana",
    description: "Your token goes live via Bags with fee settings stored on-chain. Impact settings are locked at launch.",
    icon: Rocket,
    color: "bg-primary",
  },
  {
    step: 4,
    title: "Trading Happens",
    description: "Every trade automatically distributes the 1% fee using your stored split — no manual work needed.",
    icon: TrendingUp,
    color: "bg-secondary",
  },
  {
    step: 5,
    title: "Track Your Impact",
    description: "View proof of donations on-chain. Every transaction is verifiable on Solscan.",
    icon: Eye,
    color: "bg-green-500 dark:bg-green-600",
  },
];

const donationTiers = [
  { donation: "0%", charity: "0.75%", buyback: "0.05%", creator: "0.20%" },
  { donation: "25%", charity: "0.80%", buyback: "0.05%", creator: "0.15%" },
  { donation: "50%", charity: "0.85%", buyback: "0.05%", creator: "0.10%" },
  { donation: "75%", charity: "0.90%", buyback: "0.05%", creator: "0.05%" },
  { donation: "100%", charity: "0.95%", buyback: "0.05%", creator: "0.00%" },
];

const trustFeatures = [
  {
    icon: Eye,
    title: "On-chain verifiable",
    description: "Every transaction recorded on Solana",
  },
  {
    icon: Lock,
    title: "No custody",
    description: "You control your wallet and funds",
  },
  {
    icon: FileCheck,
    title: "Fee settings stored at launch",
    description: "Impact settings locked on-chain",
  },
  {
    icon: Shield,
    title: "Built to reduce scams",
    description: "Verified charities only",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-28 w-28 md:h-40 md:w-40 rounded-2xl object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-how-it-works">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">How It Works</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-how-it-works">
            Launch Purpose-Driven Coins
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            GoodBags makes it easy to launch tokens with built-in charitable giving. 
            Every fee split is stored on-chain and distributed automatically.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">5 Simple Steps</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {steps.map(({ step, title, description, icon: Icon, color }) => (
              <Card key={step} className="relative" data-testid={`step-card-${step}`}>
                <CardContent className="p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-white font-bold text-sm mb-3`}>
                    {step}
                  </div>
                  <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{title}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
              <Heart className="h-3 w-3 mr-1" />
              1% Total Fee
            </Badge>
            <h2 className="text-2xl font-bold mb-3">Fee Splitting Logic</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The 1% platform fee on every trade is split three ways by default. 
              Creators can donate 0-100% of their share to charity at launch.
            </p>
          </div>
          
          <Card className="max-w-3xl mx-auto" data-testid="section-fee-split">
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 dark:bg-pink-600">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Charity</p>
                      <p className="text-sm text-muted-foreground">Goes directly to verified charity chosen at launch</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">0.75%</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">FYI Buyback</p>
                      <p className="text-sm text-muted-foreground">Used to buy back FYI tokens, supporting the ecosystem</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">0.05%</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Token Creator</p>
                      <p className="text-sm text-muted-foreground">Creator's share for launching the token</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">0.20%</Badge>
                </div>

                <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Total per trade: <span className="text-primary">1%</span></p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 text-center">Creator Donation Options</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  At launch, creators choose how much of their 0.20% share to donate to charity:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-donation-tiers">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium">Creator Donates</th>
                        <th className="text-center py-2 px-3 font-medium text-pink-600 dark:text-pink-400">Charity</th>
                        <th className="text-center py-2 px-3 font-medium">Buyback</th>
                        <th className="text-center py-2 px-3 font-medium text-green-600 dark:text-green-400">Creator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donationTiers.map((tier, index) => (
                        <tr key={tier.donation} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="py-2 px-3 font-medium">{tier.donation}</td>
                          <td className="py-2 px-3 text-center text-pink-600 dark:text-pink-400">{tier.charity}</td>
                          <td className="py-2 px-3 text-center text-muted-foreground">{tier.buyback}</td>
                          <td className="py-2 px-3 text-center text-green-600 dark:text-green-400">{tier.creator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" data-testid="section-example-calculation">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Example Calculation</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                If someone trades 100 SOL worth of a token and the creator donates 75%:
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total fee</p>
                  <p className="font-bold text-lg">1 SOL</p>
                </div>
                <div className="p-3 rounded-lg bg-pink-500/10 text-center">
                  <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">Charity receives</p>
                  <p className="font-bold text-lg text-pink-600 dark:text-pink-400">0.90 SOL</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">FYI Buyback</p>
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400">0.05 SOL</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Creator receives</p>
                  <p className="font-bold text-lg text-green-600 dark:text-green-400">0.05 SOL</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Payout Options</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Charities can receive their donations through two verified methods:
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <Card data-testid="payout-direct-wallet">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Direct Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      SOL is sent directly to the charity's verified Solana address. 
                      Funds arrive automatically as trades occur.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="payout-x-claim">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <AtSign className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">X/Twitter Claim</h3>
                    <p className="text-sm text-muted-foreground">
                      Donations are held until the charity verifies via their X account. 
                      They can then claim accumulated funds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16" data-testid="section-trust-transparency">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 mb-4">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Trust & Transparency</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Built for Transparency</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              GoodBags is designed with security and transparency at its core.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustFeatures.map((feature) => (
              <Card 
                key={feature.title} 
                className="text-center"
                data-testid={`trust-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-green-500/10 mb-3">
                    <feature.icon className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" data-testid="section-verify-everything">
            <CardContent className="p-8 text-center">
              <Eye className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-3">Verify Everything Yourself</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Don't just take our word for it. Every transaction, donation, and buyback is publicly 
                verifiable on the Solana blockchain. Click any transaction link to see the proof on Solscan.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/charities">
                  <Button variant="outline" data-testid="link-view-charities">
                    View Verified Charities
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/buyback">
                  <Button variant="outline" data-testid="link-view-buyback">
                    View Buyback Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" data-testid="link-view-tokens">
                    View All Tokens
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Launch your purpose-driven coin today and start generating donations for your chosen cause.
          </p>
          <Link href="/launch">
            <Button size="lg" className="gap-2" data-testid="button-launch-cta">
              <Rocket className="h-5 w-5" />
              Launch a Purpose-Driven Coin
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Powered by <a href="https://bags.fm" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Bags</a>
          </p>
        </section>
      </div>
    </div>
  );
}
