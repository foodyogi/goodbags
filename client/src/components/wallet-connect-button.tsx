import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { saveCurrentPath, saveRedirectPath } from "@/lib/solana";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
  redirectPath?: string;
}

export function WalletConnectButton({ className, "data-testid": testId, redirectPath }: WalletConnectButtonProps) {
  const { connected } = useWallet();

  const handleInteraction = (e: React.MouseEvent | React.PointerEvent | React.TouchEvent) => {
    if (!connected) {
      if (redirectPath) {
        console.log('[WalletConnectButton] Saving redirect path:', redirectPath);
        saveRedirectPath(redirectPath);
      } else {
        console.log('[WalletConnectButton] Saving current path');
        saveCurrentPath();
      }
    }
  };

  return (
    <div 
      onClickCapture={handleInteraction}
      onPointerDownCapture={handleInteraction}
      onTouchStartCapture={handleInteraction}
    >
      <WalletMultiButton 
        className={className}
        data-testid={testId}
      />
    </div>
  );
}
