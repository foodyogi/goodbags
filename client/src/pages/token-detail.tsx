import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  Heart, 
  TrendingUp, 
  Clock, 
  Copy, 
  Check,
  ArrowLeft,
  Shield,
  Coins,
  Wallet,
  BadgeCheck,
  AlertCircle,
  Clock3,
  Globe,
  MessageCircle,
  User
} from "lucide-react";
import { SiX, SiFacebook } from "react-icons/si";
import { format } from "date-fns";
import { useState } from "react";
import { TOKEN_APPROVAL_STATUS } from "@shared/schema";
import {
  deriveTierFromBps,
  getTierLabel,
  bpsToPercent,
  isBpsAnomaly,
  BASE_CHARITY_BPS,
  BASE_BUYBACK_BPS,
  BASE_CREATOR_BPS,
} from "@shared/feeSplit";
import { CommunityImpact } from "@/components/community-impact";
import { SocialShare } from "@/components/social-share";
import { EndorsementCelebration } from "@/components/endorsement-celebration";

interface TokenImpactData {
  token: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    imageUrl: string | null;
    creatorWallet: string;
    launchedAt: string;
    charityId: string | null;
    description?: string;
    tradingVolume?: string;
    charityApprovalStatus?: string;
    charityName?: string;
    charityApprovalNote?: string;
    charityWebsite?: string | null;
    charityTwitter?: string | null;
    charityFacebook?: string | null;
    charityNotifiedAt?: string | null;
    hasCharityEmail?: boolean;
    charityBps?: number | null;
    buybackBps?: number | null;
    creatorBps?: number | null;
    donateCreatorShare?: boolean | null;
  };
  impact: {
    totalDonated: string;
    donationCount: number;
    recentDonations: Array<{
      id: string;
      amount: string;
      donatedAt: string;
      transactionSignature: string;
    }>;
  };
  charityInfo: {
    id: string;
    name: string;
    wallet: string;
    category: string;
    status: string;
    feePercentage: number;
    buybackFeePercentage: number;
    creatorFeePercentage: number;
  } | null;
}

function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function formatSol(value: string | null | undefined): string {
  if (!value) return "0";
  const num = parseFloat(value);
  if (num === 0) return "0";
  if (num < 0.001) return "< 0.001";
  if (num < 1) return num.toFixed(4);
  return num.toFixed(2);
}

function CopyButton({ text, testId }: { text: string; testId?: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleCopy}
      data-testid={testId || "button-copy-address"}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function getStatusDisplay(status: string): { label: string; color: string } {
  switch (status) {
    case "verified":
      return { label: "Verified", color: "bg-green-500/10 text-green-600 border-green-500/20" };
    case "pending":
      return { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
    case "email_verified":
      return { label: "Email Verified", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    case "wallet_verified":
      return { label: "Wallet Verified", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    default:
      return { label: status, color: "bg-muted text-muted-foreground" };
  }
}

function ApprovalBadge({ status, tokenId }: { status?: string; tokenId: string }) {
  switch (status) {
    case TOKEN_APPROVAL_STATUS.APPROVED:
      return (
        <Badge variant="default" className="bg-green-600" data-testid={`badge-official-${tokenId}`}>
          <BadgeCheck className="h-3 w-3 mr-1" />
          Official
        </Badge>
      );
    case TOKEN_APPROVAL_STATUS.DENIED:
      return (
        <Badge variant="destructive" data-testid={`badge-denied-${tokenId}`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Endorsed
        </Badge>
      );
    case TOKEN_APPROVAL_STATUS.PENDING:
      return (
        <Badge variant="secondary" data-testid={`badge-pending-${tokenId}`}>
          <Clock3 className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    default:
      return null;
  }
}

export default function TokenDetailPage() {
  const params = useParams<{ mint: string }>();
  const mint = params.mint;

  const { data, isLoading, error } = useQuery<TokenImpactData>({
    queryKey: ["/api/tokens", mint, "impact"],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${mint}/impact`);
      if (!res.ok) throw new Error("Token not found");
      return res.json();
    },
    enabled: !!mint,
  });

  if (isLoading) {
    return (
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-20 w-20 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This token doesn't exist or hasn't been launched through GoodBags.
          </p>
          <Link href="/dashboard" data-testid="link-back-dashboard-error">
            <Button data-testid="button-back-error">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { token, impact, charityInfo } = data;

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <Link href="/dashboard" data-testid="link-back-dashboard">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="mb-6" data-testid="card-token-header">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-20 w-20 rounded-xl border-2 border-border">
                <AvatarImage src={token.imageUrl || undefined} alt={token.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold">
                  {token.symbol.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-token-name">
                    {token.name}
                  </h1>
                  <Badge variant="secondary" className="font-mono text-sm">
                    ${token.symbol}
                  </Badge>
                  <ApprovalBadge status={token.charityApprovalStatus} tokenId={token.id} />
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-sm text-muted-foreground font-mono" data-testid="text-mint-address">
                    {truncateAddress(token.mintAddress, 8)}
                  </code>
                  <CopyButton text={token.mintAddress} testId="button-copy-mint" />
                </div>
                
                {token.description && (
                  <p className="text-sm text-muted-foreground mb-3" data-testid="text-description">
                    {token.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Launched {format(new Date(token.launchedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <EndorsementCelebration 
          status={token.charityApprovalStatus}
          charityName={token.charityName}
          note={token.charityApprovalNote}
          tokenId={token.id}
          charityNotifiedAt={token.charityNotifiedAt}
          hasCharityEmail={token.hasCharityEmail}
          charityTwitter={token.charityTwitter}
          tokenName={token.name}
          tokenSymbol={token.symbol}
          tokenMintAddress={token.mintAddress}
        />

        {token.charityApprovalStatus && (
          <div className="mb-6" />
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <CommunityImpact
            tokenName={token.name}
            tokenSymbol={token.symbol}
            charityName={token.charityName || charityInfo?.name || null}
            totalDonated={impact.totalDonated}
            donationCount={impact.donationCount}
            isApproved={token.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED}
          />
          
          <SocialShare
            tokenName={token.name}
            tokenSymbol={token.symbol}
            mintAddress={token.mintAddress}
            charityName={token.charityName || charityInfo?.name || null}
            totalDonated={impact.totalDonated}
            isApproved={token.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card data-testid="card-impact-stats">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-pink-500" />
                Donation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Donated</span>
                  <span className="text-2xl font-bold text-pink-600" data-testid="text-total-donated">
                    {formatSol(impact.totalDonated)} SOL
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Donation Count</span>
                  <span className="text-lg font-semibold">{impact.donationCount}</span>
                </div>
                {token.tradingVolume && parseFloat(token.tradingVolume) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trading Volume</span>
                    <span className="text-lg font-semibold" data-testid="text-trading-volume">
                      {formatSol(token.tradingVolume)} SOL
                    </span>
                  </div>
                )}
                {charityInfo && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Supporting</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-background">
                        <Shield className="h-3 w-3 mr-1 text-green-500" />
                        {charityInfo.name}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-fee-breakdown">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-primary" />
                Fee Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Show per-token split if available, otherwise use defaults */}
                {(() => {
                  // Use stored BPS values with fallback to base constants
                  const charityBps = token.charityBps ?? BASE_CHARITY_BPS;
                  const buybackBps = token.buybackBps ?? BASE_BUYBACK_BPS;
                  const creatorBps = token.creatorBps ?? BASE_CREATOR_BPS;
                  const derivedTier = deriveTierFromBps(charityBps, buybackBps, creatorBps);
                  const hasAnomaly = isBpsAnomaly(charityBps, buybackBps, creatorBps);
                  const tierLabel = getTierLabel(derivedTier);
                  
                  return (
                    <>
                      {/* Show donation tier if creator donated any portion */}
                      {derivedTier !== null && derivedTier > 0 && (
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-muted">
                          <span className="text-sm font-medium text-primary">Creator Donation</span>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {tierLabel}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="text-sm">To Charity</span>
                        </div>
                        <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/20">
                          {bpsToPercent(charityBps)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">FYI Buyback</span>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          {bpsToPercent(buybackBps)}%
                        </Badge>
                      </div>
                      {creatorBps > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Token Creator</span>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            {bpsToPercent(creatorBps)}%
                          </Badge>
                        </div>
                      )}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Fee</span>
                          <Badge variant="outline" className="font-bold">
                            1%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {derivedTier === 100
                            ? "Creator donated their share — 95% of fees go to charity!" 
                            : "This 1% royalty split was configured at launch and is enforced on-chain."}
                        </p>
                        {hasAnomaly && (
                          <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Fee split values may not sum to 100%
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {charityInfo && (
          <Card className="mb-6" data-testid="card-charity-info">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-green-500" />
                Charity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-muted-foreground">Charity Name</span>
                  <span className="font-medium">{charityInfo.name}</span>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="secondary">{charityInfo.category}</Badge>
                </div>
                {charityInfo.wallet && (
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-muted-foreground">Wallet</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{truncateAddress(charityInfo.wallet, 6)}</code>
                      <CopyButton text={charityInfo.wallet} testId="button-copy-charity-wallet" />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusDisplay(charityInfo.status).color}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getStatusDisplay(charityInfo.status).label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(token.charityWebsite || token.charityTwitter || token.charityFacebook) && (
          <Card className="mb-6" data-testid="card-charity-contact">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Contact Charity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Want to collaborate with this charity? Reach out to them directly:
              </p>
              <div className="flex flex-wrap gap-3">
                {token.charityWebsite && (
                  <a
                    href={token.charityWebsite.startsWith("http") ? token.charityWebsite : `https://${token.charityWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-charity-website"
                  >
                    <Button variant="outline" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                {token.charityTwitter && (
                  <a
                    href={token.charityTwitter.startsWith("http") ? token.charityTwitter : `https://x.com/${token.charityTwitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-charity-twitter"
                  >
                    <Button variant="outline" className="gap-2">
                      <SiX className="h-4 w-4" />
                      X / Twitter
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                {token.charityFacebook && (
                  <a
                    href={token.charityFacebook.startsWith("http") ? token.charityFacebook : `https://facebook.com/${token.charityFacebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-charity-facebook"
                  >
                    <Button variant="outline" className="gap-2">
                      <SiFacebook className="h-4 w-4" />
                      Facebook
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: Introduce yourself, explain your token's mission, and ask if they'd like to officially endorse it.
              </p>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-trading-links">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Trade This Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href={`https://bags.fm/${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                data-testid="link-trade-bags"
              >
                <Button variant="outline" className="w-full gap-2" data-testid="button-trade-bags">
                  <img src="https://bags.fm/assets/images/bags-icon.png" alt="Bags" className="h-4 w-4" />
                  Trade on Bags
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <a
                href={`https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                data-testid="link-trade-jupiter"
              >
                <Button variant="outline" className="w-full gap-2" data-testid="button-trade-jupiter">
                  <img src="https://jup.ag/favicon.ico" alt="Jupiter" className="h-4 w-4" />
                  Jupiter
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <a
                href={`https://axiom.trade/t/${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                data-testid="link-trade-axiom"
              >
                <Button variant="outline" className="w-full gap-2" data-testid="button-trade-axiom">
                  Axiom
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <a
                href={`https://solscan.io/token/${token.mintAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                data-testid="link-view-solscan"
              >
                <Button variant="outline" className="w-full gap-2" data-testid="button-view-solscan">
                  <ExternalLink className="h-4 w-4" />
                  Solscan
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {impact.recentDonations.length > 0 && (
          <Card className="mt-6" data-testid="card-recent-donations">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-pink-500" />
                Recent Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {impact.recentDonations.slice(0, 5).map((donation) => (
                  <div 
                    key={donation.id} 
                    className="flex flex-wrap justify-between items-center p-3 rounded-lg bg-muted/30 gap-2"
                    data-testid={`donation-${donation.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10">
                        <Heart className="h-4 w-4 text-pink-500" />
                      </div>
                      <div>
                        <p className="font-medium">{formatSol(donation.amount)} SOL</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(donation.donatedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://solscan.io/tx/${donation.transactionSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-donation-tx-${donation.id}`}
                    >
                      <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-view-tx-${donation.id}`}>
                        <ExternalLink className="h-3 w-3" />
                        View TX
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
