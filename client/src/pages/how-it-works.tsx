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
import { NEW_LAUNCH_SPLITS, formatPercent } from "@shared/feeSplit";

const NO_DONATION = NEW_LAUNCH_SPLITS[0];
const FULL_DONATION = NEW_LAUNCH_SPLITS[NEW_LAUNCH_SPLITS.length - 1];
const EXAMPLE = NEW_LAUNCH_SPLITS.find((s) => s.tier === 75)!;
const sol = (percent: number) => `${Number((percent / 100).toFixed(4))} SOL`;

const steps = [
  {
    step: 1,
    title: "Choose an Onboarded Charity",
    description: "Pick a charity that has completed onboarding through our application, which checks US nonprofits by EIN through Every.org.",
    icon: Heart,
    color: "bg-pink-500 dark:bg-pink-600",
  },
  {
    step: 2,
    title: "Set Your Creator Donation %",
    description: "Choose how much of your creator share to donate to charity: 0%, 25%, 50%, 75% or 100%.",
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
    description: "Each trade adds to the coin's shared fees, which are split by the settings written on-chain at launch. No manual work needed.",
    icon: TrendingUp,
    color: "bg-secondary",
  },
  {
    step: 5,
    title: "Track Your Impact",
    description: "See the charity's verified on-chain fee claims, each with a Solscan link.",
    icon: Eye,
    color: "bg-green-500 dark:bg-green-600",
  },
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
    title: "Charity endorsement",
    description: "Charities can approve coins in their name via X",
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
              Fee split for new launches
            </Badge>
            <h2 className="text-2xl font-bold mb-3">Fee Splitting Logic</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bags.fm pays 25% of a coin's shared trading fees to the wallet that deploys it, which on GoodBags
              is the creator. The GoodBags split, configured at launch and enforced on-chain, covers the other 75%.
              These are the effective shares of the coin's shared fees.
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
                      <p className="text-sm text-muted-foreground">Claimed on-chain by the charity chosen at launch</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
                    {formatPercent(NO_DONATION.charityPercent)} to {formatPercent(FULL_DONATION.charityPercent)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">FYI Buyback</p>
                      <p className="text-sm text-muted-foreground">Reserved for FYI token buybacks. None have been executed yet.</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    {formatPercent(NO_DONATION.buybackPercent)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Token Creator</p>
                      <p className="text-sm text-muted-foreground">Creator's share, including the 25% deployer share</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    {formatPercent(FULL_DONATION.creatorPercent)} to {formatPercent(NO_DONATION.creatorPercent)}
                  </Badge>
                </div>

                <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground text-center">
                    Coins launched before September 2026 keep their original on-chain split with no deployer share,
                    for example 75% charity, 5% buyback and 20% creator.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 text-center">Creator Donation Options</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  At launch, creators choose how much of their share to donate to charity. The creator column includes the 25% deployer share.
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
                      {NEW_LAUNCH_SPLITS.map((tier, index) => (
                        <tr key={tier.tier} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="py-2 px-3 font-medium">{tier.tier}%</td>
                          <td className="py-2 px-3 text-center text-pink-600 dark:text-pink-400">{formatPercent(tier.charityPercent)}</td>
                          <td className="py-2 px-3 text-center text-muted-foreground">{formatPercent(tier.buybackPercent)}</td>
                          <td className="py-2 px-3 text-center text-green-600 dark:text-green-400">{formatPercent(tier.creatorPercent)}</td>
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
                If a new coin earns 1 SOL in shared trading fees and the creator donated 75% of their share:
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Shared fees</p>
                  <p className="font-bold text-lg">1 SOL</p>
                </div>
                <div className="p-3 rounded-lg bg-pink-500/10 text-center">
                  <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">Charity receives</p>
                  <p className="font-bold text-lg text-pink-600 dark:text-pink-400">{sol(EXAMPLE.charityPercent)}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">FYI Buyback</p>
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{sol(EXAMPLE.buybackPercent)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Creator receives (incl. deployer share)</p>
                  <p className="font-bold text-lg text-green-600 dark:text-green-400">{sol(EXAMPLE.creatorPercent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Payout Options</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The charity's share builds up in the coin's fee config. Charities claim it on Bags.fm in one of two ways:
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
                      The charity's verified Solana address is written into the fee split, and the charity
                      claims its share on Bags.fm with that wallet.
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
                      Bags.fm links the charity's X account to a wallet. The charity logs in with X and
                      claims its accumulated share.
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
                Don't just take our word for it. Every fee split and every charity fee claim is publicly
                verifiable on the Solana blockchain. Click any transaction link to see the proof on Solscan.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/charities">
                  <Button variant="outline" data-testid="link-view-charities">
                    View the Charity Directory
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
            Launch a charity coin today and its fee split starts earning for your chosen cause on every trade.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6" data-testid="text-test-launch-note">
            Want to try it first? Turn on "Test launch" in the launch form to see your coin's fee split with no wallet,
            no transaction and nothing on-chain. Test launches aren't saved.
          </p>
          <Link href="/launch">
            <Button size="lg" className="gap-2" data-testid="button-launch-cta">
              <Rocket className="h-5 w-5" />
              Launch a charity coin
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
