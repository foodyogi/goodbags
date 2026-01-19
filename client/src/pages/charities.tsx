import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  ExternalLink, 
  Shield, 
  Heart, 
  Leaf, 
  GraduationCap, 
  HeartPulse,
  PawPrint,
  LifeBuoy,
  Users,
  HandHeart,
  Globe,
  Wallet,
  Twitter
} from "lucide-react";
import { Link } from "wouter";
import type { Charity } from "@shared/schema";

const categoryIcons: Record<string, React.ElementType> = {
  hunger: Heart,
  environment: Leaf,
  education: GraduationCap,
  health: HeartPulse,
  animals: PawPrint,
  disaster: LifeBuoy,
  community: Users,
  other: HandHeart,
};

const categoryNames: Record<string, string> = {
  hunger: "End Hunger",
  environment: "Environment",
  education: "Education",
  health: "Health & Medicine",
  animals: "Animal Welfare",
  disaster: "Disaster Relief",
  community: "Community Development",
  other: "Other Causes",
};

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function CharityCard({ charity }: { charity: Charity }) {
  const Icon = categoryIcons[charity.category] || HandHeart;
  
  return (
    <Card className="hover-elevate" data-testid={`charity-card-${charity.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{charity.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {categoryNames[charity.category] || charity.category}
              </Badge>
            </div>
          </div>
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" data-testid={`badge-verified-${charity.id}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {charity.description && (
          <p className="text-sm text-muted-foreground">{charity.description}</p>
        )}
        
        <div className="space-y-2 text-sm">
          {charity.twitterHandle && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Twitter className="h-4 w-4 shrink-0 text-blue-500" />
              <a 
                href={`https://x.com/${charity.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid={`link-twitter-${charity.id}`}
              >
                @{charity.twitterHandle}
              </a>
              {charity.payoutMethod === "twitter" && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  Bags.fm Claim
                </Badge>
              )}
            </div>
          )}
          
          {charity.walletAddress && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="font-mono text-xs" data-testid={`wallet-${charity.id}`}>
                {truncateWallet(charity.walletAddress)}
              </span>
              <a 
                href={`https://solscan.io/account/${charity.walletAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
                data-testid={`link-solscan-${charity.id}`}
              >
                <ExternalLink className="h-3 w-3" />
                Verify
              </a>
            </div>
          )}
          
          {charity.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <a 
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
                data-testid={`link-website-${charity.id}`}
              >
                {charity.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CharityCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export default function CharitiesPage() {
  const { data: charities, isLoading } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  const approvedCharities = charities?.filter(c => c.status === "verified") ?? [];

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 mb-4" data-testid="badge-verified-charities">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Verified Charities</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-charities">
            Our Verified Partner Charities
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Every charity on GoodBags goes through a rigorous 3-step verification process: 
            email verification, wallet signature, and manual review. 
            All donation wallets are publicly verifiable on the blockchain.
          </p>
          <Link href="/charities/apply">
            <Button variant="outline" data-testid="button-apply-charity">
              <Heart className="h-4 w-4 mr-2" />
              Apply as a Charity
            </Button>
          </Link>
        </div>

        <div className="mb-8 p-4 rounded-lg bg-muted/30 border border-border" data-testid="section-verification-process">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Our Verification Process
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-muted-foreground">Verify ownership of official charity email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Wallet Signature</p>
                <p className="text-sm text-muted-foreground">Prove ownership of donation wallet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Manual Review</p>
                <p className="text-sm text-muted-foreground">GoodBags team verifies legitimacy</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CharityCardSkeleton />
            <CharityCardSkeleton />
            <CharityCardSkeleton />
          </div>
        ) : approvedCharities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Verified Charities Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first charity to get verified on GoodBags!
              </p>
              <Link href="/charities/apply">
                <Button data-testid="button-apply-first">Apply Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approvedCharities.map((charity) => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center p-6 rounded-lg bg-muted/20 border border-border" data-testid="section-blockchain-note">
          <h3 className="font-semibold mb-2">Blockchain-Verified Transparency</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Every donation sent to these charities is recorded on the Solana blockchain. 
            Click "Verify" on any charity wallet to see all incoming transactions on Solscan.
          </p>
        </div>
      </div>
    </div>
  );
}
