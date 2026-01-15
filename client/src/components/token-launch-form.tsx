import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
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
import { Rocket, Wallet, CheckCircle2, Loader2, ExternalLink, Heart } from "lucide-react";
import { CHARITY_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE, VETTED_CHARITIES, tokenLaunchFormSchema, type TokenLaunchForm } from "@shared/schema";
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

type LaunchStep = "idle" | "preparing" | "signing-config" | "signing-launch" | "recording" | "complete";

export function TokenLaunchForm() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchStep, setLaunchStep] = useState<LaunchStep>("idle");

  const { data: bagsStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/bags/status"],
  });

  const form = useForm<TokenLaunchForm>({
    resolver: zodResolver(tokenLaunchFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      initialBuyAmount: "0",
      charityId: VETTED_CHARITIES[0].id,
    },
  });

  const launchMutation = useMutation({
    mutationFn: async (data: TokenLaunchForm) => {
      if (!publicKey) throw new Error("Wallet not connected");
      if (!signTransaction) throw new Error("Wallet does not support signing");
      
      const creatorWallet = publicKey.toBase58();
      
      // Step 1: Prepare token metadata
      setLaunchStep("preparing");
      const prepareResponse = await apiRequest("POST", "/api/tokens/prepare", {
        ...data,
        creatorWallet,
      });
      const prepareResult = await prepareResponse.json();
      
      if (!prepareResult.success) {
        throw new Error(prepareResult.error || "Failed to prepare token");
      }

      const { tokenMint, metadataUrl, mock } = prepareResult;
      let transactionSignature = "";

      // If SDK is configured (not mock mode), handle signing
      if (!mock) {
        // Step 2: Create and sign fee share config transactions
        setLaunchStep("signing-config");
        const configResponse = await apiRequest("POST", "/api/tokens/config", {
          tokenMint,
          creatorWallet,
        });
        const configResult = await configResponse.json();
        
        if (!configResult.success) {
          throw new Error(configResult.error || "Failed to create config");
        }

        // Sign and send config transactions if any
        if (configResult.transactions && configResult.transactions.length > 0) {
          for (const txBase64 of configResult.transactions) {
            const txBuffer = Buffer.from(txBase64, "base64");
            const tx = VersionedTransaction.deserialize(txBuffer);
            const signedTx = await signTransaction(tx);
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(sig, "confirmed");
          }
        }

        // Step 3: Create and sign launch transaction
        setLaunchStep("signing-launch");
        const launchTxResponse = await apiRequest("POST", "/api/tokens/launch-tx", {
          tokenMint,
          metadataUrl,
          configKey: configResult.configKey,
          creatorWallet,
          initialBuyAmountSol: data.initialBuyAmount,
        });
        const launchTxResult = await launchTxResponse.json();
        
        if (!launchTxResult.success) {
          throw new Error(launchTxResult.error || "Failed to create launch transaction");
        }

        if (launchTxResult.transaction) {
          const txBuffer = Buffer.from(launchTxResult.transaction, "base64");
          const tx = VersionedTransaction.deserialize(txBuffer);
          const signedTx = await signTransaction(tx);
          transactionSignature = await connection.sendRawTransaction(signedTx.serialize());
          await connection.confirmTransaction(transactionSignature, "confirmed");
        }
      }

      // Step 4: Record the launch in our database
      setLaunchStep("recording");
      const recordResponse = await apiRequest("POST", "/api/tokens/launch", {
        ...data,
        creatorWallet,
        mintAddress: tokenMint,
        transactionSignature: transactionSignature || `mock_tx_${Date.now()}`,
      });
      
      return await recordResponse.json() as LaunchResult;
    },
    onSuccess: (data) => {
      setLaunchStep("complete");
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
      setLaunchStep("idle");
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStepMessage = () => {
    switch (launchStep) {
      case "preparing":
        return "Creating token metadata...";
      case "signing-config":
        return "Please sign the fee configuration transaction...";
      case "signing-launch":
        return "Please sign the launch transaction...";
      case "recording":
        return "Recording launch to database...";
      default:
        return "Launching...";
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const selectedCharityId = form.watch("charityId");
  const selectedCharity = VETTED_CHARITIES.find(c => c.id === selectedCharityId);

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
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <a
              href={`https://solscan.io/token/${launchResult.token.mintAddress}`}
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
        {bagsStatus?.configured === false && (
          <div className="mt-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 p-2 text-xs text-yellow-600 dark:text-yellow-400">
            Development mode: Tokens will be simulated (Bags SDK not configured)
          </div>
        )}
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

            <FormField
              control={form.control}
              name="charityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Choose Your Cause
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-charity">
                        <SelectValue placeholder="Select a charity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VETTED_CHARITIES.map((charity) => (
                        <SelectItem key={charity.id} value={charity.id}>
                          <div className="flex items-center gap-2">
                            <span>{charity.category === "hunger" ? "🍲" : "🐾"}</span>
                            <span>{charity.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCharity && (
              <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedCharity.category === "hunger" ? "🍲" : "🐾"}</span>
                    <span className="font-medium">{selectedCharity.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedCharity.description}</p>
                {selectedCharity.website && (
                  <a 
                    href={selectedCharity.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    {selectedCharity.website}
                  </a>
                )}
              </div>
            )}

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
                    {getStepMessage()}
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
