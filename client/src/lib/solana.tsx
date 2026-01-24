import { useMemo, useEffect, useRef } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useLocation } from 'wouter';

import '@solana/wallet-adapter-react-ui/styles.css';

const WALLET_REDIRECT_KEY = 'goodbags_wallet_redirect_path';
const WALLET_LOCAL_STORAGE_KEY = 'walletName';

// CRITICAL: Clear stale wallet localStorage on mobile to prevent redirect to phantom.app
// This MUST run synchronously before React renders to prevent the wallet adapter
// from reading the stale value and triggering a redirect
// The redirect happens because:
// 1. User previously selected Phantom wallet (stored in localStorage as "walletName")
// 2. On page load, WalletProvider reads this and instantiates PhantomWalletAdapter
// 3. PhantomWalletAdapter.connect() is called (by various triggers)
// 4. If Phantom is "Loadable" (not installed), it redirects to https://phantom.app
function preventMobileWalletRedirect(): void {
  if (typeof window === 'undefined') return;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return;
  
  // Check if Phantom is actually available (installed)
  const hasPhantom = !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
  
  // Check if we have URL evidence that we came from a deep link (intentional)
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  // If we're on mobile, Phantom is NOT installed, and we don't have deep link evidence,
  // clear the wallet localStorage to prevent any auto-connection attempts
  if (!hasPhantom && !hasLaunchReady) {
    const storedWallet = localStorage.getItem(WALLET_LOCAL_STORAGE_KEY);
    if (storedWallet) {
      console.log('[SolanaProvider] Clearing stale wallet localStorage to prevent redirect:', storedWallet);
      localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY);
    }
  }
}

// Run this synchronously on module load (before React renders)
preventMobileWalletRedirect();

export function saveCurrentPath() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/') {
      localStorage.setItem(WALLET_REDIRECT_KEY, currentPath);
      console.log('[WalletRedirect] Saved path:', currentPath);
    }
  }
}

export function saveRedirectPath(path: string) {
  if (typeof window !== 'undefined' && path) {
    localStorage.setItem(WALLET_REDIRECT_KEY, path);
    console.log('[WalletRedirect] Saved redirect path:', path);
  }
}

export function clearSavedPath() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WALLET_REDIRECT_KEY);
  }
}

function WalletRouteRestorer({ children }: { children: React.ReactNode }) {
  const { connected, connecting } = useWallet();
  const [location, setLocation] = useLocation();
  const hasRestoredRef = useRef(false);
  const initialCheckDoneRef = useRef(false);
  const walletCheckDoneRef = useRef(false);

  // On initial page load, check for redirect from URL params (Phantom deep link) or localStorage
  // URL params are used when coming from Phantom's browser (different browser context)
  // localStorage is used when staying in the same browser (desktop wallet flows)
  // IMPORTANT: On mobile, clear stale localStorage to prevent unwanted behavior on refresh
  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const urlRedirectPath = urlParams.get('wallet_redirect');
    const hasLaunchReady = urlParams.get('launch_ready') === '1';
    const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
    const currentPath = window.location.pathname;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    console.log('[WalletRedirect] Initial check - urlRedirectPath:', urlRedirectPath, 'savedPath:', savedPath, 'currentPath:', currentPath);
    
    // On mobile without URL evidence, clear any stale localStorage to prevent issues on refresh
    if (isMobile && !hasLaunchReady && !urlRedirectPath && savedPath) {
      console.log('[WalletRedirect] Clearing stale localStorage on mobile refresh');
      localStorage.removeItem(WALLET_REDIRECT_KEY);
      return;
    }
    
    // Priority: URL parameter (from Phantom deep link) > localStorage
    const redirectPath = urlRedirectPath || savedPath;
    
    if (redirectPath && redirectPath !== '/' && redirectPath !== currentPath) {
      console.log('[WalletRedirect] Found redirect path, saving to localStorage:', redirectPath);
      // Save to localStorage so it persists after wallet connects
      localStorage.setItem(WALLET_REDIRECT_KEY, redirectPath);
      
      // Clean up URL params if present (remove wallet_redirect from URL)
      if (urlRedirectPath) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('wallet_redirect');
        window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search);
      }
    }
  }, [setLocation]);

  // Handle wallet browser scenario (e.g., Phantom's built-in browser)
  // If wallet is connected and we're on homepage, redirect to saved path (or /launch as fallback)
  // This covers the case where Phantom opens our app in its browser with wallet pre-connected
  // IMPORTANT: Only do this if we have explicit URL params, not just localStorage
  useEffect(() => {
    if (walletCheckDoneRef.current) return;
    
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hasLaunchReady = urlParams.get('launch_ready') === '1';
    
    // Only trigger if wallet is connected, we're on homepage, AND we have URL evidence
    // This prevents unwanted redirects on regular page loads
    if (connected && currentPath === '/' && !hasRestoredRef.current && hasLaunchReady) {
      walletCheckDoneRef.current = true;
      
      // Use saved redirect path from localStorage, fallback to /launch
      const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
      const targetPath = savedPath && savedPath !== '/' ? savedPath : '/launch';
      
      console.log('[WalletRedirect] Wallet connected on homepage with launch_ready, redirecting to:', targetPath);
      localStorage.removeItem(WALLET_REDIRECT_KEY);
      hasRestoredRef.current = true;
      setLocation(targetPath);
    }
  }, [connected, setLocation]);

  // Handle the case where wallet connects while on the page
  // (for desktop wallets that don't leave the page)
  useEffect(() => {
    if (connected && !hasRestoredRef.current) {
      const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
      const currentPath = window.location.pathname;
      
      if (savedPath && savedPath !== currentPath) {
        console.log('[WalletRedirect] Wallet connected, redirecting to:', savedPath);
        localStorage.removeItem(WALLET_REDIRECT_KEY);
        hasRestoredRef.current = true;
        setLocation(savedPath);
      } else if (savedPath) {
        localStorage.removeItem(WALLET_REDIRECT_KEY);
      }
    }
  }, [connected, setLocation]);

  // Debug logging
  useEffect(() => {
    const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
    console.log('[WalletRedirect] State - connected:', connected, 'connecting:', connecting, 'savedPath:', savedPath, 'location:', location);
  }, [connected, connecting, location]);

  return <>{children}</>;
}

interface SolanaProviderProps {
  children: React.ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  // Run the redirect prevention check again on component mount
  // This catches cases where the module-level check might have missed
  useEffect(() => {
    preventMobileWalletRedirect();
  }, []);

  // Use mainnet for production (Bags.fm runs on mainnet)
  // Can be overridden via VITE_SOLANA_RPC_URL env var
  const endpoint = useMemo(() => {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
    // Default to mainnet-beta for production Bags.fm integration
    return rpcUrl || "https://api.mainnet-beta.solana.com";
  }, []);

  // Always include all wallet adapters
  // The redirect issue is NOT caused by adapter initialization
  // but by other code that triggers wallet connection
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Disable autoConnect entirely to prevent unwanted redirects
  // Users will manually click to connect their wallet
  // AutoConnect causes redirects to wallet download pages (phantom.com, brave wallet, etc.)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletRouteRestorer>
            {children}
          </WalletRouteRestorer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
