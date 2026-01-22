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
  const wasConnectedRef = useRef(false);

  // Track connection state changes to detect when user returns from mobile wallet
  useEffect(() => {
    // If wallet just became connected (wasn't connected before, now is)
    if (connected && !wasConnectedRef.current) {
      const savedPath = localStorage.getItem(WALLET_REDIRECT_KEY);
      const currentPath = window.location.pathname;
      
      console.log('[WalletRedirect] Wallet just connected - savedPath:', savedPath, 'currentPath:', currentPath);
      
      // Redirect if we have a saved path and we're not already there
      if (savedPath && savedPath !== currentPath && !hasRestoredRef.current) {
        console.log('[WalletRedirect] Redirecting to:', savedPath);
        localStorage.removeItem(WALLET_REDIRECT_KEY);
        hasRestoredRef.current = true;
        setLocation(savedPath);
      } else if (savedPath) {
        // Clear saved path if we're already at the right location
        localStorage.removeItem(WALLET_REDIRECT_KEY);
      }
    }
    
    // Update the ref to track current connection state
    wasConnectedRef.current = connected;
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
