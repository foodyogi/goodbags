import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { saveCurrentPath } from "@/lib/solana";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected } = useWallet();

  const handleInteraction = () => {
    if (!connected) {
      saveCurrentPath();
    }
  };

  return (
    <div 
      onPointerDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <WalletMultiButton 
        className={className}
        data-testid={testId}
      />
    </div>
  );
}
