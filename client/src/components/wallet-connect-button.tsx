import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

function openInPhantomBrowser(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  
  const currentUrl = window.location.href;
  const phantomBrowseUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
  
  console.log('[WalletConnectButton] Redirecting to Phantom browser:', phantomBrowseUrl);
  window.location.href = phantomBrowseUrl;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected, publicKey } = useWallet();

  const isMobile = isMobileBrowser();
  const hasProvider = hasPhantomProvider();

  console.log('[WalletConnectButton] isMobile:', isMobile, 'hasProvider:', hasProvider, 'connected:', connected, 'publicKey:', publicKey?.toBase58());

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

  return (
    <WalletMultiButton 
      className={className}
      data-testid={testId}
    />
  );
}
