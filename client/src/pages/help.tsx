import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Rocket, 
  Wallet, 
  Heart, 
  TrendingUp,
  Shield,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { SiX } from "react-icons/si";
import { ThemedLogo } from "@/components/themed-logo";

const gettingStartedGuides = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "First, connect a Solana wallet like Phantom or Solflare. You'll need some SOL for transaction fees.",
    link: null,
  },
  {
    icon: Heart,
    title: "Choose a Charity",
    description: "Browse our verified charities and select the cause you want to support with your token.",
    link: "/charities",
  },
  {
    icon: Rocket,
    title: "Launch Your Token",
    description: "Fill in your token details and launch. Your token will be live on Solana within minutes.",
    link: "/launch",
  },
  {
    icon: TrendingUp,
    title: "Track Your Impact",
    description: "Monitor your token's performance and see real-time donation tracking on your dashboard.",
    link: "/my-impact",
  },
];

const commonIssues = [
  {
    icon: Wallet,
    title: "Wallet Connection Issues",
    problem: "Can't connect my wallet or transaction fails",
    solution: "Make sure you have the Phantom or Solflare browser extension installed. Ensure you have enough SOL for transaction fees (at least 0.05 SOL recommended). Try refreshing the page and reconnecting.",
  },
  {
    icon: Clock,
    title: "Transaction Pending",
    problem: "My transaction is stuck or pending",
    solution: "Solana transactions usually confirm within seconds. If it's taking longer, the network may be congested. Wait a few minutes and check your wallet for confirmation. You can also verify on Solscan.",
  },
  {
    icon: AlertCircle,
    title: "Token Not Showing",
    problem: "I launched a token but it's not appearing",
    solution: "New tokens may take a few moments to appear in the dashboard. Refresh the page after a minute. If it still doesn't show, check your wallet for the transaction confirmation.",
  },
  {
    icon: Heart,
    title: "Charity Questions",
    problem: "Questions about charity verification or payouts",
    solution: "All charities go through a 3-step verification process. Donations are tracked on-chain and can be verified on Solscan. Charities with verified X handles receive payouts via Tips.",
  },
];

export default function HelpPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-28 w-28 md:h-40 md:w-40 rounded-2xl object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-help">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Help Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-help">
            How Can We Help?
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions, get platform guidance, and learn how to reach our support team.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Getting Started</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {gettingStartedGuides.map(({ icon: Icon, title, description, link }, index) => (
              <Card key={title} className="relative" data-testid={`guide-card-${index + 1}`}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid={`text-guide-title-${index + 1}`}>{title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                  {link && (
                    <Link href={link}>
                      <Button variant="outline" size="sm" className="gap-1" data-testid={`button-guide-learn-more-${index + 1}`}>
                        Learn More
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Common Issues & Solutions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {commonIssues.map(({ icon: Icon, title, problem, solution }) => (
              <Card key={title} data-testid={`issue-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                      <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{title}</h3>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{problem}</p>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">{solution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" data-testid="section-contact">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-3">Contact Support</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Can't find what you're looking for? Reach out to our team and we'll help you as soon as possible.
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
                <Card data-testid="contact-email">
                  <CardContent className="p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For general inquiries and support
                    </p>
                    <a 
                      href="mailto:contact@master22solutions.com"
                      className="text-primary hover:underline font-medium"
                      data-testid="link-email-support"
                    >
                      contact@master22solutions.com
                    </a>
                  </CardContent>
                </Card>

                <Card data-testid="contact-x">
                  <CardContent className="p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                      <SiX className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold mb-2">X (Twitter)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow for updates and quick questions
                    </p>
                    <a 
                      href="https://x.com/goodbagstech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      data-testid="link-x-support"
                    >
                      @goodbagstech
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Helpful Resources</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/how-it-works">
              <Card className="hover-elevate cursor-pointer h-full" data-testid="resource-how-it-works">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">How It Works</h3>
                      <p className="text-sm text-muted-foreground">Learn about our platform and security</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/faq">
              <Card className="hover-elevate cursor-pointer h-full" data-testid="resource-faq">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">FAQ</h3>
                      <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/charities">
              <Card className="hover-elevate cursor-pointer h-full" data-testid="resource-charities">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Verified Charities</h3>
                      <p className="text-sm text-muted-foreground">Browse all supported charities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
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
