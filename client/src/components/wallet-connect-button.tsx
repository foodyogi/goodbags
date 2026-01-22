import { useEffect, useRef } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
  redirectPath?: string;
}

function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function hasPhantomProvider(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
}

function isInsidePhantomBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  // Check if we're inside Phantom's in-app browser
  // Phantom browser has the provider already injected and often has specific user agent
  const hasPhantom = hasPhantomProvider();
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantomApp = userAgent.includes('phantom');
  return hasPhantom || isPhantomApp;
}

function openInPhantomBrowser(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  
  const currentUrl = window.location.href;
  const phantomBrowseUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
  
  console.log('[WalletConnectButton] Redirecting to Phantom browser:', phantomBrowseUrl);
  window.location.href = phantomBrowseUrl;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected, publicKey, connecting, select, wallets, connect } = useWallet();
  const autoConnectAttemptedRef = useRef(false);

  const isMobile = isMobileBrowser();
  const hasProvider = hasPhantomProvider();
  const isInPhantom = isInsidePhantomBrowser();

  // Auto-connect when inside Phantom's browser
  useEffect(() => {
    if (autoConnectAttemptedRef.current) return;
    if (connected || connecting) return;
    
    // If we're inside Phantom's browser and have the provider, try to auto-connect
    if (isInPhantom && hasProvider) {
      autoConnectAttemptedRef.current = true;
      console.log('[WalletConnectButton] Inside Phantom browser, attempting auto-connect...');
      
      // Find the Phantom wallet adapter
      const phantomWallet = wallets.find(w => 
        w.adapter.name.toLowerCase().includes('phantom')
      );
      
      if (phantomWallet) {
        console.log('[WalletConnectButton] Found Phantom wallet adapter, selecting...');
        select(phantomWallet.adapter.name);
        
        // Give it a moment to select, then try to connect
        setTimeout(() => {
          if (!connected) {
            console.log('[WalletConnectButton] Attempting connect after select...');
            connect().catch((err) => {
              console.log('[WalletConnectButton] Auto-connect failed (user may need to approve):', err);
            });
          }
        }, 100);
      }
    }
  }, [isInPhantom, hasProvider, connected, connecting, wallets, select, connect]);

  console.log('[WalletConnectButton] isMobile:', isMobile, 'hasProvider:', hasProvider, 'isInPhantom:', isInPhantom, 'connected:', connected, 'publicKey:', publicKey?.toBase58());

  // Show loading state during connection
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

  // On mobile without Phantom provider (not in Phantom browser), show deep link
  if (isMobile && !hasProvider && !connected) {
    return (
      <Button
        type="button"
        onClick={openInPhantomBrowser}
        className={className}
        data-testid={testId}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open in Phantom
      </Button>
    );
  }

  // Standard wallet multi-button for desktop or when provider is available
  return (
    <WalletMultiButton 
      className={className}
      data-testid={testId}
    />
  );
}
