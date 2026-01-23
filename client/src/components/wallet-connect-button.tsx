import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Loader2, ChevronDown, LogOut, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FormDataForPhantom {
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;
  initialBuyAmount?: string;
  charityId?: string;
  charityName?: string;
  charitySource?: string;
}

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
  redirectPath?: string;
  formData?: FormDataForPhantom;
}

function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function hasPhantomProvider(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
}

// Check if we're inside Phantom's in-app browser (more robust detection)
function isInsidePhantomBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check provider directly
  const hasPhantom = hasPhantomProvider();
  
  // Check user agent for Phantom
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantomApp = userAgent.includes('phantom');
  
  // Check if URL has launch_ready param (means we came from deep link)
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  return hasPhantom || isPhantomApp || (isMobileBrowser() && hasLaunchReady);
}

// Check if we came from a Phantom deep link (form data in URL)
function cameFromPhantomDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('launch_ready') === '1';
}

function openInPhantomApp(e: React.MouseEvent, redirectPath?: string, formData?: FormDataForPhantom) {
  e.preventDefault();
  e.stopPropagation();
  
  // Build the full URL with form data as URL parameters
  const url = new URL(window.location.origin);
  url.pathname = redirectPath || '/';
  
  // Add form data as URL params so form is pre-filled in Phantom
  if (formData) {
    if (formData.name) url.searchParams.set('name', formData.name);
    if (formData.symbol) url.searchParams.set('symbol', formData.symbol);
    if (formData.description) url.searchParams.set('desc', formData.description);
    if (formData.imageUrl) url.searchParams.set('img', formData.imageUrl);
    if (formData.initialBuyAmount) url.searchParams.set('buy', formData.initialBuyAmount);
    if (formData.charityId) url.searchParams.set('charity', formData.charityId);
    if (formData.charityName) url.searchParams.set('charityName', formData.charityName);
    if (formData.charitySource) url.searchParams.set('charitySource', formData.charitySource);
  }
  
  // Mark this as coming from a launch intent
  url.searchParams.set('launch_ready', '1');
  
  const fullUrl = url.toString();
  
  // Use direct phantom:// scheme to open installed app
  // This opens the URL in Phantom's in-app browser
  const phantomDeepLink = `phantom://browse/${encodeURIComponent(fullUrl)}`;
  
  console.log('[WalletConnectButton] Opening Phantom app with deep link:', phantomDeepLink);
  console.log('[WalletConnectButton] Form data:', formData);
  
  // Try to open the app directly
  window.location.href = phantomDeepLink;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ className, "data-testid": testId, redirectPath, formData }: WalletConnectButtonProps) {
  const { connected, publicKey, connecting, disconnect, select, wallets, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const autoConnectAttemptedRef = useRef(false);
  const [userClickedConnect, setUserClickedConnect] = useState(false);
  const [providerReady, setProviderReady] = useState(hasPhantomProvider());
  const [waitingForProvider, setWaitingForProvider] = useState(false);
  const providerCheckCountRef = useRef(0);
  
  // IMPORTANT: Store deep-link flag in state on mount so it persists even after URL cleanup
  const [fromDeepLink] = useState(() => cameFromPhantomDeepLink());

  const isMobile = isMobileBrowser();
  const isInPhantom = isInsidePhantomBrowser();
  
  const targetRedirectPath = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/launch');

  // Determine if we should auto-connect (came from deep link OR we're in Phantom browser)
  const shouldAutoConnect = fromDeepLink || isInPhantom;
  
  // Poll for Phantom provider (handles timing issues where provider injects after page load)
  useEffect(() => {
    // Only poll if we should auto-connect and don't have provider yet
    if (!shouldAutoConnect || providerReady || connected) return;
    
    setWaitingForProvider(true);
    console.log('[WalletConnectButton] Waiting for Phantom provider to inject...');
    
    const maxAttempts = 20; // 20 attempts * 250ms = 5 seconds max
    const checkInterval = setInterval(() => {
      providerCheckCountRef.current++;
      const hasIt = hasPhantomProvider();
      
      console.log(`[WalletConnectButton] Provider check #${providerCheckCountRef.current}: ${hasIt}`);
      
      if (hasIt) {
        setProviderReady(true);
        setWaitingForProvider(false);
        clearInterval(checkInterval);
      } else if (providerCheckCountRef.current >= maxAttempts) {
        console.log('[WalletConnectButton] Provider not found after max attempts');
        setWaitingForProvider(false);
        clearInterval(checkInterval);
      }
    }, 250);
    
    return () => clearInterval(checkInterval);
  }, [shouldAutoConnect, providerReady, connected]);

  // Auto-connect when provider becomes available and we should auto-connect
  useEffect(() => {
    if (autoConnectAttemptedRef.current) return;
    if (connected || connecting) return;
    if (!providerReady) return;
    if (!shouldAutoConnect) return;
    
    autoConnectAttemptedRef.current = true;
    console.log('[WalletConnectButton] Provider ready, auto-connecting...');
    
    const phantomWallet = wallets.find(w => 
      w.adapter.name.toLowerCase().includes('phantom')
    );
    
    if (phantomWallet) {
      console.log('[WalletConnectButton] Found Phantom wallet, selecting...');
      select(phantomWallet.adapter.name);
      
      // Small delay to let selection take effect
      setTimeout(() => {
        console.log('[WalletConnectButton] Attempting connect...');
        connect().catch((err) => {
          console.log('[WalletConnectButton] Auto-connect failed:', err);
        });
      }, 200);
    } else {
      console.log('[WalletConnectButton] Phantom wallet not found in adapters, available:', wallets.map(w => w.adapter.name));
    }
  }, [providerReady, shouldAutoConnect, connected, connecting, wallets, select, connect]);

  // Handle user-initiated connect
  const handleConnectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // On mobile without provider, open in Phantom with form data
    if (isMobile && !providerReady) {
      openInPhantomApp(e, targetRedirectPath, formData);
      return;
    }
    
    // Mark that user explicitly clicked connect
    setUserClickedConnect(true);
    
    // Open the wallet modal (this is safe - user explicitly clicked)
    setVisible(true);
  };

  console.log('[WalletConnectButton] isMobile:', isMobile, 'providerReady:', providerReady, 'connected:', connected, 'fromDeepLink:', fromDeepLink, 'waitingForProvider:', waitingForProvider);

  // Connected state - show wallet address with dropdown
  if (connected && publicKey) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={className}
            data-testid={testId}
          >
            <Wallet className="h-4 w-4 mr-2" />
            {truncateAddress(publicKey.toBase58())}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <Button
        type="button"
        disabled
        className={className}
        data-testid={testId}
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // Waiting for Phantom provider (came from deep link, detecting wallet)
  if (waitingForProvider && fromDeepLink) {
    return (
      <Button
        type="button"
        disabled
        className={className}
        data-testid={testId}
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Detecting Wallet...
      </Button>
    );
  }

  // Not connected - show connect button
  // On mobile without provider: opens Phantom
  // On desktop or with provider: opens wallet modal
  return (
    <Button
      type="button"
      onClick={handleConnectClick}
      className={className}
      data-testid={testId}
    >
      {isMobile && !providerReady ? (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Phantom
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
