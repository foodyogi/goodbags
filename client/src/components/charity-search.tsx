import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle2, ExternalLink, Building2, Heart, Twitter, MapPin, Wallet, Mail, AlertCircle } from "lucide-react";
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
  xHandleVerified?: boolean | null; // True if X handle confirmed working with Bags.fm
  countryName?: string | null;
  source: "local" | "change";
  email?: string | null;
}

interface ChangeApiResult {
  id: string;
  name: string;
  ein?: string | null;
  mission?: string | null;
  category: string;
  website?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  solanaAddress?: string | null;
  twitterHandle?: string | null;
  hasWallet: boolean;
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showOnlyWithX, setShowOnlyWithX] = useState(false);
  const [showOnlyWithWallet, setShowOnlyWithWallet] = useState(false);

  const { data: localCharities, isLoading: localLoading } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  const { data: changeResults, isLoading: changeLoading, isFetching: changeFetching, error: changeError } = useQuery<{ results: ChangeApiResult[] }>({
    queryKey: ["/api/charities/change/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [] };
      }
      const res = await fetch(`/api/charities/change/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Search failed" }));
        throw new Error(error.error || "Search failed");
      }
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const allCharities = useMemo(() => {
    const results: CharityOption[] = [];
    const seenIds = new Set<string>();

    if (localCharities) {
      for (const c of localCharities) {
        if (c.status !== "verified") continue;
        
        const matchesSearch = !searchQuery.trim() || 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.twitterHandle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.countryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryNames[c.category]?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) continue;
        
        seenIds.add(`local-${c.id}`);
        results.push({
          id: `local-${c.id}`,
          name: c.name,
          mission: c.description,
          category: c.category,
          website: c.website,
          logoUrl: null,
          solanaAddress: c.walletAddress,
          twitterHandle: c.twitterHandle,
          xHandleVerified: c.xHandleVerified,
          countryName: c.countryName,
          source: "local",
          email: null,
        });
      }
    }

    if (changeResults?.results) {
      for (const c of changeResults.results) {
        const changeId = `change-${c.id}`;
        if (seenIds.has(changeId)) continue;
        
        seenIds.add(changeId);
        results.push({
          id: changeId,
          name: c.name,
          mission: c.mission,
          category: c.category,
          website: c.website,
          logoUrl: c.logoUrl,
          solanaAddress: c.solanaAddress,
          twitterHandle: c.twitterHandle,
          countryName: "United States",
          source: "change",
          email: c.email,
        });
      }
    }

    return results;
  }, [localCharities, changeResults, searchQuery]);

  const filteredCharities = useMemo(() => {
    return allCharities.filter(c => {
      // Only show charities with VERIFIED X handles when filter is on
      if (showOnlyWithX && !(c.twitterHandle && c.xHandleVerified)) return false;
      if (showOnlyWithWallet && !c.solanaAddress) return false;
      return true;
    });
  }, [allCharities, showOnlyWithX, showOnlyWithWallet]);

  const { selectable, notSelectable } = useMemo(() => {
    const selectable: CharityOption[] = [];
    const notSelectable: CharityOption[] = [];
    
    for (const c of filteredCharities) {
      // Only verified X handles or direct wallets are selectable for token launches
      const hasVerifiedX = c.twitterHandle && c.xHandleVerified;
      if (hasVerifiedX || c.solanaAddress) {
        selectable.push(c);
      } else {
        notSelectable.push(c);
      }
    }
    
    return { selectable, notSelectable };
  }, [filteredCharities]);

  const handleSelect = (charity: CharityOption) => {
    const hasVerifiedX = charity.twitterHandle && charity.xHandleVerified;
    if (!hasVerifiedX && !charity.solanaAddress) return;
    onSelect(charity);
  };

  const isLoading = localLoading;
  const isSearching = changeFetching && debouncedQuery.length >= 2;

  const localCount = localCharities?.filter(c => c.status === "verified").length || 0;
  const changeCount = changeResults?.results?.length || 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={`Search ${localCount}+ verified charities + millions more...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-charity-search"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 p-2 rounded-md bg-muted/50">
        <div className="flex items-center gap-2">
          <Switch
            id="filter-x"
            checked={showOnlyWithX}
            onCheckedChange={setShowOnlyWithX}
            data-testid="toggle-filter-x"
          />
          <Label htmlFor="filter-x" className="text-sm flex items-center gap-1 cursor-pointer">
            <Twitter className="h-3 w-3 text-blue-500" />
            Verified X Handle
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="filter-wallet"
            checked={showOnlyWithWallet}
            onCheckedChange={setShowOnlyWithWallet}
            data-testid="toggle-filter-wallet"
          />
          <Label htmlFor="filter-wallet" className="text-sm flex items-center gap-1 cursor-pointer">
            <Wallet className="h-3 w-3 text-green-500" />
            Has SOL Wallet
          </Label>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading charities...</span>
        </div>
      )}

      {changeError && debouncedQuery.length >= 2 && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Could not search external charities. Showing local results only.</span>
          </div>
        </div>
      )}

      {!isLoading && filteredCharities.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No charities found</p>
          <p className="text-xs mt-1">Try a different search term or adjust filters</p>
        </div>
      )}

      {!isLoading && filteredCharities.length > 0 && (
        <ScrollArea className="h-[320px]">
          <div className="space-y-2 pr-4">
            {selectable.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isSelected={selectedId === charity.id}
                onSelect={() => handleSelect(charity)}
                disabled={false}
              />
            ))}
            
            {notSelectable.length > 0 && selectable.length > 0 && (
              <div className="my-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Not Yet Available for Donations</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  These charities don&apos;t have a verified X handle or SOL wallet yet. Contact them to encourage crypto donations!
                </p>
              </div>
            )}
            
            {notSelectable.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isSelected={false}
                onSelect={() => {}}
                disabled={true}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {!isLoading && (
        <p className="text-xs text-center text-muted-foreground">
          Showing {selectable.length} selectable
          {notSelectable.length > 0 && ` + ${notSelectable.length} not yet available`}
          {debouncedQuery.length >= 2 && changeCount > 0 && ` (including ${changeCount} from Change API)`}
        </p>
      )}
    </div>
  );
}

interface CharityCardProps {
  charity: CharityOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function CharityCard({ charity, isSelected, onSelect, disabled }: CharityCardProps) {
  const hasX = !!charity.twitterHandle;
  const isXVerified = hasX && charity.xHandleVerified === true;
  const hasWallet = !!charity.solanaAddress;
  
  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-colors",
        disabled 
          ? "opacity-60 cursor-not-allowed bg-muted/30" 
          : "hover-elevate cursor-pointer",
        isSelected && !disabled
          ? "border-primary bg-primary/5"
          : "border-border"
      )}
      data-testid={`charity-option-${charity.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0",
          disabled ? "bg-muted" : "bg-pink-500/10"
        )}>
          {charity.logoUrl ? (
            <img src={charity.logoUrl} alt={charity.name} className="h-8 w-8 rounded object-cover" />
          ) : (
            <Heart className={cn("h-5 w-5", disabled ? "text-muted-foreground" : "text-pink-500")} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{charity.name}</span>
            {charity.source === "local" && (
              <Badge variant="default" className="text-xs bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {charity.source === "change" && (
              <Badge variant="secondary" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Change API
              </Badge>
            )}
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
          
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {isXVerified ? (
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <Twitter className="h-3 w-3" />
                @{charity.twitterHandle}
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            ) : hasX ? (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Twitter className="h-3 w-3" />
                @{charity.twitterHandle}
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  Unverified
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Twitter className="h-3 w-3" />
                No X handle
              </div>
            )}
            
            {hasWallet ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Wallet className="h-3 w-3" />
                SOL Wallet
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wallet className="h-3 w-3" />
                No wallet
              </div>
            )}
          </div>
          
          {disabled && (
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
              <p className="font-medium text-foreground mb-1">Help this charity accept crypto!</p>
              {charity.email ? (
                <a 
                  href={`mailto:${charity.email}?subject=Accept%20Crypto%20Donations%20via%20GoodBags&body=Hi%2C%0A%0AI%20wanted%20to%20let%20you%20know%20about%20GoodBags%20(goodbags.io)%20-%20a%20platform%20that%20helps%20charities%20receive%20crypto%20donations.%0A%0ATo%20receive%20donations%2C%20you%20just%20need%20a%20verified%20X%20(Twitter)%20account%20or%20a%20Solana%20wallet.%0A%0ALearn%20more%20at%20goodbags.io`}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3 w-3" />
                  Contact: {charity.email}
                </a>
              ) : charity.website ? (
                <a 
                  href={charity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit website to contact
                </a>
              ) : (
                <span className="text-muted-foreground">Search for their contact info online</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SelectedCharityDisplayProps {
  charity: CharityOption;
  onClear: () => void;
}

export function SelectedCharityDisplay({ charity, onClear }: SelectedCharityDisplayProps) {
  const hasX = !!charity.twitterHandle;
  const isXVerified = hasX && charity.xHandleVerified === true;
  const hasWallet = !!charity.solanaAddress;
  
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-md bg-pink-500/10 flex items-center justify-center">
          {charity.logoUrl ? (
            <img src={charity.logoUrl} alt={charity.name} className="h-10 w-10 rounded object-cover" />
          ) : (
            <Heart className="h-6 w-6 text-pink-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{charity.name}</span>
              {charity.source === "local" && (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {charity.source === "change" && (
                <Badge variant="secondary">
                  <Building2 className="h-3 w-3 mr-1" />
                  Change API
                </Badge>
              )}
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
          
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {isXVerified && (
              <div className="flex items-center gap-1 text-sm text-blue-500">
                <Twitter className="h-4 w-4" />
                <a 
                  href={`https://x.com/${charity.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  @{charity.twitterHandle}
                </a>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 ml-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            )}
            
            {hasWallet && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Wallet className="h-4 w-4" />
                <span>Direct SOL</span>
              </div>
            )}
          </div>
          
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
