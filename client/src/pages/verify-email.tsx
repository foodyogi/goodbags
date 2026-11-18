import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface VerifyResult {
  ok: boolean;
  expired: boolean;
  message: string;
}

// Opened from the link GoodBags emails to a charity's address
export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading } = useQuery<VerifyResult>({
    queryKey: ["/api/charities/verify/email", token],
    queryFn: async () => {
      const res = await fetch(`/api/charities/verify/email/${encodeURIComponent(token ?? "")}`);
      const body = await res.json().catch(() => ({}));
      return {
        ok: res.ok && body.success === true,
        expired: res.status === 410,
        message: body.message || body.error || "Something went wrong. Please try again.",
      };
    },
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="container max-w-xl mx-auto py-16 px-4">
      <Card data-testid="card-verify-email">
        <CardContent className="p-8 text-center space-y-4">
          {isLoading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verifying your email address...</p>
            </>
          ) : data?.ok ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold">Email verified</h1>
              <p className="text-muted-foreground">
                Return to your application and click "I've Verified My Email" to continue.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h1 className="text-2xl font-bold">{data?.expired ? "Link expired" : "Link not valid"}</h1>
              <p className="text-muted-foreground" data-testid="text-verify-email-error">{data?.message}</p>
              <p className="text-sm text-muted-foreground">
                Use "Resend verification email" on your application to get a new link.
              </p>
            </>
          )}
          <Link href="/charities/apply">
            <Button variant="outline" data-testid="button-back-to-application">Charity application</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
