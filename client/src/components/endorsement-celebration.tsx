import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Sparkles, Shield, AlertCircle, Clock3, Trophy, Star, Copy, Check } from "lucide-react";
import { TOKEN_APPROVAL_STATUS } from "@shared/schema";

interface EndorsementCelebrationProps {
  status?: string;
  charityName?: string | null;
  note?: string | null;
  tokenId: string;
  charityNotifiedAt?: string | null;
  hasCharityEmail?: boolean;
  charityTwitter?: string | null;
  tokenName?: string;
  tokenSymbol?: string;
  tokenMintAddress?: string;
}

export function EndorsementCelebration({ 
  status, 
  charityName, 
  note,
  tokenId,
  charityNotifiedAt,
  hasCharityEmail,
  charityTwitter,
  tokenName,
  tokenSymbol,
  tokenMintAddress
}: EndorsementCelebrationProps) {
  const [copied, setCopied] = useState(false);
  if (status === TOKEN_APPROVAL_STATUS.APPROVED) {
    return (
      <Card className="overflow-hidden border-green-500/30" data-testid="card-endorsement-celebration">
        <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 p-1">
          <CardContent className="bg-card rounded-lg p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <BadgeCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-green-600" data-testid="text-endorsed-title">Officially Endorsed!</h3>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-endorsed-charity">
                  {charityName} has officially approved this token
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600" data-testid={`badge-endorsed-${tokenId}`}>
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Charity Verified
                </Badge>
                <Badge variant="outline" className="border-green-500/30" data-testid="badge-legit-token">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Legit Token
                </Badge>
              </div>
              
              {note && (
                <div className="w-full p-3 rounded-lg bg-green-500/10 border border-green-500/20" data-testid="section-endorsement-note">
                  <p className="text-sm italic text-muted-foreground" data-testid="text-endorsement-note">
                    "{note}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-note-author">
                    — {charityName}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-safe-to-trade">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>This token is safe to trade and support</span>
                <Star className="h-3 w-3 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }
  
  if (status === TOKEN_APPROVAL_STATUS.DENIED) {
    return (
      <Card className="border-red-500/30" data-testid="card-endorsement-denied">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-red-600" data-testid="text-denied-title">Not Endorsed</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-denied-reason">
                {charityName} has declined to endorse this token.
              </p>
              {note && (
                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded" data-testid="text-denial-note">
                  Reason: {note}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2" data-testid="text-caution-message">
                Trade with caution. This token may not represent the charity's interests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (status === TOKEN_APPROVAL_STATUS.PENDING) {
    const wasNotified = !!charityNotifiedAt;
    const twitterHandle = charityTwitter?.replace("@", "");
    const twitterUrl = twitterHandle 
      ? (charityTwitter?.startsWith("http") ? charityTwitter : `https://x.com/${twitterHandle}`)
      : null;
    
    return (
      <Card className="border-yellow-500/30" data-testid="card-endorsement-pending">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
              <Clock3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-yellow-600" data-testid="text-pending-title">Pending Review</h3>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-600" data-testid="badge-awaiting-charity">
                  <Shield className="h-3 w-3 mr-1" />
                  Awaiting Charity
                </Badge>
              </div>
              
              {wasNotified ? (
                <p className="text-sm text-muted-foreground" data-testid="text-pending-message">
                  {charityName} has been notified via email and will review this token soon.
                </p>
              ) : hasCharityEmail === false && twitterUrl ? (
                (() => {
                  const tokenUrl = tokenMintAddress ? `https://goodbags.tech/tokens/${tokenMintAddress}` : "";
                  const messageTemplate = `Hi @${twitterHandle}! A token called $${tokenSymbol || "TOKEN"} (${tokenName || "Token"}) was just launched on @GoodBags_Tech in support of your organization. It includes automatic donation royalties from trading that you can claim directly using this X handle. Would you like to officially endorse it? Details: ${tokenUrl}`;
                  
                  const handleCopy = () => {
                    navigator.clipboard.writeText(messageTemplate);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  };
                  
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground" data-testid="text-pending-message">
                        {charityName} doesn't have an email on file. You can reach out to them directly on X to request approval.
                      </p>
                      
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Message template:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-7 px-2 text-xs"
                            data-testid="button-copy-message"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-message-template">
                          {messageTemplate}
                        </p>
                      </div>
                      
                      <a 
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
                        data-testid="link-charity-twitter"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Open @{twitterHandle} on X
                      </a>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-pending-message">
                  {charityName} will be notified about this token and will review it soon.
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-2" data-testid="text-pending-approval-note">
                Once approved, this token will be marked as "Official" and gain community trust.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}
