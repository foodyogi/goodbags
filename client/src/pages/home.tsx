import { HeroSection } from "@/components/hero-section";
import { TokenLaunchForm } from "@/components/token-launch-form";
import { FeaturedProject } from "@/components/featured-project";
import { FeeTransparency } from "@/components/fee-transparency";
import { LiveImpactStats } from "@/components/live-impact-stats";
import { TrendingTokens } from "@/components/trending-tokens";
import { TokenLeaderboard } from "@/components/token-leaderboard";
import { FeaturesSummary } from "@/components/features-summary";
import { AIAgentsSection } from "@/components/ai-agents-section";
import { TrustTransparency } from "@/components/trust-transparency";
import { LoginPromptModal } from "@/components/login-prompt-modal";
import { useQuery } from "@tanstack/react-query";
import { type LaunchedToken } from "@shared/schema";

export default function Home() {
  const { data: tokens } = useQuery<LaunchedToken[]>({
    queryKey: ["/api/tokens"],
  });

  return (
    <div className="min-h-screen">
      <LoginPromptModal autoOpen={true} delayMs={800} />
      <HeroSection />
      
      <LiveImpactStats />
      
      {tokens && tokens.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <TrendingTokens tokens={tokens} limit={5} />
              <TokenLeaderboard tokens={tokens} limit={5} />
            </div>
          </div>
        </section>
      )}
      
      <FeeTransparency />
      
      <AIAgentsSection />
      
      <TrustTransparency />
      
      <FeaturesSummary />
      
      <FeaturedProject />
      
      <section id="launch-form" className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Launch a Purpose-Driven Coin</h2>
            <p className="text-muted-foreground">
              Fill in the details below to create your token with built-in charitable giving
            </p>
          </div>
          <TokenLaunchForm />
        </div>
      </section>
    </div>
  );
}
