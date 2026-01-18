import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Wallet, 
  ExternalLink,
  AlertCircle,
  Coins,
  TrendingUp,
  BadgeCheck,
  Ban
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_APPROVAL_STATUS, type LaunchedToken } from "@shared/schema";

interface TokensResponse {
  tokens: LaunchedToken[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
  };
}

export default function CharityTokenApproval() {
  const [charityEmail, setCharityEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [selectedToken, setSelectedToken] = useState<LaunchedToken | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<TokensResponse>({
    queryKey: ["/api/charity/tokens", charityEmail],
    queryFn: async () => {
      const res = await fetch(`/api/charity/tokens?email=${encodeURIComponent(charityEmail)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setIsVerified(false);
          throw new Error("Unauthorized - email not verified");
        }
        throw new Error("Failed to fetch tokens");
      }
      setIsVerified(true);
      return res.json();
    },
    enabled: charityEmail.length > 0 && charityEmail.includes("@"),
  });

  const approveMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`/api/charity/tokens/${tokenId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charityEmail, note }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || "Failed to approve token");
      }
      return res.json();
    },
    onSuccess: (data: { success?: boolean; error?: string }) => {
      if (data.success) {
        toast({
          title: "Token Endorsed",
          description: "This token is now officially endorsed by your charity.",
        });
        setSelectedToken(null);
        setNote("");
        refetch();
      } else {
        toast({
          title: "Approval Failed",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
      }
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
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`/api/charity/tokens/${tokenId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charityEmail, note }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || "Failed to deny token");
      }
      return res.json();
    },
    onSuccess: (data: { success?: boolean; error?: string }) => {
      if (data.success) {
        toast({
          title: "Token Denied",
          description: "This token is marked as not endorsed by your charity.",
        });
        setSelectedToken(null);
        setNote("");
        refetch();
      } else {
        toast({
          title: "Denial Failed",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Denial Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    refetch();
  };

  const getApprovalBadge = (status: string | null) => {
    switch (status) {
      case TOKEN_APPROVAL_STATUS.PENDING:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
      case TOKEN_APPROVAL_STATUS.APPROVED:
        return <Badge variant="default" className="bg-green-600"><BadgeCheck className="h-3 w-3 mr-1" /> Official</Badge>;
      case TOKEN_APPROVAL_STATUS.DENIED:
        return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Not Endorsed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  const pendingTokens = data?.tokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.PENDING) || [];
  const reviewedTokens = data?.tokens.filter(t => t.charityApprovalStatus !== TOKEN_APPROVAL_STATUS.PENDING) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            Charity Token Approval
          </h1>
          <p className="text-muted-foreground">
            Review and approve tokens created in your charity's name. This helps protect your reputation and lets supporters know which tokens you officially endorse.
          </p>
        </div>

        {!isVerified ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Verify Your Charity Email
              </CardTitle>
              <CardDescription>
                Enter your charity's verified email address to access tokens created in your name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="charity@example.org"
                  value={charityEmail}
                  onChange={(e) => setCharityEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-charity-email"
                />
                <Button 
                  onClick={handleVerify} 
                  disabled={!charityEmail.includes("@")}
                  data-testid="button-verify-email"
                >
                  Access Dashboard
                </Button>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This email is not associated with a verified charity. Make sure you're using the email from your charity application.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Coins className="h-4 w-4" />
                    Total Tokens
                  </div>
                  <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Pending Review
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{data?.stats.pending || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Approved
                  </div>
                  <div className="text-2xl font-bold text-green-600">{data?.stats.approved || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <XCircle className="h-4 w-4" />
                    Denied
                  </div>
                  <div className="text-2xl font-bold text-red-600">{data?.stats.denied || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({pendingTokens.length})
                </TabsTrigger>
                <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                  Reviewed ({reviewedTokens.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingTokens.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tokens pending review</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingTokens.map((token) => (
                      <Card key={token.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              {token.imageUrl && (
                                <img 
                                  src={token.imageUrl} 
                                  alt={token.name} 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <CardTitle className="text-lg">{token.name}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>${token.symbol}</span>
                                  {getApprovalBadge(token.charityApprovalStatus)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedToken(token)}
                                data-testid={`button-review-${token.id}`}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3">{token.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Launched:</span>
                              <div>{token.launchedAt ? new Date(token.launchedAt).toLocaleDateString() : "N/A"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Creator:</span>
                              <div className="font-mono text-xs truncate">{token.creatorWallet?.slice(0, 8)}...</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Donated:</span>
                              <div className="text-green-600">{parseFloat(token.charityDonated || "0").toFixed(4)} SOL</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Volume:</span>
                              <div>{parseFloat(token.tradingVolume || "0").toFixed(4)} SOL</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviewed">
                {reviewedTokens.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviewed tokens yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviewedTokens.map((token) => (
                      <Card key={token.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              {token.imageUrl && (
                                <img 
                                  src={token.imageUrl} 
                                  alt={token.name} 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <CardTitle className="text-lg">{token.name}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>${token.symbol}</span>
                                  {getApprovalBadge(token.charityApprovalStatus)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {token.charityApprovalNote && (
                            <Alert className="mb-3">
                              <AlertDescription>
                                <strong>Your note:</strong> {token.charityApprovalNote}
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Launched:</span>
                              <div>{token.launchedAt ? new Date(token.launchedAt).toLocaleDateString() : "N/A"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Notified:</span>
                              <div>{token.charityNotifiedAt ? new Date(token.charityNotifiedAt).toLocaleDateString() : "N/A"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Donated:</span>
                              <div className="text-green-600">{parseFloat(token.charityDonated || "0").toFixed(4)} SOL</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Volume:</span>
                              <div>{parseFloat(token.tradingVolume || "0").toFixed(4)} SOL</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {selectedToken && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedToken(null)}>
                <Card className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {selectedToken.imageUrl && (
                        <img 
                          src={selectedToken.imageUrl} 
                          alt={selectedToken.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      Review: {selectedToken.name}
                    </CardTitle>
                    <CardDescription>
                      Decide if this token should be officially endorsed by your charity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                      <div><strong>Symbol:</strong> ${selectedToken.symbol}</div>
                      <div><strong>Description:</strong> {selectedToken.description || "No description"}</div>
                      <div><strong>Creator Wallet:</strong> <span className="font-mono text-xs">{selectedToken.creatorWallet}</span></div>
                      <div><strong>Total Donated:</strong> {parseFloat(selectedToken.charityDonated || "0").toFixed(4)} SOL</div>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Approving</strong> marks this token as officially endorsed by your charity. 
                        <strong> Denying</strong> marks it as not endorsed, warning supporters this token is not connected to your organization.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Add a note (optional)</label>
                      <Textarea
                        placeholder="Any comments about this token..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        data-testid="input-approval-note"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedToken(null);
                          setNote("");
                        }}
                        data-testid="button-cancel-review"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => denyMutation.mutate(selectedToken.id)}
                        disabled={denyMutation.isPending}
                        data-testid="button-deny-token"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(selectedToken.id)}
                        disabled={approveMutation.isPending}
                        data-testid="button-approve-token"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
