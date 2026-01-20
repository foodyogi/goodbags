import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Sparkles, Shield, AlertCircle, Clock3, Trophy, Star } from "lucide-react";
import { TOKEN_APPROVAL_STATUS } from "@shared/schema";

interface EndorsementCelebrationProps {
  status?: string;
  charityName?: string | null;
  note?: string | null;
  tokenId: string;
}

export function EndorsementCelebration({ 
  status, 
  charityName, 
  note,
  tokenId 
}: EndorsementCelebrationProps) {
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
    return (
      <Card className="border-yellow-500/30" data-testid="card-endorsement-pending">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
              <Clock3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-yellow-600" data-testid="text-pending-title">Pending Review</h3>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-600" data-testid="badge-awaiting-charity">
                  <Shield className="h-3 w-3 mr-1" />
                  Awaiting Charity
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-pending-message">
                {charityName} has been notified about this token and will review it soon.
              </p>
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
