import { HeroSection } from "@/components/hero-section";
import { TokenLaunchForm } from "@/components/token-launch-form";
import { FeaturedProject } from "@/components/featured-project";
import { FeeTransparency } from "@/components/fee-transparency";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <FeeTransparency />
      
      <FeaturedProject />
      
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Create Your Token</h2>
            <p className="text-muted-foreground">
              Fill in the details below to launch your memecoin on Solana
            </p>
          </div>
          <TokenLaunchForm />
        </div>
      </section>
    </div>
  );
}
