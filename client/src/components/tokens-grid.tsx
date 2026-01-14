import { TokenCard } from "./token-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket, Coins } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { LaunchedToken } from "@shared/schema";

interface TokensGridProps {
  tokens?: LaunchedToken[];
  isLoading: boolean;
}

export function TokensGrid({ tokens, isLoading }: TokensGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Coins className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tokens launched yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Be the first to launch a memecoin and support charity through blockchain donations!
          </p>
          <Link href="/">
            <Button className="gap-2" data-testid="button-empty-launch">
              <Rocket className="h-4 w-4" />
              Launch Your First Token
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <TokenCard key={token.id} token={token} />
      ))}
    </div>
  );
}
