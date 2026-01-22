import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { saveCurrentPath } from "@/lib/solana";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected } = useWallet();

  const handleInteraction = (e: React.MouseEvent | React.PointerEvent | React.TouchEvent) => {
    if (!connected) {
      console.log('[WalletConnectButton] Saving path before wallet connect');
      saveCurrentPath();
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
