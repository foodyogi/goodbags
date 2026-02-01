import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Rocket, Heart, Coins, TrendingUp, Shield } from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";

import charitableDogCoin from "@assets/generated_images/charitable_dog_meme_coin.png";
import dogFeedingCoin from "@assets/generated_images/dog_feeding_charity_coin.png";
import educationCatCoin from "@assets/generated_images/education_charity_cat_coin.png";
import environmentalPandaCoin from "@assets/generated_images/environmental_panda_coin.png";

const exampleCoins = [
  { image: charitableDogCoin, name: "HeroDog", cause: "Animal Rescue" },
  { image: dogFeedingCoin, name: "FeedPup", cause: "Fighting Hunger" },
  { image: educationCatCoin, name: "ScholarCat", cause: "Education" },
  { image: environmentalPandaCoin, name: "EcoPanda", cause: "Environment" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-8 md:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center gap-4 mb-2">
              <ThemedLogo className="h-24 w-24 md:h-40 md:w-40 rounded-2xl object-contain" />
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  1% of every trade goes to charity
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Launch Your Coin,
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Make a Social Impact
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Create and launch your own Solana memecoins with built-in charity donations. 
              Support verified charities like Juliana's Animal Sanctuary with every trade — 
              transparent, verifiable, and stored on-chain.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="gap-2 text-base" 
                data-testid="button-hero-launch"
                onClick={() => {
                  const formSection = document.getElementById('launch-form');
                  if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Rocket className="h-5 w-5" />
                Launch a Purpose-Driven Coin
              </Button>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="gap-2 text-base" data-testid="button-hero-how-it-works">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by <a href="https://bags.fm" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Bags</a>
            </p>
          </div>

          <div className="relative lg:pl-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {exampleCoins.map((coin, index) => (
                <div 
                  key={index} 
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-xl hover:border-primary/60 transition-all hover:scale-110 hover:shadow-2xl cursor-pointer"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    transform: `rotate(${(index - 1.5) * 5}deg)`
                  }}
                  data-testid={`example-coin-${index}`}
                >
                  <img 
                    src={coin.image} 
                    alt="Impact coin"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={Coins}
                title="Easy Launch"
                description="Create tokens in minutes with just name, symbol, and image"
                gradient="from-primary/20 to-primary/5"
              />
              <FeatureCard
                icon={Heart}
                title="1% For Charity"
                description="The full trading royalty benefits your chosen cause"
                gradient="from-pink-500/20 to-pink-500/5"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Real Trading"
                description="Tokens launch on Meteora with instant liquidity"
                gradient="from-secondary/20 to-secondary/5"
              />
              <FeatureCard
                icon={Shield}
                title="Transparent"
                description="All donations tracked and verified on blockchain"
                gradient="from-blue-500/20 to-blue-500/5"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className={`rounded-xl border border-border/50 bg-gradient-to-br ${gradient} p-5 backdrop-blur-sm`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 mb-3">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
