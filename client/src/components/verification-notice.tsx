import { useState } from "react";
import { X, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "goodbags_verification_notice_dismissed";

export function VerificationNotice() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) {
    return null;
  }

  return (
    <div 
      className="bg-amber-500/10 border-b border-amber-500/20"
      data-testid="banner-verification-notice"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Wallet Verification In Progress
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
              Phantom wallet may show a security warning when connecting. This is normal for new apps. 
              We've submitted our domain for verification and expect approval soon. 
              You can safely proceed by clicking "Proceed anyway" - your funds are secure.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a 
                href="https://docs.phantom.com/best-practices/domain-and-transaction-warnings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                data-testid="link-phantom-docs"
              >
                Learn more about Phantom verification
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            onClick={handleDismiss}
            data-testid="button-dismiss-verification-notice"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
