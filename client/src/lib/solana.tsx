import { useMemo, useEffect, useRef } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
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

  // On initial page load, check if we need to redirect from localStorage
  // This handles the case where user returns from mobile wallet to same browser
  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;

    const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
    const currentPath = window.location.pathname;
    
    console.log('[WalletRedirect] Initial check - savedPath:', savedPath, 'currentPath:', currentPath);
    
    // If we have a saved path and we're on homepage, redirect immediately
    if (savedPath && currentPath === '/' && savedPath !== '/') {
      console.log('[WalletRedirect] Redirecting on page load to:', savedPath);
      localStorage.removeItem(WALLET_REDIRECT_KEY);
      hasRestoredRef.current = true;
      setLocation(savedPath);
    }
  }, [setLocation]);

  // Handle wallet browser scenario (e.g., Phantom's built-in browser)
  // If wallet is connected and we're on homepage, redirect to /launch
  // This covers the case where Phantom opens our app in its browser with wallet pre-connected
  useEffect(() => {
    if (walletCheckDoneRef.current) return;
    
    const currentPath = window.location.pathname;
    
    // Only trigger if wallet is connected and we're on homepage
    if (connected && currentPath === '/' && !hasRestoredRef.current) {
      walletCheckDoneRef.current = true;
      console.log('[WalletRedirect] Wallet connected on homepage, redirecting to /launch');
      hasRestoredRef.current = true;
      setLocation('/launch');
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
  const network = WalletAdapterNetwork.Devnet;
  
  const endpoint = useMemo(() => {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL;
    return rpcUrl || clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletRouteRestorer>
            {children}
          </WalletRouteRestorer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
