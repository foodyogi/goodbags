import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Wallet, Copy, CheckCircle2, Loader2, ExternalLink, Heart, Plus, Building2, Globe, Mail } from "lucide-react";
import { tokenLaunchFormSchema, type TokenLaunchForm, CHARITY_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE, IMPACT_CATEGORIES, type Charity } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface LaunchResult {
  success: boolean;
  token?: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    transactionSignature: string;
  };
  charity?: {
    id: string;
    name: string;
    status: string;
    hasWallet: boolean;
  };
  error?: string;
}

const categoryIcons: Record<string, string> = {
  hunger: "🍲",
  environment: "🌱",
  education: "📚",
  health: "❤️‍🩹",
  animals: "🐾",
  disaster: "🛟",
  community: "👥",
  other: "💝",
};

export function TokenLaunchForm() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [showCustomCharity, setShowCustomCharity] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const form = useForm<TokenLaunchForm>({
    resolver: zodResolver(tokenLaunchFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      initialBuyAmount: "0",
      charityId: "",
    },
  });

  const { data: charities = [], isLoading: charitiesLoading } = useQuery<Charity[]>({
    queryKey: ["/api/charities"],
  });

  const launchMutation = useMutation({
    mutationFn: async (data: TokenLaunchForm) => {
      if (!publicKey) throw new Error("Wallet not connected");
      
      const response = await apiRequest("POST", "/api/tokens/launch", {
        ...data,
        creatorWallet: publicKey.toBase58(),
      });
      return await response.json() as LaunchResult;
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setLaunchResult(data);
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        toast({
          title: "Token Launched Successfully!",
          description: `${data.token.name} (${data.token.symbol}) is now live on Solana`,
        });
        form.reset();
        setShowCustomCharity(false);
        setSelectedCategory("");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredCharities = selectedCategory 
    ? charities.filter(c => c.category === selectedCategory)
    : charities;

  const selectedCharityId = form.watch("charityId");
  const selectedCharity = charities.find(c => c.id === selectedCharityId);

  if (launchResult?.success && launchResult.token) {
    return (
      <Card className="w-full max-w-lg mx-auto border-secondary/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
            <CheckCircle2 className="h-8 w-8 text-secondary" />
          </div>
          <CardTitle className="text-2xl">Token Launched!</CardTitle>
          <CardDescription>
            Your token is now live on Solana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{launchResult.token.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Symbol</span>
              <span className="font-mono font-medium">{launchResult.token.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Mint Address</span>
              <span className="font-mono text-sm">{truncateAddress(launchResult.token.mintAddress)}</span>
            </div>
          </div>

          {launchResult.charity && (
            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Impact Partner</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{launchResult.charity.name}</span>
                <Badge variant={launchResult.charity.hasWallet ? "default" : "secondary"}>
                  {launchResult.charity.hasWallet ? "Verified" : "Pending Wallet"}
                </Badge>
              </div>
              {!launchResult.charity.hasWallet && (
                <p className="text-xs text-muted-foreground mt-2">
                  We&apos;ll contact this charity to set up their Solana wallet
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <a
              href={`https://solscan.io/token/${launchResult.token.mintAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full gap-2" data-testid="button-view-solscan">
                <ExternalLink className="h-4 w-4" />
                View on Solscan
              </Button>
            </a>
            <Button 
              onClick={() => setLaunchResult(null)} 
              className="w-full"
              data-testid="button-launch-another"
            >
              Launch Another Token
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Launch New Token
        </CardTitle>
        <CardDescription>
          Create your memecoin with {CHARITY_FEE_PERCENTAGE}% to charity + {PLATFORM_FEE_PERCENTAGE}% platform fee
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => launchMutation.mutate(data))} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Doge Moon" 
                      {...field} 
                      data-testid="input-token-name"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/32 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. DMOON" 
                      className="uppercase font-mono"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-token-symbol"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/10 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell the world about your token..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-token-description"
                    />
                  </FormControl>
                  <FormDescription>
                    {(field.value || "").length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/token-logo.png" 
                      {...field}
                      data-testid="input-token-image"
                    />
                  </FormControl>
                  <FormDescription>
                    Direct link to your token&apos;s logo image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialBuyAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Buy Amount (SOL)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.1" 
                        {...field}
                        data-testid="input-initial-buy"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        SOL
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Amount of SOL to buy at launch (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Choose Your Impact
              </FormLabel>
              
              <div className="flex flex-wrap gap-2">
                {IMPACT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <span className="mr-1">{categoryIcons[cat.id]}</span>
                    {cat.name}
                  </Button>
                ))}
              </div>

              <FormField
                control={form.control}
                name="charityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Charity</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setShowCustomCharity(true);
                          field.onChange("custom");
                        } else {
                          setShowCustomCharity(false);
                          field.onChange(value);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-charity">
                          <SelectValue placeholder={charitiesLoading ? "Loading..." : "Select a charity or cause"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCharities.map((charity) => (
                          <SelectItem key={charity.id} value={charity.id}>
                            <div className="flex items-center gap-2">
                              <span>{categoryIcons[charity.category] || "💝"}</span>
                              <span>{charity.name}</span>
                              {charity.isFeatured && (
                                <Badge variant="secondary" className="ml-1 text-xs">Featured</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>Add Custom Charity</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCharity && !showCustomCharity && (
                <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedCharity.name}</p>
                      {selectedCharity.description && (
                        <p className="text-xs text-muted-foreground mt-1">{selectedCharity.description}</p>
                      )}
                    </div>
                    {selectedCharity.walletAddress && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {showCustomCharity && (
                <Card className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <FormField
                      control={form.control}
                      name="customCharity.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Building2 className="h-3 w-3" />
                            Charity Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Organization name" 
                              {...field}
                              data-testid="input-custom-charity-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customCharity.category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-custom-charity-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {IMPACT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {categoryIcons[cat.id]} {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customCharity.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Globe className="h-3 w-3" />
                            Website (optional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://..." 
                              {...field}
                              data-testid="input-custom-charity-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customCharity.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            Contact Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="contact@charity.org" 
                              {...field}
                              data-testid="input-custom-charity-email"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            We&apos;ll contact them to set up a Solana wallet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customCharity.walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 text-sm">
                            <Wallet className="h-3 w-3" />
                            Solana Wallet (optional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Charity's Solana wallet address" 
                              className="font-mono text-sm"
                              {...field}
                              data-testid="input-custom-charity-wallet"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            If known, otherwise we&apos;ll help them set one up
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="rounded-lg border border-muted bg-muted/30 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Charity Donation</span>
                <span className="font-medium">{CHARITY_FEE_PERCENTAGE}% of trades</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium">{PLATFORM_FEE_PERCENTAGE}% of trades</span>
              </div>
            </div>

            {!connected ? (
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Connect your wallet to launch a token
                </p>
              </div>
            ) : (
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={launchMutation.isPending}
                data-testid="button-submit-launch"
              >
                {launchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Launch Token
                  </>
                )}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
