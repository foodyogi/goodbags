import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Twitter,
  MapPin,
  Search,
  X,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import type { Charity } from "@shared/schema";
import goodbagsLogo from "@assets/goodbagsLOGO_1769291918959.png";

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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline">
                  {categoryNames[charity.category] || charity.category}
                </Badge>
                {charity.countryName && (
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-country-${charity.id}`}>
                    <MapPin className="h-3 w-3 mr-1" />
                    {charity.countryName}
                  </Badge>
                )}
              </div>
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

const ALL_CATEGORIES = ["hunger", "environment", "education", "health", "animals", "disaster", "community", "other"] as const;

export default function CharitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  
  const { data: charities, isLoading } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  const approvedCharities = charities?.filter(c => c.status === "verified") ?? [];
  
  // Calculate unique countries
  const uniqueCountries = new Set(approvedCharities.map(c => c.countryCode).filter(Boolean));
  const countryCount = uniqueCountries.size;
  
  // Get available categories from data
  const availableCategories = useMemo(() => {
    const cats = new Set(approvedCharities.map(c => c.category));
    return ALL_CATEGORIES.filter(cat => cats.has(cat));
  }, [approvedCharities]);
  
  // Filter and sort charities
  const filteredCharities = useMemo(() => {
    let result = [...approvedCharities];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.twitterHandle?.toLowerCase().includes(query) ||
        c.countryName?.toLowerCase().includes(query) ||
        categoryNames[c.category]?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(c => c.category === selectedCategory);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return (categoryNames[a.category] || a.category).localeCompare(categoryNames[b.category] || b.category);
        case "country":
          return (a.countryName || "").localeCompare(b.countryName || "");
        default:
          return 0;
      }
    });
    
    return result;
  }, [approvedCharities, searchQuery, selectedCategory, sortBy]);
  
  const hasFilters = searchQuery.trim() || selectedCategory !== "all";
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src={goodbagsLogo} 
              alt="GoodBags Logo" 
              className="h-20 w-20 rounded-xl object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 mb-4" data-testid="badge-verified-charities">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {approvedCharities.length} Verified Charities
              {countryCount > 0 && ` from ${countryCount} Countries`}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-charities">
            Our Verified Partner Charities
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Every charity on GoodBags is verified via their official X account and nonprofit registration records. 
            Charities claim donations through the Bags.fm app using their verified X account.
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

        {/* Filter and Search Controls */}
        <div className="mb-6 space-y-4" data-testid="section-filters">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search charities by name, cause, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name" data-testid="option-sort-name">Sort A-Z</SelectItem>
                <SelectItem value="category" data-testid="option-sort-category">Sort by Category</SelectItem>
                <SelectItem value="country" data-testid="option-sort-country">Sort by Country</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-all"
            >
              All Categories
            </Badge>
            {availableCategories.map((cat) => {
              const Icon = categoryIcons[cat] || HandHeart;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`filter-${cat}`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {categoryNames[cat] || cat}
                </Badge>
              );
            })}
          </div>
          
          {/* Results count and clear */}
          {hasFilters && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span data-testid="text-results-count">
                Showing {filteredCharities.length} of {approvedCharities.length} charities
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
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
        ) : filteredCharities.length === 0 ? (
          <Card className="text-center py-12" data-testid="card-no-results">
            <CardContent>
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Charities Found</h3>
              <p className="text-muted-foreground mb-4">
                No charities match your search or filter criteria.
              </p>
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCharities.map((charity) => (
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
