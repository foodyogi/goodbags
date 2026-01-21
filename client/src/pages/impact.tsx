import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  Award, 
  TrendingUp, 
  Copy, 
  Check, 
  ExternalLink, 
  Download,
  FileText,
  Code,
  Wallet,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { type Donation } from "@shared/schema";

interface TokenImpact {
  token: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    imageUrl: string | null;
  };
  donated: string;
  donationCount: number;
}

interface CreatorImpactData {
  creatorWallet: string;
  totalTokens: number;
  totalDonated: string;
  totalDonationCount: number;
  tokens: TokenImpact[];
  charityInfo: {
    name: string;
    wallet: string;
  };
  certified: boolean;
}

export default function ImpactPage() {
  const { connected, publicKey } = useWallet();
  const [copiedWidget, setCopiedWidget] = useState<string | null>(null);

  const { data: impactData, isLoading } = useQuery<CreatorImpactData>({
    queryKey: ["/api/creator", publicKey?.toBase58(), "impact"],
    enabled: connected && !!publicKey,
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWidget(type);
    setTimeout(() => setCopiedWidget(null), 2000);
  };

  const formatSol = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return "0 SOL";
    return num < 0.001 ? "< 0.001 SOL" : `${num.toFixed(4)} SOL`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Generate embed codes
  const generateBadgeCode = () => {
    if (!publicKey) return "";
    const baseUrl = window.location.origin;
    return `<iframe src="${baseUrl}/widget/badge/${publicKey.toBase58()}" width="300" height="120" frameborder="0" style="border-radius: 8px;"></iframe>`;
  };

  const generateTickerCode = () => {
    if (!publicKey) return "";
    const baseUrl = window.location.origin;
    return `<iframe src="${baseUrl}/widget/ticker/${publicKey.toBase58()}" width="200" height="40" frameborder="0"></iframe>`;
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your Solana wallet to view your impact report and get embeddable widgets for your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnectButton className="!bg-primary hover:!bg-primary/90" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const totalDonated = parseFloat(impactData?.totalDonated || "0");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Impact Report</h1>
        <p className="text-muted-foreground">
          Track your social impact and donation performance
        </p>
      </div>

      {/* Impact Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70">Total Donated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatSol(impactData?.totalDonated || "0")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              to your chosen charities
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-secondary/70">Tokens Launched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {impactData?.totalTokens || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              with charity donations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-pink-500/70">Donations Made</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-500">
              {impactData?.totalDonationCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              blockchain-verified
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Certification Badge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Certification Badge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-6 rounded-lg border-2 ${impactData?.certified ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-muted bg-muted/30'}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${impactData?.certified ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                  <Award className={`h-6 w-6 ${impactData?.certified ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {truncateAddress(publicKey?.toBase58() || "")} is {impactData?.certified ? '' : 'not yet '}GoodBags certified.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {impactData?.certified 
                      ? `We have made the following certified social impact: ${formatSol(impactData.totalDonated)} donated through ${impactData.totalDonationCount} transactions.`
                      : "Launch tokens and make donations to become certified and display your impact badge."}
                  </p>
                </div>
              </div>
            </div>
            
            {impactData?.certified && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  Certified Charity Contributor
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => {
                const data = JSON.stringify(impactData, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `impact-report-${publicKey?.toBase58().slice(0, 8)}.json`;
                a.click();
              }}
              data-testid="button-generate-report"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => {
                const csv = [
                  ['Token', 'Symbol', 'Donated (SOL)', 'Transactions'],
                  ...(impactData?.tokens || []).map(t => [
                    t.token.name,
                    t.token.symbol,
                    t.donated,
                    t.donationCount.toString()
                  ])
                ].map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `donations-${publicKey?.toBase58().slice(0, 8)}.csv`;
                a.click();
              }}
              data-testid="button-export-data"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <a
              href={`https://solscan.io/account/${publicKey?.toBase58()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                data-testid="button-view-wallet"
              >
                <ExternalLink className="h-4 w-4" />
                View Your Wallet on Solscan
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Tokens List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Tokens
            </CardTitle>
            <CardDescription>
              Tokens you've launched with charity donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!impactData?.tokens || impactData.tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Heart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No tokens launched yet. Launch your first token to start making an impact!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {impactData.tokens.map((item) => (
                    <div
                      key={item.token.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      data-testid={`token-impact-${item.token.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {item.token.imageUrl ? (
                          <img 
                            src={item.token.imageUrl} 
                            alt={item.token.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {item.token.symbol.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{item.token.name}</div>
                          <div className="text-xs text-muted-foreground">{item.token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-pink-500">{formatSol(item.donated)}</div>
                        <div className="text-xs text-muted-foreground">{item.donationCount} donations</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Embed Widgets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Widgets
            </CardTitle>
            <CardDescription>
              Copy these shortcodes to display your impact on your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Badge Widget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Impact Badge</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateBadgeCode(), 'badge')}
                  data-testid="button-copy-badge"
                >
                  {copiedWidget === 'badge' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs overflow-x-auto">
                <code>{generateBadgeCode()}</code>
              </div>
            </div>

            {/* Ticker Widget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compact Ticker</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateTickerCode(), 'ticker')}
                  data-testid="button-copy-ticker"
                >
                  {copiedWidget === 'ticker' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs overflow-x-auto">
                <code>{generateTickerCode()}</code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste these embed codes into your website's HTML to display your charity impact in real-time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
