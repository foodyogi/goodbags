import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Loader2, ChevronDown, LogOut, RefreshCw, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  onBeforeRedirect?: () => void;
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

// Check if URL has launch_ready param (definitive proof we came from deep link)
function hasLaunchReadyParam(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('launch_ready') === '1';
}

// Check if we have a deep-link intent
// IMPORTANT: Only trust sessionStorage if we ALSO have Phantom provider OR URL params
// This prevents stale sessionStorage from causing issues in non-Phantom browsers
function hasDeepLinkIntent(): boolean {
  if (typeof window === 'undefined') return false;
  
  // URL params are definitive proof
  if (hasLaunchReadyParam()) {
    return true;
  }
  
  // SessionStorage is only valid if we have Phantom provider
  // (meaning we're actually in Phantom's browser)
  const hasSessionFlag = sessionStorage.getItem(PHANTOM_DEEP_LINK_KEY) === 'true';
  if (hasSessionFlag && hasPhantomProvider()) {
    return true;
  }
  
  // If we have sessionStorage flag but NO Phantom provider, clear it (stale flag)
  if (hasSessionFlag && !hasPhantomProvider()) {
    console.log('[WalletConnectButton] Clearing stale sessionStorage flag (not in Phantom)');
    sessionStorage.removeItem(PHANTOM_DEEP_LINK_KEY);
  }
  
  return false;
}

// Clear the deep-link intent after successful connection
function clearDeepLinkIntent(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PHANTOM_DEEP_LINK_KEY);
  }
}

// Check if we're inside Phantom's in-app browser (strict detection)
// This is used to decide whether to use our custom mobile modal or the standard wallet adapter modal
function isInsidePhantomBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check specifically for Phantom provider (not just any Solana wallet)
  // Brave browser has its own Solana wallet which we don't want to detect as "Phantom"
  const hasPhantom = hasPhantomProvider();
  
  // Check user agent for Phantom app specifically
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantomApp = userAgent.includes('phantom');
  
  // Check URL params (definitive proof we came from deep link)
  const hasUrlParam = hasLaunchReadyParam();
  
  console.log('[WalletConnectButton] isInsidePhantomBrowser check:', { 
    hasPhantom, 
    isPhantomApp, 
    hasUrlParam, 
    isMobile: isMobileBrowser() 
  });
  
  // On mobile, we're ONLY inside Phantom if:
  // 1. We have the Phantom provider AND we're in the Phantom user agent, OR
  // 2. We have URL params from a deep link (definitive proof)
  // This prevents Brave's built-in wallet from triggering "inside Phantom" detection
  if (isMobileBrowser()) {
    // On mobile, require either URL params OR (Phantom provider + Phantom user agent)
    return hasUrlParam || (hasPhantom && isPhantomApp);
  }
  
  // On desktop, having the Phantom provider is sufficient
  return hasPhantom || isPhantomApp || hasUrlParam;
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

export function WalletConnectButton({ className, "data-testid": testId, redirectPath, formData, onBeforeRedirect }: WalletConnectButtonProps) {
  const { connected, publicKey, connecting, disconnect, select, wallets, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const autoConnectAttemptedRef = useRef(false);
  const [userClickedConnect, setUserClickedConnect] = useState(false);
  const [providerReady, setProviderReady] = useState(hasPhantomProvider());
  const [waitingForProvider, setWaitingForProvider] = useState(false);
  const providerCheckCountRef = useRef(0);
  const [showMobileWalletModal, setShowMobileWalletModal] = useState(false);
  
  // IMPORTANT: Store deep-link flag in state on mount so it persists even after URL cleanup
  // Only save to sessionStorage if we have definitive proof (URL params)
  const [fromDeepLink] = useState(() => {
    // First, clear any stale sessionStorage flags if we're NOT in Phantom
    // This prevents false positives on mobile browsers
    const hasPhantom = hasPhantomProvider();
    const hasUrlParam = hasLaunchReadyParam();
    const hasSessionFlag = typeof window !== 'undefined' && 
      sessionStorage.getItem(PHANTOM_DEEP_LINK_KEY) === 'true';
    
    // If we have sessionStorage but no Phantom provider and no URL params, it's stale
    if (hasSessionFlag && !hasPhantom && !hasUrlParam) {
      console.log('[WalletConnectButton] Clearing stale sessionStorage on mount');
      sessionStorage.removeItem(PHANTOM_DEEP_LINK_KEY);
      return false;
    }
    
    const hasIntent = cameFromPhantomDeepLink();
    if (hasIntent && hasUrlParam) {
      // Only save to sessionStorage if we have URL params (definitive proof)
      saveDeepLinkIntent();
      console.log('[WalletConnectButton] Detected deep-link from URL params, saved to sessionStorage');
    }
    return hasIntent;
  });

  const isMobile = isMobileBrowser();
  const isInPhantom = isInsidePhantomBrowser();
  
  const targetRedirectPath = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/launch');

  // Determine if we should auto-connect (came from deep link OR we're in Phantom browser)
  const shouldAutoConnect = fromDeepLink || isInPhantom;
  
  // Poll for Phantom provider (handles timing issues where provider injects after page load)
  // IMPORTANT: Only poll on mobile if we have strong evidence of being in Phantom browser
  useEffect(() => {
    // Only poll if we should auto-connect and don't have provider yet
    if (!shouldAutoConnect || providerReady || connected) return;
    
    // On mobile, only poll if we have URL param evidence (definitive proof of deep link)
    // This prevents polling/waiting on regular mobile browsers
    if (isMobile && !hasLaunchReadyParam()) {
      console.log('[WalletConnectButton] Skipping provider poll: mobile without URL params');
      return;
    }
    
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
  // IMPORTANT: Only auto-connect if we're actually inside Phantom's browser (has provider)
  // Never try to auto-connect on regular mobile browsers - this can cause unwanted redirects
  useEffect(() => {
    if (autoConnectAttemptedRef.current) return;
    if (connected || connecting) return;
    if (!providerReady) return;
    if (!shouldAutoConnect) return;
    
    // Extra safety: on mobile, only auto-connect if we actually have Phantom provider
    // This prevents any redirect attempts on regular mobile browsers
    if (isMobile && !hasPhantomProvider()) {
      console.log('[WalletConnectButton] Skipping auto-connect: mobile without Phantom provider');
      return;
    }
    
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
    
    // Re-check mobile status at click time (not just render time)
    // This handles edge cases where browser state changes between render and click
    const isMobileNow = isMobileBrowser();
    const isInPhantomNow = isInsidePhantomBrowser();
    
    console.log('[WalletConnectButton] handleConnectClick - isMobileNow:', isMobileNow, 'isInPhantomNow:', isInPhantomNow);
    
    // On mobile, if we're NOT inside Phantom's browser, show our custom mobile wallet modal
    // This prevents the standard wallet adapter modal from causing redirect issues
    // We use the click-time values, not render-time values
    if (isMobileNow && !isInPhantomNow) {
      console.log('[WalletConnectButton] Mobile browser detected without Phantom - showing mobile wallet modal');
      setShowMobileWalletModal(true);
      return;
    }
    
    // Mark that user explicitly clicked connect
    setUserClickedConnect(true);
    
    // Open the wallet modal (on desktop or inside Phantom browser)
    setVisible(true);
  };
  
  // Handle wallet selection from mobile modal
  const handleMobileWalletSelect = (wallet: 'phantom' | 'solflare') => {
    console.log('[WalletConnectButton] Mobile wallet selected:', wallet);
    
    // Call callback before redirect to allow parent to save form data
    if (onBeforeRedirect) {
      onBeforeRedirect();
    }
    
    // Save deep-link intent to sessionStorage
    saveDeepLinkIntent();
    
    // Build the full URL with form data as URL parameters
    const url = new URL(window.location.origin);
    url.pathname = targetRedirectPath || '/';
    
    // Add form data as URL params so form is pre-filled in wallet browser
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
    
    let deepLink: string;
    if (wallet === 'phantom') {
      // Phantom deep link scheme
      deepLink = `phantom://browse/${encodeURIComponent(fullUrl)}`;
    } else {
      // Solflare deep link scheme
      deepLink = `solflare://browse/${encodeURIComponent(fullUrl)}`;
    }
    
    console.log('[WalletConnectButton] Opening', wallet, 'with deep link:', deepLink);
    
    setShowMobileWalletModal(false);
    window.location.href = deepLink;
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
  // On mobile (not in Phantom): shows "Connect Wallet" but opens our custom modal with deep links
  // On desktop or inside Phantom: shows "Connect Wallet" for standard modal
  
  return (
    <>
      <Button
        type="button"
        onClick={handleConnectClick}
        className={className}
        data-testid={testId}
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
      
      {/* Custom Mobile Wallet Selection Modal */}
      <Dialog open={showMobileWalletModal} onOpenChange={setShowMobileWalletModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Choose a Wallet
            </DialogTitle>
            <DialogDescription>
              Select your wallet app to connect. This will open the app if installed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <button
              onClick={() => handleMobileWalletSelect('phantom')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              data-testid="button-wallet-phantom"
            >
              <div className="h-12 w-12 rounded-full bg-[#AB9FF2] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 128 128" fill="none">
                  <path d="M64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128Z" fill="#AB9FF2"/>
                  <path d="M110.584 64.9142H99.1421C99.1421 41.8014 80.1603 23.0566 56.7577 23.0566C34.1291 23.0566 15.6172 40.5988 14.2866 62.3731C12.8581 85.5808 32.4162 105.001 55.9048 105.001H59.5543C81.0652 105.001 99.1421 87.0998 110.584 64.9142Z" fill="url(#paint0_linear_phantom)"/>
                  <path d="M44.4043 64.2988C44.4043 68.1451 41.3271 71.2676 37.5353 71.2676C33.7436 71.2676 30.6664 68.1451 30.6664 64.2988C30.6664 60.4524 33.7436 57.33 37.5353 57.33C41.3271 57.33 44.4043 60.4524 44.4043 64.2988Z" fill="white"/>
                  <path d="M67.1043 64.2988C67.1043 68.1451 64.0271 71.2676 60.2353 71.2676C56.4436 71.2676 53.3664 68.1451 53.3664 64.2988C53.3664 60.4524 56.4436 57.33 60.2353 57.33C64.0271 57.33 67.1043 60.4524 67.1043 64.2988Z" fill="white"/>
                  <defs>
                    <linearGradient id="paint0_linear_phantom" x1="62.4356" y1="23.0566" x2="62.4356" y2="105.001" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Phantom</div>
                <div className="text-sm text-muted-foreground">Popular Solana wallet</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <button
              onClick={() => handleMobileWalletSelect('solflare')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
              data-testid="button-wallet-solflare"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 101 88" fill="none">
                  <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.310706 87.2029 0.160416 86.8659C0.0101253 86.5289 -0.0359181 86.1566 0.0## -3.80208L25.1161 69.3817C25.4785 69.0033 25.9171 68.7016 26.4044 68.4954C26.8917 68.2892 27.4174 68.1829 27.9486 68.1826H107.084C107.461 68.1826 107.83 68.29 108.146 68.4915C108.461 68.693 108.709 68.9798 108.859 69.3168C109.01 69.6538 109.056 70.0261 109.002 70.3906C108.948 70.7551 108.797 71.0965 108.565 71.3773L108.48 71.4701L100.48 79.4717L100.48 69.3817Z" fill="white"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Solflare</div>
                <div className="text-sm text-muted-foreground">Secure Solana wallet</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Don't have a wallet? Download one from the App Store or Play Store.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
