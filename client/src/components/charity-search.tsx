import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, CheckCircle2, ExternalLink, Building2, Heart, Twitter, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Charity } from "@shared/schema";

interface CharityOption {
  id: string;
  name: string;
  mission?: string | null;
  category: string;
  website?: string | null;
  logoUrl?: string | null;
  solanaAddress?: string | null;
  twitterHandle?: string | null;
  countryName?: string | null;
}

interface CharitySearchProps {
  onSelect: (charity: CharityOption) => void;
  selectedId?: string | null;
}

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

export function CharitySearch({ onSelect, selectedId }: CharitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all verified charities from our local database
  const { data: charities, isLoading, error } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  // Filter to only verified charities with twitter handles
  const verifiedCharities = useMemo(() => {
    if (!charities) return [];
    return charities.filter(c => c.status === "verified" && c.twitterHandle);
  }, [charities]);

  // Filter by search query
  const filteredCharities = useMemo(() => {
    if (!searchQuery.trim()) return verifiedCharities;
    const query = searchQuery.toLowerCase();
    return verifiedCharities.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.twitterHandle?.toLowerCase().includes(query) ||
      c.countryName?.toLowerCase().includes(query) ||
      categoryNames[c.category]?.toLowerCase().includes(query)
    );
  }, [verifiedCharities, searchQuery]);

  const handleSelect = (charity: Charity) => {
    onSelect({
      id: charity.id.toString(),
      name: charity.name,
      mission: charity.description,
      category: charity.category,
      website: charity.website,
      logoUrl: null,
      solanaAddress: charity.walletAddress,
      twitterHandle: charity.twitterHandle,
      countryName: charity.countryName,
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search 75+ verified charities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-charity-search"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading charities...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load charities. Please try again.
        </div>
      )}

      {!isLoading && filteredCharities.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No charities found</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {!isLoading && filteredCharities.length > 0 && (
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-4">
            {filteredCharities.map((charity) => (
              <button
                key={charity.id}
                type="button"
                onClick={() => handleSelect(charity)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors hover-elevate cursor-pointer",
                  selectedId === charity.id.toString()
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
                data-testid={`charity-option-${charity.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-pink-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{charity.name}</span>
                      <Badge variant="default" className="text-xs bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {categoryNames[charity.category] || charity.category}
                      </Badge>
                      {charity.countryName && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {charity.countryName}
                        </Badge>
                      )}
                    </div>
                    
                    {charity.twitterHandle && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-500 flex-wrap">
                        <Twitter className="h-3 w-3" />
                        @{charity.twitterHandle}
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          Bags.fm Claim
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {!isLoading && verifiedCharities.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {searchQuery ? `Showing ${filteredCharities.length} of ` : ""}{verifiedCharities.length} verified charities
        </p>
      )}
    </div>
  );
}

interface SelectedCharityDisplayProps {
  charity: CharityOption;
  onClear: () => void;
}

export function SelectedCharityDisplay({ charity, onClear }: SelectedCharityDisplayProps) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-md bg-pink-500/10 flex items-center justify-center">
          <Heart className="h-6 w-6 text-pink-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{charity.name}</span>
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {categoryNames[charity.category] || charity.category}
            </Badge>
            {charity.countryName && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {charity.countryName}
              </Badge>
            )}
          </div>
          
          {charity.twitterHandle && (
            <div className="flex items-center gap-1 mt-2 text-sm text-blue-500">
              <Twitter className="h-4 w-4" />
              <a 
                href={`https://x.com/${charity.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{charity.twitterHandle}
              </a>
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 ml-1">
                Bags.fm Claim
              </Badge>
            </div>
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
    </div>
  );
}
