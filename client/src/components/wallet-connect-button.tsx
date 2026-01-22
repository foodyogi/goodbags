import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
  redirectPath?: string;
}

// Check if we're on a mobile browser
function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Check if Phantom provider is available (injected by extension or in-app browser)
function hasPhantomProvider(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana;
}

// Open the current page in Phantom's in-app browser
function openInPhantomBrowser(e: React.MouseEvent) {
  // Prevent any form submission
  e.preventDefault();
  e.stopPropagation();
  
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected, publicKey, disconnect } = useWallet();

  // On mobile browsers without Phantom provider, show a button that opens in Phantom's browser
  const isMobile = isMobileBrowser();
  const hasProvider = hasPhantomProvider();

  console.log('[WalletConnectButton] isMobile:', isMobile, 'hasProvider:', hasProvider, 'connected:', connected);

  // Mobile browser without Phantom provider - need to open in Phantom's in-app browser
  if (isMobile && !hasProvider && !connected) {
    return (
      <Button
        type="button"
        onClick={openInPhantomBrowser}
        className={className}
        data-testid={testId}
      >
        <Wallet className="h-4 w-4 mr-2" />
        Open in Phantom
      </Button>
    );
  }

  // Desktop or already in Phantom's in-app browser - use standard wallet adapter
  return (
    <WalletMultiButton 
      className={className}
      data-testid={testId}
    />
  );
}
