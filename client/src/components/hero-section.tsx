import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Heart, ShieldCheck, Utensils, ArrowRight } from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";
import { CHARITY_SHARE_UNAVAILABLE, useCharityShare } from "@/components/charity-share-earned";
import { NEW_LAUNCH_MIN_CHARITY_PERCENT } from "@shared/feeSplit";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function HeroSection() {
  const allShares = useCharityShare();
  const fyiShares = useCharityShare((t) => t.charityId === "food-yoga-international");

  const earned = allShares.isLoading
    ? "…"
    : allShares.earnedSol !== null ? `${allShares.earnedSol} SOL` : CHARITY_SHARE_UNAVAILABLE;
  const fyiClaims = fyiShares.isLoading
    ? "…"
    : fyiShares.claimsAvailable ? String(fyiShares.claims.length) : null;

  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-20 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="flex flex-col gap-5 md:gap-6">
            <ThemedLogo className="h-20 w-20 md:h-28 md:w-28 rounded-2xl object-contain" animated />

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl" data-testid="heading-hero">
              Charity fundraising,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                built into the token.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl" data-testid="text-hero-subhead">
              Launch a Solana coin on Bags.fm with a charity's share written into its fee split.
              At least {NEW_LAUNCH_MIN_CHARITY_PERCENT}% of the coin's shared trading fees go to a registered
              nonprofit, claimed on-chain and checkable by anyone on Solscan.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2 text-base"
                data-testid="button-hero-launch"
                onClick={() => scrollToId("launch-form")}
              >
                <Rocket className="h-5 w-5" />
                Launch a charity coin
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base"
                data-testid="button-hero-proof"
                onClick={() => scrollToId("proof")}
              >
                <ShieldCheck className="h-5 w-5" />
                See the on-chain proof
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by <a href="https://bags.fm" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Bags</a>
            </p>
          </div>

          <div className="grid gap-4" data-testid="section-proof-strip">
            <ProofItem icon={Heart} color="bg-pink-500/15 text-pink-500" testId="proof-charity-share">
              Charity share earned so far: <span className="font-semibold text-foreground">{earned}</span>
            </ProofItem>
            <ProofItem icon={ShieldCheck} color="bg-green-500/15 text-green-500" testId="proof-fyi-claims">
              <Link href="/food-yoga-international" className="hover:underline">
                {fyiClaims !== null ? (
                  <>
                    <span className="font-semibold text-foreground">{fyiClaims}</span> verified on-chain fee claims by
                    Food Yoga International
                  </>
                ) : (
                  <>Verified on-chain fee claims by Food Yoga International: {CHARITY_SHARE_UNAVAILABLE.toLowerCase()}</>
                )}
                <ArrowRight className="inline h-4 w-4 ml-1" />
              </Link>
            </ProofItem>
            <ProofItem icon={Utensils} color="bg-amber-500/15 text-amber-500" testId="proof-fyi-team">
              Built by the team behind Food Yoga International, 35+ years feeding people
            </ProofItem>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofItem({
  icon: Icon,
  color,
  testId,
  children,
}: {
  icon: React.ElementType;
  color: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm md:text-base text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}

const HOW_IT_WORKS_STEPS = [
  "Pick a verified charity and launch your coin.",
  "The fee split is written on-chain at launch: the charity, you as the creator, and a small buyback.",
  "The charity claims its share on Bags.fm, and every claim is public on Solscan.",
];

export function HomeNarrative() {
  return (
    <section className="py-12 md:py-16" data-testid="section-home-narrative">
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-2">
        <div data-testid="section-why-goodbags">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Why GoodBags exists</h2>
          <p className="text-muted-foreground text-lg">
            Memecoins move huge trading volume, and almost none of it does any good. GoodBags changes the
            default: the giving is coded into the coin itself, so it happens on every trade without anyone
            having to remember, promise or trust.
          </p>
        </div>
        <div data-testid="section-how-it-works-steps">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">How it works</h2>
          <ol className="space-y-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
            Fee split details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
