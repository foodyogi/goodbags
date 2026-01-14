import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { CHARITY_NAME, CHARITY_WALLET, type Donation } from "@shared/schema";

interface DonationTrackerProps {
  donations?: Donation[];
  isLoading: boolean;
}

export function DonationTracker({ donations, isLoading }: DonationTrackerProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatSol = (value: string) => {
    const num = parseFloat(value);
    return num < 0.001 ? "< 0.001" : num.toFixed(4);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Blockchain-Verified Donations
        </CardTitle>
        <CardDescription>
          All donations to {CHARITY_NAME} tracked transparently on Solana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!donations || donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10 mb-3">
              <Heart className="h-6 w-6 text-pink-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Donations will appear here as tokens are traded
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-muted/30 p-3"
                  data-testid={`donation-${donation.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/10">
                      <CheckCircle2 className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatSol(donation.amount)} SOL</span>
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(donation.donatedAt), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${donation.transactionSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      data-testid={`button-view-donation-${donation.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Charity Wallet</span>
            <a
              href={`https://solscan.io/account/${CHARITY_WALLET}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-primary hover:underline"
              data-testid="link-charity-wallet"
            >
              {truncateAddress(CHARITY_WALLET)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
