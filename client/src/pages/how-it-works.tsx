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
  ArrowRight
} from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Choose Your Cause",
    description: "Select from our verified charities across categories like hunger, environment, education, health, animals, and more.",
    icon: Heart,
    color: "bg-pink-500 dark:bg-pink-600",
  },
  {
    step: 2,
    title: "Create Your Token",
    description: "Design your memecoin with a name, symbol, and image. Our platform handles all the technical blockchain work.",
    icon: Rocket,
    color: "bg-primary",
  },
  {
    step: 3,
    title: "Launch on Solana",
    description: "Your token goes live with built-in trading fees that automatically go to your chosen charity.",
    icon: TrendingUp,
    color: "bg-secondary",
  },
  {
    step: 4,
    title: "Impact Grows Automatically",
    description: "Every trade generates donations. No manual work needed - the blockchain handles everything transparently.",
    icon: CheckCircle,
    color: "bg-green-500 dark:bg-green-600",
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "Server-Side Wallet Lookup",
    description: "Charity wallets are looked up from our verified database on the server. Users cannot divert funds to fake wallets.",
  },
  {
    icon: FileCheck,
    title: "3-Step Charity Verification",
    description: "Every charity must verify their email, sign with their wallet, and pass manual review before receiving donations.",
  },
  {
    icon: Eye,
    title: "Blockchain Transparency",
    description: "Every donation, trade, and buyback is recorded on Solana. Anyone can verify transactions on Solscan.",
  },
  {
    icon: Shield,
    title: "Audit Logging",
    description: "All charity submissions and token launches are logged for compliance and security review.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-how-it-works">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trust & Security</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-how-it-works">
            How GoodBags Works
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We've built GoodBags with transparency and security at its core. 
            Here's everything you need to know about how your impact tokens work.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Launch in 4 Simple Steps</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ step, title, description, icon: Icon, color }) => (
              <Card key={step} className="relative" data-testid={`step-card-${step}`}>
                <CardContent className="p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color} text-white font-bold text-lg mb-4`}>
                    {step}
                  </div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
              <Heart className="h-3 w-3 mr-1" />
              100% For Charity
            </Badge>
            <h2 className="text-2xl font-bold mb-3">Trading Fee Distribution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unlike other platforms where creators keep trading fees, GoodBags sends 
              the entire 1% royalty to your chosen charity. This is enforced on-chain.
            </p>
          </div>
          
          <Card className="max-w-3xl mx-auto" data-testid="section-fee-split">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 dark:bg-pink-600">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Your Chosen Charity</p>
                      <p className="text-sm text-muted-foreground">The full trading royalty goes to verified charities</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">99.75%</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">FYI Token Buyback</p>
                      <p className="text-sm text-muted-foreground">Small platform fee auto-buys FYI every hour</p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">0.25%</Badge>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Plus: Bags.fm Referral Credits</p>
                    <p className="text-sm text-muted-foreground">
                      All token launches also earn Bags.fm referral credits for Food Yoga International, 
                      providing even more support beyond trading fees.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Security & Trust Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've implemented multiple security measures to ensure donations reach legitimate charities.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {securityFeatures.map(({ icon: Icon, title, description }) => (
              <Card key={title} data-testid={`security-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{title}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
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
            Launch your impact token today and start generating donations for your chosen cause.
          </p>
          <Link href="/launch">
            <Button size="lg" className="gap-2" data-testid="button-launch-cta">
              <Rocket className="h-5 w-5" />
              Launch Your Token
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
