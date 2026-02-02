import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BadgeCheck, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Coins,
  FileText,
  User,
  Loader2
} from "lucide-react";

interface TokenForApproval {
  id: string;
  name: string;
  symbol: string;
  mintAddress: string;
  imageUrl: string | null;
  creatorWallet: string;
  launchedAt: string;
  charityName: string;
  charityTwitterHandle: string;
  charityBps: number;
  buybackBps: number;
  creatorBps: number;
  charityApprovalStatus: string;
}

export default function CharityPortal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const [showDenialForm, setShowDenialForm] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const tokenMint = urlParams.get("token");
  const charityId = urlParams.get("charity");
  const forceReauth = urlParams.get("reauth") === "true";
  
  // If forceReauth is set and user is logged in, auto-logout and redirect to login
  // This ensures fresh X account selection when clicking verification links
  useEffect(() => {
    if (forceReauth && user && !authLoading && !isRedirecting) {
      setIsRedirecting(true);
      // Build return URL without the reauth param to prevent loop
      const returnUrl = `/charity-portal?token=${tokenMint}&charity=${charityId}`;
      window.location.href = `/api/logout?returnTo=${encodeURIComponent(returnUrl)}`;
    }
  }, [forceReauth, user, authLoading, tokenMint, charityId, isRedirecting]);

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery<TokenForApproval>({
    queryKey: ["/api/charity-portal/token", tokenMint, charityId],
    queryFn: async () => {
      const response = await fetch(`/api/charity-portal/token?mint=${tokenMint}&charity=${charityId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load token");
      }
      return response.json();
    },
    enabled: !!tokenMint && !!charityId,
  });

  const isVerified = user?.twitterUsername && 
    tokenData?.charityTwitterHandle &&
    user.twitterUsername.toLowerCase() === tokenData.charityTwitterHandle.toLowerCase();

  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/charity-portal/approve`, {
        tokenMint,
        charityId,
        note: approvalNote || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Token Endorsed",
        description: "You have officially endorsed this token. It will now display your approval badge.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/charity-portal/token", tokenMint, charityId] });
      navigate(`/tokens/${tokenMint}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/charity-portal/deny`, {
        tokenMint,
        charityId,
        reason: denialReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Token Denied",
        description: "You have denied this token. It will be marked as not endorsed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/charity-portal/token", tokenMint, charityId] });
      navigate(`/tokens/${tokenMint}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Denial Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    // Use OAuth 1.0a force login endpoint to ensure X prompts for account selection
    // This fixes the issue where X auto-selects a cached account instead of letting user choose
    window.location.href = `/api/login/force?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  };

  if (!tokenMint || !charityId) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This approval link is missing required information. Please use the link provided in your message.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenLoading || authLoading || isRedirecting) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {isRedirecting ? "Preparing verification..." : "Loading token details..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
            <p className="text-muted-foreground">
              {tokenError instanceof Error ? tokenError.message : "This token could not be found or is not available for approval."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenData.charityApprovalStatus !== "pending") {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            {tokenData.charityApprovalStatus === "approved" ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Already Endorsed</h2>
                <p className="text-muted-foreground mb-4">
                  This token has already been officially endorsed by {tokenData.charityName}.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Already Denied</h2>
                <p className="text-muted-foreground mb-4">
                  This token has been denied by {tokenData.charityName}.
                </p>
              </>
            )}
            <Button onClick={() => navigate(`/tokens/${tokenMint}`)} data-testid="button-view-token">
              View Token Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          <Shield className="h-3 w-3 mr-1" />
          Charity Approval Portal
        </Badge>
        <h1 className="text-2xl font-bold mb-2">Token Endorsement Request</h1>
        <p className="text-muted-foreground">
          Review and decide whether to officially endorse this token
        </p>
      </div>

      <Card data-testid="card-token-details">
        <CardHeader>
          <div className="flex items-start gap-4">
            {tokenData.imageUrl ? (
              <img 
                src={tokenData.imageUrl} 
                alt={tokenData.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Coins className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {tokenData.name}
                <Badge variant="secondary">${tokenData.symbol}</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Launched in support of <strong>{tokenData.charityName}</strong>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Your Share:</span>
              <p className="font-medium">{(tokenData.charityBps / 100).toFixed(2)}% of trading fees</p>
            </div>
            <div>
              <span className="text-muted-foreground">Payout via:</span>
              <p className="font-medium">@{tokenData.charityTwitterHandle} on X</p>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Token Address:</span>
            <p className="font-mono text-xs break-all mt-1">{tokenData.mintAddress}</p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-terms">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Terms of Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>By endorsing this token, you agree to the following:</p>
          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
            <li>Your organization's name and X handle will be publicly associated with this token</li>
            <li>You will receive {(tokenData.charityBps / 100).toFixed(2)}% of all trading fees as donations</li>
            <li>Donations are claimable via your X handle (@{tokenData.charityTwitterHandle}) through the Bags.fm platform</li>
            <li>You can use the "Charity Endorsed" badge in your communications about this token</li>
            <li>GoodBags is not responsible for the token's market performance or creator actions</li>
            <li>You may request removal of endorsement at any time by contacting GoodBags</li>
          </ul>
          
          <div className="flex items-start space-x-3 pt-4 border-t">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              disabled={!isVerified}
              data-testid="checkbox-agree-terms"
            />
            <Label 
              htmlFor="terms" 
              className={`text-sm leading-relaxed ${!isVerified ? 'text-muted-foreground' : ''}`}
            >
              I confirm that I am authorized to make decisions on behalf of {tokenData.charityName} and agree to the terms above.
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-verification">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>
            To prevent unauthorized approvals, you must verify ownership of @{tokenData.charityTwitterHandle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Click below to sign in with X. You'll be prompted to choose which X account to use - make sure to select <strong>@{tokenData.charityTwitterHandle}</strong>.
                </p>
              </div>
              <div className="text-center">
                <Button onClick={handleLogin} data-testid="button-login-x">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Sign in with X as @{tokenData.charityTwitterHandle}
                </Button>
              </div>
            </div>
          ) : isVerified ? (
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Identity Verified</p>
                <p className="text-sm text-muted-foreground">
                  Signed in as @{user.twitterUsername} - matches @{tokenData.charityTwitterHandle}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Verification Failed</p>
                  <p className="text-sm text-muted-foreground">
                    Signed in as @{user.twitterUsername}, but this token requires @{tokenData.charityTwitterHandle}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-3">
                  Click below to sign out and sign in with a different X account. You'll be prompted to enter credentials for <strong>@{tokenData.charityTwitterHandle}</strong>.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    // Use OAuth 1.0a force login - this will log out and force X to show login screen
                    const returnUrl = window.location.pathname + window.location.search;
                    window.location.href = `/api/logout?returnTo=${encodeURIComponent(`/api/login/force?returnTo=${encodeURIComponent(returnUrl)}`)}`;
                  }}
                  data-testid="button-switch-account"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Sign Out & Sign In with Different X Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isVerified && !showDenialForm && (
        <Card data-testid="card-decision">
          <CardHeader>
            <CardTitle className="text-lg">Your Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="note" className="text-sm">Optional Message (public)</Label>
              <Textarea
                id="note"
                placeholder="Add a message to display with your endorsement..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="mt-1"
                data-testid="input-approval-note"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              disabled={!agreedToTerms || approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              data-testid="button-approve"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4 mr-2" />
              )}
              Officially Endorse
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDenialForm(true)}
              disabled={approveMutation.isPending}
              data-testid="button-show-deny"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deny Endorsement
            </Button>
          </CardFooter>
        </Card>
      )}

      {isVerified && showDenialForm && (
        <Card className="border-destructive/30" data-testid="card-denial">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Deny This Token</CardTitle>
            <CardDescription>
              Denying will mark this token as not endorsed by your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-sm">Reason for Denial (optional, public)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're denying this token..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="mt-1"
                data-testid="input-denial-reason"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={denyMutation.isPending}
              onClick={() => denyMutation.mutate()}
              data-testid="button-confirm-deny"
            >
              {denyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Denial
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDenialForm(false)}
              disabled={denyMutation.isPending}
              data-testid="button-cancel-deny"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground">
        <p>Questions? Contact us at contact@master22solutions.com</p>
        <a 
          href={`/tokens/${tokenMint}`}
          className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
          data-testid="link-view-token"
        >
          View token page <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
