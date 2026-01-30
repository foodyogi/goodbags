import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import bs58 from "bs58";

interface WalletConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWallet: string | null;
}

export function WalletConnectionModal({ 
  open, 
  onOpenChange, 
  currentWallet 
}: WalletConnectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const [step, setStep] = useState<"connect" | "sign" | "done">(currentWallet ? "done" : "connect");

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!publicKey || !signMessage) {
        throw new Error("Wallet not connected or signing not supported");
      }

      const message = `GoodBags Wallet Verification\n\nSign this message to connect your wallet to your GoodBags account.\n\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      const response = await apiRequest("POST", "/api/user/wallet/connect", {
        walletAddress: publicKey.toBase58(),
        signature: signatureBase58,
        message,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      setStep("done");
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been linked to your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/wallet/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      disconnect();
      setStep("connect");
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been unlinked from your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    },
  });

  const handleSignAndConnect = () => {
    setStep("sign");
    connectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {currentWallet ? "Manage Wallet" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription>
            {currentWallet 
              ? "Your Solana wallet is connected to your account."
              : "Connect your Solana wallet to launch tokens on GoodBags."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentWallet ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-600">Wallet Connected</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {currentWallet}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                data-testid="button-disconnect-wallet"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Step 1: Connect your Phantom or Solflare wallet
                  </p>
                  <div className="flex justify-center">
                    <WalletConnectButton 
                      className="bg-primary hover:bg-primary/90 rounded-md font-medium"
                      data-testid="button-wallet-connect-modal"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Wallet Connected</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {publicKey?.toBase58()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <p className="text-xs text-amber-600">
                      Step 2: Sign a message to verify you own this wallet. This is free and doesn't cost any SOL.
                    </p>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleSignAndConnect}
                    disabled={connectMutation.isPending}
                    data-testid="button-sign-connect"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sign & Connect
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
