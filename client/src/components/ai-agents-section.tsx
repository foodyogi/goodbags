import { Card, CardContent } from "@/components/ui/card";
import { Bot, Rocket, Coins, TrendingUp, ShieldCheck } from "lucide-react";

const agentFeatures = [
  {
    icon: Rocket,
    title: "Launch coins for anyone",
    description: "Agent-assisted token creation",
  },
  {
    icon: Coins,
    title: "Claim fees",
    description: "Agent-assisted fee collection",
  },
  {
    icon: TrendingUp,
    title: "Trade / market-make",
    description: "Agent-assisted trading",
  },
];

export function AIAgentsSection() {
  return (
    <section className="py-12 md:py-16" data-testid="section-ai-agents">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 mb-4">
            <Bot className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">AI-Powered</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="heading-ai-agents">
            AI Agents Ready
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bags supports agentic authentication flows. Creators can use AI Agents to launch coins 
            and manage their impact settings — all enforced on-chain.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {agentFeatures.map((feature) => (
            <Card 
              key={feature.title} 
              className="hover-elevate"
              data-testid={`ai-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-6 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-purple-500/10 mb-4">
                  <feature.icon className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span>GoodBags does not custody funds. Wallet permissions are controlled by the user.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
