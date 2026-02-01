import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, Eye, Lock, FileCheck, ArrowRight } from "lucide-react";

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
    title: "Anti-rug pull protection",
    description: "Charities approve tokens via X verification",
  },
];

export function TrustTransparency() {
  return (
    <section className="py-12 md:py-16 bg-muted/20" data-testid="section-trust-transparency">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 mb-4">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Trust & Transparency</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="heading-trust-transparency">
            Built for Transparency
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            GoodBags is designed with transparency at its core. Every fee split is stored on-chain 
            and verifiable by anyone.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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

        <div className="text-center">
          <Link href="/how-it-works">
            <Button variant="outline" className="gap-2" data-testid="button-learn-more-trust">
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
