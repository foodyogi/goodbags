import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Rocket, Wallet, Copy, CheckCircle2, Loader2, ExternalLink, Heart } from "lucide-react";
import { tokenLaunchFormSchema, type TokenLaunchForm, CHARITY_WALLET, CHARITY_NAME, CHARITY_FEE_PERCENTAGE } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface LaunchResult {
  success: boolean;
  token?: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    transactionSignature: string;
  };
  error?: string;
}

export function TokenLaunchForm() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  const form = useForm<TokenLaunchForm>({
    resolver: zodResolver(tokenLaunchFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      initialBuyAmount: "0",
    },
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

  const copyCharityWallet = () => {
    navigator.clipboard.writeText(CHARITY_WALLET);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
          Create your memecoin with automatic {CHARITY_FEE_PERCENTAGE}% charity donations
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

            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {CHARITY_FEE_PERCENTAGE}% royalties to {CHARITY_NAME}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground truncate">
                      {truncateAddress(CHARITY_WALLET)}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={copyCharityWallet}
                      data-testid="button-copy-charity-wallet"
                    >
                      {copiedWallet ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
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
