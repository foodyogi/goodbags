import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, CheckCircle2, ExternalLink, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangeNonprofit {
  id: string;
  name: string;
  ein?: string | null;
  mission?: string | null;
  category: string;
  website?: string | null;
  logoUrl?: string | null;
  solanaAddress?: string | null;
  hasSolanaWallet?: boolean;
  location?: string | null;
}

interface SearchResponse {
  nonprofits: ChangeNonprofit[];
  page: number;
  totalResults: number;
  totalWithSolana: number;
  source: string;
}

interface CharitySearchProps {
  onSelect: (charity: ChangeNonprofit) => void;
  selectedId?: string | null;
}

export function CharitySearch({ onSelect, selectedId }: CharitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setDebouncedQuery(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["/api/charities/change/search", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/charities/change/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to search charities");
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  const getCategoryIcon = useCallback((category: string) => {
    const icons: Record<string, string> = {
      hunger: "utensils",
      environment: "leaf",
      education: "graduation-cap",
      health: "heart-pulse",
      animals: "paw-print",
      disaster: "life-buoy",
      community: "users",
    };
    return icons[category] || "hand-heart";
  }, []);

  const getCategoryEmoji = useCallback((category: string) => {
    const emojis: Record<string, string> = {
      hunger: "hunger",
      environment: "env",
      education: "edu",
      health: "health",
      animals: "animals",
      disaster: "relief",
      community: "community",
    };
    return emojis[category] || "other";
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search 1.3M+ verified nonprofits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-charity-search"
        />
      </div>

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
      )}

      {isLoading && debouncedQuery && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to search charities. Please try again.
        </div>
      )}

      {data && data.nonprofits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No nonprofits found</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {data && data.nonprofits.length > 0 && (
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-4">
            {data.nonprofits.map((nonprofit) => {
              const hasWallet = nonprofit.hasSolanaWallet;
              return (
                <button
                  key={nonprofit.id}
                  type="button"
                  onClick={() => hasWallet && onSelect(nonprofit)}
                  disabled={!hasWallet}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    hasWallet ? "hover-elevate cursor-pointer" : "opacity-50 cursor-not-allowed",
                    selectedId === nonprofit.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                  data-testid={`charity-option-${nonprofit.id}`}
                >
                  <div className="flex items-start gap-3">
                    {nonprofit.logoUrl ? (
                      <img 
                        src={nonprofit.logoUrl} 
                        alt={nonprofit.name}
                        className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{nonprofit.name}</span>
                        {hasWallet ? (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Crypto Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No Wallet
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryEmoji(nonprofit.category)}
                        </Badge>
                        {nonprofit.location && (
                          <span className="text-xs text-muted-foreground truncate">
                            {nonprofit.location}
                          </span>
                        )}
                      </div>
                      
                      {nonprofit.mission && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {nonprofit.mission}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {data && (
        <p className="text-xs text-center text-muted-foreground">
          Found {data.totalResults} nonprofits ({data.totalWithSolana} with Solana wallets)
        </p>
      )}
    </div>
  );
}

interface SelectedCharityDisplayProps {
  charity: ChangeNonprofit;
  onClear: () => void;
}

export function SelectedCharityDisplay({ charity, onClear }: SelectedCharityDisplayProps) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        {charity.logoUrl ? (
          <img 
            src={charity.logoUrl} 
            alt={charity.name}
            className="h-12 w-12 rounded-md object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{charity.name}</span>
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
          
          {charity.mission && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {charity.mission}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            {charity.website && (
              <a 
                href={charity.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs h-auto py-1"
              data-testid="button-change-charity"
            >
              Change
            </Button>
          </div>
        </div>
      </div>
      
      {charity.solanaAddress && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Solana Wallet:</span>
            <a 
              href={`https://solscan.io/account/${charity.solanaAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {charity.solanaAddress.slice(0, 6)}...{charity.solanaAddress.slice(-4)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
