import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Wallet, 
  ExternalLink,
  AlertCircle,
  Globe
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Charity, CHARITY_STATUS } from "@shared/schema";

interface PendingCharitiesResponse {
  pending: Charity[];
  awaitingApproval: Charity[];
}

export default function AdminCharities() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<PendingCharitiesResponse>({
    queryKey: ["/api/admin/charities/pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/charities/pending", {
        headers: {
          "x-admin-secret": adminSecret,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthorized(false);
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch pending charities");
      }
      setIsAuthorized(true);
      return res.json();
    },
    enabled: adminSecret.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: async (charityId: string) => {
      const res = await fetch(`/api/admin/charities/${charityId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Charity Approved",
          description: "The charity is now active and available for token creators.",
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["/api/charities"] });
      } else {
        toast({
          title: "Approval Failed",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ charityId, reason }: { charityId: string; reason?: string }) => {
      const res = await fetch(`/api/admin/charities/${charityId}/deny`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Charity Denied",
          description: "The application has been rejected.",
        });
        refetch();
      } else {
        toast({
          title: "Denial Failed",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
  });

  const handleLogin = () => {
    refetch();
  };

  const getStatusBadge = (charity: Charity) => {
    switch (charity.status) {
      case CHARITY_STATUS.PENDING:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case CHARITY_STATUS.EMAIL_VERIFIED:
        return <Badge variant="outline" className="border-blue-500 text-blue-500"><Mail className="h-3 w-3 mr-1" /> Email Verified</Badge>;
      case CHARITY_STATUS.WALLET_VERIFIED:
        return <Badge variant="outline" className="border-green-500 text-green-500"><Wallet className="h-3 w-3 mr-1" /> Ready for Approval</Badge>;
      case CHARITY_STATUS.APPROVED:
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case CHARITY_STATUS.DENIED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Denied</Badge>;
      default:
        return <Badge variant="secondary">{charity.status}</Badge>;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Enter the admin secret to manage charity applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              data-testid="input-admin-secret"
            />
            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={!adminSecret}
              data-testid="button-admin-login"
            >
              Access Dashboard
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid admin secret. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-7 w-7" />
          Charity Management
        </h1>
        <p className="text-muted-foreground">
          Review and approve charity applications
        </p>
      </div>

      <Tabs defaultValue="awaiting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="awaiting" data-testid="tab-awaiting-approval">
            Awaiting Approval ({data?.awaitingApproval?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Verification ({data?.pending?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="awaiting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Ready for Approval
              </CardTitle>
              <CardDescription>
                These charities have completed email and wallet verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !data?.awaitingApproval?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No charities awaiting approval
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {data.awaitingApproval.map((charity) => (
                      <CharityCard
                        key={charity.id}
                        charity={charity}
                        onApprove={() => approveMutation.mutate(charity.id)}
                        onDeny={(reason) => denyMutation.mutate({ charityId: charity.id, reason })}
                        isApproving={approveMutation.isPending}
                        isDenying={denyMutation.isPending}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Verification
              </CardTitle>
              <CardDescription>
                These charities need to complete verification steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !data?.pending?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending applications
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {data.pending.map((charity) => (
                      <CharityCard
                        key={charity.id}
                        charity={charity}
                        onDeny={(reason) => denyMutation.mutate({ charityId: charity.id, reason })}
                        isDenying={denyMutation.isPending}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CharityCardProps {
  charity: Charity;
  onApprove?: () => void;
  onDeny?: (reason?: string) => void;
  isApproving?: boolean;
  isDenying?: boolean;
  getStatusBadge: (charity: Charity) => JSX.Element;
}

function CharityCard({ charity, onApprove, onDeny, isApproving, isDenying, getStatusBadge }: CharityCardProps) {
  return (
    <div className="rounded-lg border p-4" data-testid={`charity-card-${charity.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{charity.name}</h3>
            {getStatusBadge(charity)}
          </div>
          
          {charity.description && (
            <p className="text-sm text-muted-foreground">{charity.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {charity.website && (
              <a 
                href={charity.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {charity.email && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3" />
                {charity.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className={`h-3 w-3 ${charity.emailVerifiedAt ? 'text-green-500' : 'text-muted-foreground'}`} />
              Email: {charity.emailVerifiedAt ? 'Verified' : 'Pending'}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className={`h-3 w-3 ${charity.walletVerifiedAt ? 'text-green-500' : 'text-muted-foreground'}`} />
              Wallet: {charity.walletVerifiedAt ? 'Verified' : 'Pending'}
            </span>
          </div>

          {charity.walletAddress && (
            <code className="text-xs bg-muted px-2 py-1 rounded block w-fit">
              {charity.walletAddress}
            </code>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {onApprove && (
            <Button 
              size="sm" 
              onClick={onApprove}
              disabled={isApproving}
              data-testid={`button-approve-${charity.id}`}
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          )}
          {onDeny && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDeny()}
              disabled={isDenying}
              data-testid={`button-deny-${charity.id}`}
            >
              {isDenying ? "Denying..." : "Deny"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
