import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

const TRY_AGAIN = "X login didn't complete. Please try again in a few minutes.";

// Error codes the X login routes redirect with (server/replit_integrations/auth/twitterAuth.ts)
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "X login was cancelled. You can try again whenever you're ready.",
  invalid_state: "Your X login session expired. Please start the login again.",
  session_expired: "Your X login session expired. Please start the login again.",
  token_exchange_failed: TRY_AGAIN,
  user_fetch_failed: TRY_AGAIN,
  login_failed: TRY_AGAIN,
  callback_failed: TRY_AGAIN,
  oauth_request_token_failed: TRY_AGAIN,
  oauth_missing_tokens: TRY_AGAIN,
  oauth_error: TRY_AGAIN,
  oauth_missing_params: "X login didn't complete. Please start the login again.",
  oauth_token_mismatch: "Your X login session expired. Please start the login again.",
  oauth_access_token_failed: TRY_AGAIN,
  oauth_incomplete_response: TRY_AGAIN,
};

export function authErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? TRY_AGAIN;
}

/**
 * Shows a dismissible message when X login redirects back with ?error=..., and removes
 * the parameter from the URL right away so it isn't sent as the next login's return address.
 */
export function AuthErrorBanner() {
  const [code] = useState(() => new URLSearchParams(window.location.search).get("error"));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!code) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [code]);

  if (!code || dismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 pt-4" data-testid="banner-auth-error">
      <Alert variant="destructive" className="relative pr-12">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Login problem</AlertTitle>
        <AlertDescription data-testid="text-auth-error">{authErrorMessage(code)}</AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          data-testid="button-dismiss-auth-error"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}
