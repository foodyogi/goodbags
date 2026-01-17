import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Heart, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { LaunchedToken } from "@shared/schema";

interface TokenCardProps {
  token: LaunchedToken;
}

export function TokenCard({ token }: TokenCardProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatSol = (value: string | null) => {
    if (!value) return "0";
    const num = parseFloat(value);
    return num < 0.001 ? "< 0.001" : num.toFixed(3);
  };

  return (
    <Card className="hover-elevate group" data-testid={`card-token-${token.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg border border-border">
            <AvatarImage src={token.imageUrl || undefined} alt={token.name} />
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-bold">
              {token.symbol.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{token.name}</h3>
              <Badge variant="secondary" className="font-mono text-xs shrink-0">
                {token.symbol}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {truncateAddress(token.mintAddress)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 space-y-3">
        {token.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {token.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/10">
              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-medium">{formatSol(token.tradingVolume)} SOL</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500/10">
              <Heart className="h-3.5 w-3.5 text-pink-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Donated</p>
              <p className="text-sm font-medium">{formatSol(token.charityDonated)} SOL</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Launched {format(new Date(token.launchedAt), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
        <Link href={`/token/${token.mintAddress}`} className="flex-1">
          <Button 
            variant="default" 
            className="w-full gap-2" 
            data-testid={`button-view-details-${token.id}`}
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <a
          href={`https://solscan.io/token/${token.mintAddress}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button 
            variant="outline" 
            size="icon"
            data-testid={`button-view-solscan-${token.id}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
