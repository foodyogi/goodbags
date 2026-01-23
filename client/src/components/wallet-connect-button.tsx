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

// SessionStorage key to persist deep-link intent across page loads in Phantom's browser
const PHANTOM_DEEP_LINK_KEY = 'goodbags_phantom_deep_link';

// Save deep-link intent to sessionStorage (survives page loads in same browser tab)
function saveDeepLinkIntent(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PHANTOM_DEEP_LINK_KEY, 'true');
    console.log('[WalletConnectButton] Saved deep-link intent to sessionStorage');
  }
}

// Check if we have a deep-link intent (from URL params OR sessionStorage)
function hasDeepLinkIntent(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  // Also check sessionStorage (persists after URL cleanup)
  const hasSessionFlag = sessionStorage.getItem(PHANTOM_DEEP_LINK_KEY) === 'true';
  
  return hasLaunchReady || hasSessionFlag;
}

// Clear the deep-link intent after successful connection
function clearDeepLinkIntent(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PHANTOM_DEEP_LINK_KEY);
  }
}

// Check if we're inside Phantom's in-app browser (more robust detection)
function isInsidePhantomBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check provider directly
  const hasPhantom = hasPhantomProvider();
  
  // Check user agent for Phantom
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantomApp = userAgent.includes('phantom');
  
  // Check if we have deep-link intent (URL params or sessionStorage)
  const hasIntent = hasDeepLinkIntent();
  
  console.log('[WalletConnectButton] isInsidePhantomBrowser check:', { hasPhantom, isPhantomApp, hasIntent, isMobile: isMobileBrowser() });
  
  return hasPhantom || isPhantomApp || (isMobileBrowser() && hasIntent);
}

// Check if we came from a Phantom deep link (form data in URL or sessionStorage)
function cameFromPhantomDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  return hasDeepLinkIntent();
}

function openInPhantomApp(e: React.MouseEvent, redirectPath?: string, formData?: FormDataForPhantom) {
  e.preventDefault();
  e.stopPropagation();
  
  // Save deep-link intent to sessionStorage BEFORE redirecting
  // This ensures it persists even if URL params get cleaned up
  saveDeepLinkIntent();
  
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
  // Also save to sessionStorage when we detect launch_ready=1, so it survives URL cleanup
  const [fromDeepLink] = useState(() => {
    const hasIntent = cameFromPhantomDeepLink();
    if (hasIntent) {
      // Save to sessionStorage in case URL gets cleaned before other components mount
      saveDeepLinkIntent();
      console.log('[WalletConnectButton] Detected deep-link intent on mount, saved to sessionStorage');
    }
    return hasIntent;
  });

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
    
    const maxAttempts = 40; // 40 attempts * 250ms = 10 seconds max (more time for Phantom)
    const checkInterval = setInterval(() => {
      providerCheckCountRef.current++;
      const hasIt = hasPhantomProvider();
      
      console.log(`[WalletConnectButton] Provider check #${providerCheckCountRef.current}/${maxAttempts}: hasProvider=${hasIt}`);
      
      if (hasIt) {
        console.log('[WalletConnectButton] ✓ Phantom provider detected!');
        setProviderReady(true);
        setWaitingForProvider(false);
        clearInterval(checkInterval);
      } else if (providerCheckCountRef.current >= maxAttempts) {
        console.log('[WalletConnectButton] ✗ Provider not found after max attempts');
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
    console.log('[WalletConnectButton] Provider ready, initiating auto-connect...');
    
    const phantomWallet = wallets.find(w => 
      w.adapter.name.toLowerCase().includes('phantom')
    );
    
    if (phantomWallet) {
      console.log('[WalletConnectButton] Found Phantom wallet adapter:', phantomWallet.adapter.name);
      console.log('[WalletConnectButton] Selecting Phantom wallet...');
      select(phantomWallet.adapter.name);
      
      // Small delay to let selection take effect, then connect
      setTimeout(() => {
        console.log('[WalletConnectButton] Calling connect()...');
        connect()
          .then(() => {
            console.log('[WalletConnectButton] ✓ Auto-connect successful!');
            // Clear the deep-link intent after successful connection
            clearDeepLinkIntent();
          })
          .catch((err) => {
            console.log('[WalletConnectButton] ✗ Auto-connect failed:', err?.message || err);
          });
      }, 300);
    } else {
      console.log('[WalletConnectButton] ✗ Phantom wallet not found in adapters');
      console.log('[WalletConnectButton] Available wallets:', wallets.map(w => w.adapter.name).join(', '));
    }
  }, [providerReady, shouldAutoConnect, connected, connecting, wallets, select, connect]);
  
  // Clear deep-link intent when connected
  useEffect(() => {
    if (connected) {
      clearDeepLinkIntent();
    }
  }, [connected]);

  // Handle user-initiated connect
  const handleConnectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // On mobile, if we're NOT inside Phantom's browser, always use deep link
    // This is more reliable than checking providerReady which can be affected by other wallets like Brave
    if (isMobile && !isInPhantom) {
      console.log('[WalletConnectButton] Mobile browser detected without Phantom - opening deep link');
      openInPhantomApp(e, targetRedirectPath, formData);
      return;
    }
    
    // Mark that user explicitly clicked connect
    setUserClickedConnect(true);
    
    // Open the wallet modal (on desktop or inside Phantom browser)
    setVisible(true);
  };

  console.log('[WalletConnectButton] State:', { 
    isMobile, 
    isInPhantom, 
    providerReady, 
    connected, 
    connecting,
    fromDeepLink,
    shouldAutoConnect,
    waitingForProvider 
  });

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
  // On mobile (not in Phantom): shows "Open in Phantom" to use deep link
  // On desktop or inside Phantom: shows "Connect Wallet" for modal
  const showDeepLinkButton = isMobile && !isInPhantom;
  
  return (
    <Button
      type="button"
      onClick={handleConnectClick}
      className={className}
      data-testid={testId}
    >
      {showDeepLinkButton ? (
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
