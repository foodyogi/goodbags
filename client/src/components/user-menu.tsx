import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Wallet, User, Loader2 } from "lucide-react";
import { SiX } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { WalletConnectionModal } from "./wallet-connection-modal";

export function UserMenu() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  
  const { data: walletData } = useQuery<{ walletAddress: string | null }>({
    queryKey: ["/api/user/wallet"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    const handleLogin = () => {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(currentPath)}`;
    };
    
    return (
      <Button
        variant="default"
        className="gap-2"
        onClick={handleLogin}
        data-testid="button-login"
      >
        <SiX className="h-3.5 w-3.5" />
        <span>Login with X</span>
      </Button>
    );
  }

  // For Twitter OAuth, use Twitter display name and username
  const twitterDisplayName = (user as any)?.twitterDisplayName;
  const twitterUsername = (user as any)?.twitterUsername;
  
  const initials = twitterDisplayName 
    ? twitterDisplayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.firstName && user?.lastName 
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "U";

  const displayName = twitterDisplayName || (user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User");

  const shortWallet = walletData?.walletAddress 
    ? `${walletData.walletAddress.slice(0, 4)}...${walletData.walletAddress.slice(-4)}`
    : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {twitterUsername ? (
                <p className="text-xs leading-none text-muted-foreground">
                  @{twitterUsername}
                </p>
              ) : user?.email ? (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setWalletModalOpen(true)}
            data-testid="menu-item-wallet"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {shortWallet ? (
              <span className="flex items-center gap-2">
                <span className="text-green-600">Connected:</span>
                <span className="font-mono text-xs">{shortWallet}</span>
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a href="/my-impact" data-testid="menu-item-profile">
              <User className="mr-2 h-4 w-4" />
              My Impact
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => logout()}
            data-testid="menu-item-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <WalletConnectionModal 
        open={walletModalOpen} 
        onOpenChange={setWalletModalOpen}
        currentWallet={walletData?.walletAddress || null}
      />
    </>
  );
}
