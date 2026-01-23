import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
import { z } from "zod";

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
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
import { Rocket, Wallet, CheckCircle2, Loader2, ExternalLink, Heart, AlertTriangle, Shield, Upload, Link as LinkIcon, Info, Coins, FlaskConical, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CHARITY_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { CharitySearch, SelectedCharityDisplay } from "@/components/charity-search";
import { useUpload } from "@/hooks/use-upload";

// Helper to get URL params (works in Phantom browser)
function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

// LocalStorage key for persisting form data across wallet connection round-trips
const FORM_DATA_STORAGE_KEY = 'goodbags_token_form_data';

interface StoredFormData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  initialBuyAmount: string;
  charity?: {
    id: string;
    name: string;
    category: string;
    source: 'local' | 'change';
    solanaAddress?: string | null;
  };
  timestamp: number;
}

// Save form data to localStorage (called before wallet connection redirect)
function saveFormDataToStorage(data: Omit<StoredFormData, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    const stored: StoredFormData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(stored));
    console.log('[TokenLaunchForm] Form data saved to localStorage');
  } catch (e) {
    console.error('[TokenLaunchForm] Failed to save form data:', e);
  }
}

// Load form data from localStorage (called on mount)
function loadFormDataFromStorage(): StoredFormData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(FORM_DATA_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as StoredFormData;
    // Only use stored data if it's less than 30 minutes old
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - data.timestamp > thirtyMinutes) {
      clearFormDataFromStorage();
      return null;
    }
    return data;
  } catch (e) {
    console.error('[TokenLaunchForm] Failed to load form data:', e);
    return null;
  }
}

// Clear form data from localStorage (called after successful launch or form reset)
function clearFormDataFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FORM_DATA_STORAGE_KEY);
    console.log('[TokenLaunchForm] Form data cleared from localStorage');
  } catch (e) {
    console.error('[TokenLaunchForm] Failed to clear form data:', e);
  }
}

interface TokenNameSearchResult {
  local: { name: string; symbol: string; mintAddress: string }[];
  external: { name: string; symbol: string; mintAddress: string; launchpad?: string }[];
  hasExternalSearch: boolean;
}

interface SelectedCharity {
  id: string;
  name: string;
  mission?: string | null;
  category: string;
  website?: string | null;
  logoUrl?: string | null;
  solanaAddress?: string | null;
  twitterHandle?: string | null;
  countryName?: string | null;
  source: "local" | "change";
}

type ImageSourceType = "url" | "upload";

const tokenLaunchFormSchemaWithCharity = z.object({
  name: z.string().min(1, "Token name is required").max(32, "Token name must be 32 characters or less"),
  symbol: z.string().min(1, "Ticker is required").max(10, "Ticker must be 10 characters or less").toUpperCase(),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  initialBuyAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Initial buy amount must be a valid number"),
});

type TokenLaunchFormData = z.infer<typeof tokenLaunchFormSchemaWithCharity>;

interface LaunchResult {
  success: boolean;
  isTest?: boolean;
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
  const { connected, publicKey, signTransaction, signAllTransactions, connecting } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchStep, setLaunchStep] = useState<LaunchStep>("idle");
  const [selectedCharity, setSelectedCharity] = useState<SelectedCharity | null>(null);
  const [imageSource, setImageSource] = useState<ImageSourceType>("url");
  
  // Test Mode - allows testing the full flow without real transactions
  const [testMode, setTestMode] = useState(false);
  
  // Token name duplicate detection
  const [nameSearchResults, setNameSearchResults] = useState<TokenNameSearchResult | null>(null);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const nameSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if form was pre-filled from URL or localStorage (mobile flow)
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(false);
  const urlParamsProcessedRef = useRef(false);
  const formRestoredRef = useRef(false);
  
  // Ref to launch button section for auto-scroll after wallet connection
  const launchButtonRef = useRef<HTMLDivElement>(null);
  
  // Track previous connection state for detecting wallet connection
  const wasConnectedRef = useRef(connected);
  
  // Wallet adapter is required for signing transactions (real launches)
  const hasWalletForSigning = connected && publicKey;
  
  // Image upload
  const { uploadFile, isUploading: isUploadingImage, progress: uploadProgress } = useUpload({
    onSuccess: (response) => {
      // Set the object path as the image URL - server will serve it
      const imageUrl = window.location.origin + response.objectPath;
      form.setValue("imageUrl", imageUrl);
      setImageSource("url");
      toast({
        title: "Image Uploaded",
        description: "Your token image has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: bagsStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/bags/status"],
  });

  const form = useForm<TokenLaunchFormData>({
    resolver: zodResolver(tokenLaunchFormSchemaWithCharity),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      initialBuyAmount: "0",
    },
  });

  // Populate form from URL params (mobile flow - coming from Phantom deep link)
  useEffect(() => {
    // Only run once
    if (urlParamsProcessedRef.current) return;
    
    const params = getUrlParams();
    const launchReady = params.get('launch_ready') === '1';
    
    if (!launchReady) return;
    
    urlParamsProcessedRef.current = true;
    console.log('[TokenLaunchForm] Detected launch_ready params, populating form...');
    
    // Populate form fields
    const name = params.get('name');
    const symbol = params.get('symbol');
    const desc = params.get('desc');
    const img = params.get('img');
    const buy = params.get('buy');
    
    if (name) form.setValue('name', name);
    if (symbol) form.setValue('symbol', symbol);
    if (desc) form.setValue('description', desc);
    if (img) form.setValue('imageUrl', img);
    if (buy) form.setValue('initialBuyAmount', buy);
    
    // Populate charity if passed
    const charityId = params.get('charity');
    const charityName = params.get('charityName');
    const charitySource = params.get('charitySource') as 'local' | 'change' | null;
    
    if (charityId && charityName && charitySource) {
      setSelectedCharity({
        id: charityId,
        name: charityName,
        category: 'general',
        source: charitySource,
      });
    }
    
    setPrefilledFromUrl(true);
    
    // Clean up URL params (optional - keeps URL clean)
    const cleanUrl = new URL(window.location.href);
    cleanUrl.search = '';
    window.history.replaceState({}, '', cleanUrl.toString());
    
    console.log('[TokenLaunchForm] Form populated from URL params');
  }, [form]);
  
  // Fallback: Restore form data from localStorage if URL params weren't available
  useEffect(() => {
    // Only run once, and only if URL params weren't processed
    if (formRestoredRef.current || urlParamsProcessedRef.current) return;
    formRestoredRef.current = true;
    
    const storedData = loadFormDataFromStorage();
    if (!storedData) return;
    
    console.log('[TokenLaunchForm] Restoring form data from localStorage...');
    
    // Restore form fields
    if (storedData.name) form.setValue('name', storedData.name);
    if (storedData.symbol) form.setValue('symbol', storedData.symbol);
    if (storedData.description) form.setValue('description', storedData.description);
    if (storedData.imageUrl) form.setValue('imageUrl', storedData.imageUrl);
    if (storedData.initialBuyAmount) form.setValue('initialBuyAmount', storedData.initialBuyAmount);
    
    // Restore charity selection
    if (storedData.charity) {
      setSelectedCharity({
        id: storedData.charity.id,
        name: storedData.charity.name,
        category: storedData.charity.category,
        source: storedData.charity.source,
        solanaAddress: storedData.charity.solanaAddress,
      });
    }
    
    // Check if any data was actually restored
    const hasData = storedData.name || storedData.symbol || storedData.charity;
    if (hasData) {
      setPrefilledFromUrl(true);
      console.log('[TokenLaunchForm] Form restored from localStorage');
    }
  }, [form]);
  
  // Auto-scroll to launch button when wallet connects (after returning from Phantom)
  useEffect(() => {
    const justConnected = connected && !wasConnectedRef.current;
    wasConnectedRef.current = connected;
    
    if (justConnected && prefilledFromUrl && launchButtonRef.current) {
      // Small delay to let the UI update
      setTimeout(() => {
        launchButtonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        console.log('[TokenLaunchForm] Auto-scrolled to launch button after wallet connection');
      }, 300);
    }
  }, [connected, prefilledFromUrl]);

  // Watch the name field for debounced duplicate detection
  const watchedName = form.watch("name");
  
  useEffect(() => {
    // Clear previous timeout
    if (nameSearchTimeoutRef.current) {
      clearTimeout(nameSearchTimeoutRef.current);
    }
    
    // Clear results if name is too short
    if (!watchedName || watchedName.trim().length < 2) {
      setNameSearchResults(null);
      setIsSearchingName(false);
      return;
    }
    
    setIsSearchingName(true);
    
    // Debounce the search by 500ms
    nameSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tokens/search/name?q=${encodeURIComponent(watchedName.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setNameSearchResults(data);
        }
      } catch (error) {
        console.error("Token name search error:", error);
      } finally {
        setIsSearchingName(false);
      }
    }, 500);
    
    return () => {
      if (nameSearchTimeoutRef.current) {
        clearTimeout(nameSearchTimeoutRef.current);
      }
    };
  }, [watchedName]);

  const launchMutation = useMutation({
    mutationFn: async (data: TokenLaunchFormData) => {
      if (!selectedCharity) throw new Error("Please select a charity");
      
      // Test Mode: Simulate the flow and save test token to database
      if (testMode) {
        setLaunchStep("preparing");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setLaunchStep("signing-config");
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setLaunchStep("signing-launch");
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setLaunchStep("recording");
        
        // Generate mock addresses for test token
        const mockMintAddress = `TEST${Math.random().toString(36).substring(2, 10).toUpperCase()}${Date.now()}`;
        const mockTxSignature = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        // Use connected wallet or generate a valid-length test wallet address
        const testCreatorWallet = publicKey?.toBase58() || `TEST_WALLET_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        // Save test token to database
        const launchResponse = await apiRequest("POST", "/api/tokens/launch", {
          ...data,
          charityId: selectedCharity.id,
          charitySource: selectedCharity.source,
          charitySolanaAddress: selectedCharity.solanaAddress,
          creatorWallet: testCreatorWallet,
          mintAddress: mockMintAddress,
          transactionSignature: mockTxSignature,
          isTest: true,
        });
        const launchResult = await launchResponse.json();
        
        if (!launchResult.success) {
          throw new Error(launchResult.error || "Failed to save test token");
        }
        
        return launchResult as LaunchResult;
      }
      
      // Real Mode: Requires wallet connection
      if (!publicKey) throw new Error("Wallet not connected");
      
      const creatorWallet = publicKey.toBase58();
      
      // Step 1: Prepare token metadata
      setLaunchStep("preparing");
      const prepareResponse = await apiRequest("POST", "/api/tokens/prepare", {
        ...data,
        charityId: selectedCharity.id,
        charitySource: selectedCharity.source,
        charitySolanaAddress: selectedCharity.solanaAddress,
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
        // Wallet must support signing for real transactions
        if (!signTransaction) {
          throw new Error("Wallet does not support signing. Please use a compatible wallet.");
        }

        // Step 2: Create and sign fee share config transactions
        // Send charityId for server-side validation (security: server looks up charity wallet)
        setLaunchStep("signing-config");
        const configResponse = await apiRequest("POST", "/api/tokens/config", {
          tokenMint,
          creatorWallet,
          charityId: selectedCharity.id,
          charitySource: selectedCharity.source,
          charitySolanaAddress: selectedCharity.solanaAddress,
        });
        const configResult = await configResponse.json();
        
        if (!configResult.success) {
          throw new Error(configResult.error || "Failed to create config");
        }

        // Sign and send config transactions if any
        if (configResult.transactions && configResult.transactions.length > 0) {
          for (const txBase64 of configResult.transactions) {
            const txBytes = base64ToUint8Array(txBase64);
            const tx = VersionedTransaction.deserialize(txBytes);
            const signedTx = await signTransaction(tx);
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            const confirmation = await connection.confirmTransaction(sig, "confirmed");
            if (confirmation.value.err) {
              throw new Error(`Config transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }
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
          const txBytes = base64ToUint8Array(launchTxResult.transaction);
          const tx = VersionedTransaction.deserialize(txBytes);
          const signedTx = await signTransaction(tx);
          transactionSignature = await connection.sendRawTransaction(signedTx.serialize());
          const confirmation = await connection.confirmTransaction(transactionSignature, "confirmed");
          if (confirmation.value.err) {
            throw new Error(`Launch transaction failed: ${JSON.stringify(confirmation.value.err)}`);
          }
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
        // Clear stored form data after successful launch
        clearFormDataFromStorage();
        setPrefilledFromUrl(false);
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
    if (testMode) {
      // Test mode messages (no wallet signing)
      switch (launchStep) {
        case "preparing":
          return "Simulating token creation...";
        case "signing-config":
          return "Simulating configuration...";
        case "signing-launch":
          return "Simulating launch...";
        case "recording":
          return "Finalizing test...";
        default:
          return "Running test...";
      }
    }
    // Real mode messages
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

  const handleCharitySelect = (charity: { 
    id: string; 
    name: string; 
    mission?: string | null; 
    category: string; 
    website?: string | null; 
    logoUrl?: string | null; 
    solanaAddress?: string | null;
    twitterHandle?: string | null;
    countryName?: string | null;
    source: "local" | "change";
  }) => {
    const rawId = charity.id.replace(/^(local-|change-)/, "");
    const source = charity.source;
    setSelectedCharity({
      ...charity,
      id: rawId,
      source,
    });
  };

  if (launchResult?.success && launchResult.token) {
    return (
      <Card className="w-full max-w-lg mx-auto border-secondary/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
            <CheckCircle2 className="h-8 w-8 text-secondary" />
          </div>
          <CardTitle className="text-2xl">
            {launchResult.isTest ? "Test Launch Complete!" : "Token Launched!"}
          </CardTitle>
          <CardDescription>
            {launchResult.isTest 
              ? "This was a test - no real token was created"
              : "Your token is now live on Solana"
            }
          </CardDescription>
          {launchResult.isTest && (
            <Badge variant="secondary" className="mt-2 gap-1" data-testid="badge-test-mode">
              <FlaskConical className="h-3 w-3" />
              Test Mode
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{launchResult.token.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ticker</span>
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
            <Link href="/dashboard">
              <Button className="w-full gap-2" data-testid="button-view-dashboard">
                <LayoutDashboard className="h-4 w-4" />
                View Dashboard
              </Button>
            </Link>
            {!launchResult.isTest && (
              <>
                <a
                  href={`https://bags.fm/${launchResult.token.mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="secondary" className="w-full gap-2" data-testid="button-view-bags">
                    <ExternalLink className="h-4 w-4" />
                    View on Bags.fm
                  </Button>
                </a>
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
              </>
            )}
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                clearFormDataFromStorage();
                setSelectedCharity(null);
                setLaunchResult(null);
              }} 
              className="w-full"
              data-testid="button-launch-another"
            >
              {launchResult.isTest ? "Try Another Test" : "Launch Another Token"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Login is now optional - users just need wallet connection like Bags.fm

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
        {/* Ready to Launch Status - shows when form is pre-filled from mobile deep link */}
        {prefilledFromUrl && hasWalletForSigning && !testMode && (
          <div className="mb-4 rounded-lg border border-primary/50 bg-primary/10 p-4" data-testid="ready-to-launch-status">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-bold text-primary">
                Ready to Launch!
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your token details have been saved. Review below and click "Launch Token" to mint on Solana.
            </p>
          </div>
        )}

        {/* Waiting for wallet connection - shows when form pre-filled but wallet not yet connected */}
        {prefilledFromUrl && !hasWalletForSigning && !testMode && connecting && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4" data-testid="connecting-wallet-status">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Connecting Wallet...
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Please approve the connection request in your wallet.
            </p>
          </div>
        )}

        {/* Form pre-filled but wallet not connected (and not currently connecting) */}
        {prefilledFromUrl && !hasWalletForSigning && !testMode && !connecting && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4" data-testid="wallet-needed-status">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Connect Wallet to Launch
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Your token details are saved below. Connect your wallet to complete the launch.
            </p>
            <WalletMultiButton className="!h-9 !text-sm" />
          </div>
        )}
        
        {/* Wallet Status Indicator */}
        {hasWalletForSigning && !testMode && !prefilledFromUrl && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-3" data-testid="wallet-connected-status">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Wallet Connected
              </p>
              <p className="text-xs text-muted-foreground">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </p>
            </div>
            <WalletMultiButton 
              className="!bg-transparent !p-0 !h-auto !text-xs !text-muted-foreground hover:!text-foreground"
            />
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => launchMutation.mutate(data))} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="e.g. Doge Moon" 
                        {...field} 
                        data-testid="input-token-name"
                      />
                    </FormControl>
                    {isSearchingName && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <FormDescription>
                    {field.value.length}/32 characters
                  </FormDescription>
                  
                  {/* Duplicate name warning */}
                  {nameSearchResults && (nameSearchResults.local.length > 0 || nameSearchResults.external.length > 0) && (
                    <div className="mt-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm" data-testid="warning-token-name-exists">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <p className="font-medium text-amber-700 dark:text-amber-400">
                            Similar tokens found on Bags.fm
                          </p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {nameSearchResults.local.slice(0, 3).map((token) => (
                              <div key={token.mintAddress} className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">GoodBags</Badge>
                                <span>{token.name} ({token.symbol})</span>
                              </div>
                            ))}
                            {nameSearchResults.external.slice(0, 3).map((token) => (
                              <div key={token.mintAddress} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Bags.fm</Badge>
                                <span>{token.name} ({token.symbol})</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-amber-600 dark:text-amber-500">
                            You can still launch, but consider a unique name to avoid confusion.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker</FormLabel>
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

            {/* Image Source Selection */}
            <div className="space-y-3">
              <FormLabel>Token Image (optional)</FormLabel>
              <RadioGroup
                value={imageSource}
                onValueChange={(value) => setImageSource(value as ImageSourceType)}
                className="grid grid-cols-2 gap-2"
              >
                <div>
                  <RadioGroupItem value="url" id="image-url" className="peer sr-only" />
                  <Label
                    htmlFor="image-url"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    data-testid="radio-image-url"
                  >
                    <LinkIcon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">URL</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="upload" id="image-upload" className="peer sr-only" />
                  <Label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    data-testid="radio-image-upload"
                  >
                    <Upload className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">Upload</span>
                  </Label>
                </div>
              </RadioGroup>
              
              {imageSource === "url" && (
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
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
              )}
              
              {imageSource === "upload" && (
                <div className="rounded-lg border-2 border-dashed border-muted p-6 text-center">
                  {isUploadingImage ? (
                    <div className="space-y-3">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to select an image file
                      </p>
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="max-w-[200px] mx-auto"
                        data-testid="input-image-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast({
                                title: "File Too Large",
                                description: "Please select an image under 10MB.",
                                variant: "destructive",
                              });
                              return;
                            }
                            await uploadFile(file);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG, GIF, or WebP up to 10MB
                      </p>
                    </>
                  )}
                </div>
              )}
              
            </div>

            <FormField
              control={form.control}
              name="initialBuyAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    Initial Buy Amount (SOL)
                  </FormLabel>
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
                  
                  {/* SOL Funding Best Practice Guidance */}
                  <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2" data-testid="section-sol-guidance">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Best Practice Guidance</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 pl-6 list-disc">
                      <li><strong>Minimum recommended:</strong> 0.1 SOL to create initial liquidity</li>
                      <li><strong>Moderate launch:</strong> 0.5 - 1 SOL for better price stability</li>
                      <li><strong>Strong launch:</strong> 2+ SOL for significant initial market cap</li>
                      <li><strong>Transaction fee:</strong> ~0.01 SOL is needed for network fees</li>
                    </ul>
                    <p className="text-xs text-muted-foreground pt-1 border-t border-blue-500/10">
                      Higher initial buy = larger starting market cap and more trading liquidity
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Choose Your Cause
              </FormLabel>
              {selectedCharity ? (
                <SelectedCharityDisplay 
                  charity={selectedCharity} 
                  onClear={() => setSelectedCharity(null)} 
                />
              ) : (
                <CharitySearch 
                  onSelect={handleCharitySelect}
                  selectedId={null}
                />
              )}
              {!selectedCharity && (
                <p className="text-xs text-destructive">Please select a charity to continue</p>
              )}
            </div>

            <div className="rounded-lg border border-muted bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Charity Donation</span>
                <span className="font-medium">{CHARITY_FEE_PERCENTAGE}% of trades</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium">{PLATFORM_FEE_PERCENTAGE}% of trades</span>
              </div>
              <div className="pt-2 border-t border-muted">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">How donations work:</span>{" "}
                  Charities with an X account claim donations via{" "}
                  <a href="https://bags.fm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bags.fm</a>. 
                  Charities with Solana wallets receive instant transfers.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3" data-testid="disclosure-accountability">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-500">Creator Accountability</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By launching this token, you understand:
                  </p>
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 pl-6 list-disc">
                <li>
                  <strong>Charity Notification:</strong> The selected charity will be notified about your token and can review it.
                </li>
                <li>
                  <strong>Approval Required:</strong> Charities can approve or deny tokens. Approved tokens are labeled &quot;Official&quot; while denied tokens show &quot;Not Endorsed&quot;.
                </li>
                <li>
                  <strong>Wallet Tracking:</strong> Your creator wallet address is permanently recorded on-chain and linked to this token.
                </li>
                <li>
                  <strong>Reputation:</strong> Creating tokens without charity approval may damage your reputation and future tokens.
                </li>
              </ul>
              <div className="flex items-center gap-2 pt-2 border-t border-yellow-500/20">
                <Shield className="h-3.5 w-3.5 text-green-600" />
                <p className="text-xs text-green-600 dark:text-green-500">
                  GoodBags protects charities from misrepresentation
                </p>
              </div>
            </div>

            {/* Test Mode Toggle */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4" data-testid="section-test-mode">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Test Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Simulate a launch without real transactions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={testMode}
                  onCheckedChange={setTestMode}
                  data-testid="switch-test-mode"
                />
              </div>
              {testMode && (
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    No wallet required. No SOL spent. No real token created. Perfect for testing the flow.
                  </p>
                </div>
              )}
            </div>

            <div ref={launchButtonRef}>
              {!hasWalletForSigning && !testMode ? (
                <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect your wallet to launch your token
                  </p>
                  <WalletConnectButton 
                    redirectPath="/"
                    formData={{
                      name: form.getValues('name'),
                      symbol: form.getValues('symbol'),
                      description: form.getValues('description'),
                      imageUrl: form.getValues('imageUrl'),
                      initialBuyAmount: form.getValues('initialBuyAmount'),
                      charityId: selectedCharity?.id,
                      charityName: selectedCharity?.name,
                      charitySource: selectedCharity?.source,
                    }}
                    onBeforeRedirect={() => {
                      // Save form data to localStorage before wallet redirect
                      saveFormDataToStorage({
                        name: form.getValues('name') || '',
                        symbol: form.getValues('symbol') || '',
                        description: form.getValues('description') || '',
                        imageUrl: form.getValues('imageUrl') || '',
                        initialBuyAmount: form.getValues('initialBuyAmount') || '0',
                        charity: selectedCharity ? {
                          id: selectedCharity.id,
                          name: selectedCharity.name,
                          category: selectedCharity.category,
                          source: selectedCharity.source,
                          solanaAddress: selectedCharity.solanaAddress,
                        } : undefined,
                      });
                    }}
                    data-testid="button-connect-wallet-launch"
                  />
                </div>
              ) : (
                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={launchMutation.isPending || !selectedCharity}
                  data-testid="button-submit-launch"
                >
                  {launchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {getStepMessage()}
                    </>
                  ) : testMode ? (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      Test Launch
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Launch Token
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
