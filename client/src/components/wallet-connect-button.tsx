import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Loader2, ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const hasPhantom = hasPhantomProvider();
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantomApp = userAgent.includes('phantom');
  return hasPhantom || isPhantomApp;
}

function openInPhantomApp(e: React.MouseEvent, redirectPath?: string) {
  e.preventDefault();
  e.stopPropagation();
  
  const currentPath = window.location.pathname + window.location.search;
  const targetPath = redirectPath || currentPath;
  
  // Build the full URL with redirect parameter
  const urlWithRedirect = new URL(window.location.origin);
  urlWithRedirect.searchParams.set('wallet_redirect', targetPath);
  const fullUrl = urlWithRedirect.toString();
  
  // Use direct phantom:// scheme to open installed app
  // This opens the URL in Phantom's in-app browser
  const phantomDeepLink = `phantom://browse/${encodeURIComponent(fullUrl)}`;
  
  console.log('[WalletConnectButton] Opening Phantom app with deep link:', phantomDeepLink);
  
  // Try to open the app directly
  window.location.href = phantomDeepLink;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ className, "data-testid": testId, redirectPath }: WalletConnectButtonProps) {
  const { connected, publicKey, connecting, disconnect, select, wallets, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const autoConnectAttemptedRef = useRef(false);
  const [userClickedConnect, setUserClickedConnect] = useState(false);

  const isMobile = isMobileBrowser();
  const hasProvider = hasPhantomProvider();
  const isInPhantom = isInsidePhantomBrowser();
  
  const targetRedirectPath = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/launch');

  // Only auto-connect when inside Phantom's browser (user explicitly opened in Phantom)
  useEffect(() => {
    if (autoConnectAttemptedRef.current) return;
    if (connected || connecting) return;
    
    // Only auto-connect in Phantom browser when provider is available
    if (isInPhantom && hasProvider) {
      autoConnectAttemptedRef.current = true;
      console.log('[WalletConnectButton] Inside Phantom browser, auto-connecting...');
      
      const phantomWallet = wallets.find(w => 
        w.adapter.name.toLowerCase().includes('phantom')
      );
      
      if (phantomWallet) {
        select(phantomWallet.adapter.name);
        setTimeout(() => {
          if (!connected) {
            connect().catch((err) => {
              console.log('[WalletConnectButton] Auto-connect failed:', err);
            });
          }
        }, 100);
      }
    }
  }, [isInPhantom, hasProvider, connected, connecting, wallets, select, connect]);

  // Handle user-initiated connect
  const handleConnectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // On mobile without provider, open in Phantom
    if (isMobile && !hasProvider) {
      openInPhantomApp(e, targetRedirectPath);
      return;
    }
    
    // Mark that user explicitly clicked connect
    setUserClickedConnect(true);
    
    // Open the wallet modal (this is safe - user explicitly clicked)
    setVisible(true);
  };

  console.log('[WalletConnectButton] isMobile:', isMobile, 'hasProvider:', hasProvider, 'connected:', connected);

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
      {isMobile && !hasProvider ? (
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
