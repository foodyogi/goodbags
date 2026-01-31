import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiX } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

interface LoginPromptModalProps {
  autoOpen?: boolean;
  delayMs?: number;
}

export function LoginPromptModal({ autoOpen = true, delayMs = 500 }: LoginPromptModalProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  useEffect(() => {
    if (!autoOpen || isLoading || isAuthenticated || hasShownThisSession) {
      return;
    }

    const sessionKey = 'goodbags_login_prompt_shown';
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (alreadyShown) {
      setHasShownThisSession(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(sessionKey, 'true');
      setHasShownThisSession(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [autoOpen, isLoading, isAuthenticated, hasShownThisSession, delayMs]);

  const handleLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/api/login?returnTo=${encodeURIComponent(currentPath)}`;
  };

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" data-testid="login-prompt-modal">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <SiX className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Welcome to GoodBags</DialogTitle>
          <DialogDescription className="text-center">
            Login with X to launch memecoins that donate to charity on every trade.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleLogin} 
            className="gap-2 w-full"
            data-testid="button-login-modal"
          >
            <SiX className="h-4 w-4" />
            Login with X
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground"
            data-testid="button-dismiss-login"
          >
            Browse First
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
