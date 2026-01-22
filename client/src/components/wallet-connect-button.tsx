import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

interface WalletConnectButtonProps {
  className?: string;
  "data-testid"?: string;
  redirectPath?: string;
}

export function WalletConnectButton({ className, "data-testid": testId }: WalletConnectButtonProps) {
  const { connected } = useWallet();

  console.log('[WalletConnectButton] connected:', connected);

  // Use the standard wallet adapter - it handles mobile connections automatically
  // When on mobile, tapping "Phantom" in the wallet modal will open the Phantom app
  return (
    <WalletMultiButton 
      className={className}
      data-testid={testId}
    />
  );
}
