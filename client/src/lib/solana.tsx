import { useMemo, useEffect, useRef } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useLocation } from 'wouter';

import '@solana/wallet-adapter-react-ui/styles.css';

const WALLET_REDIRECT_KEY = 'goodbags_wallet_redirect_path';

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
  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const urlRedirectPath = urlParams.get('wallet_redirect');
    const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
    const currentPath = window.location.pathname;
    
    console.log('[WalletRedirect] Initial check - urlRedirectPath:', urlRedirectPath, 'savedPath:', savedPath, 'currentPath:', currentPath);
    
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
  useEffect(() => {
    if (walletCheckDoneRef.current) return;
    
    const currentPath = window.location.pathname;
    
    // Only trigger if wallet is connected and we're on homepage
    if (connected && currentPath === '/' && !hasRestoredRef.current) {
      walletCheckDoneRef.current = true;
      
      // Use saved redirect path from localStorage, fallback to /launch
      const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
      const targetPath = savedPath && savedPath !== '/' ? savedPath : '/launch';
      
      console.log('[WalletRedirect] Wallet connected on homepage, redirecting to:', targetPath);
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
