import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Mail, Globe, Wallet, CheckCircle2, AlertCircle, Shield, Copy, Check } from "lucide-react";
import { charityApplicationSchema, IMPACT_CATEGORIES, type CharityApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";

interface ApplicationResult {
  success: boolean;
  charityId: string;
  message: string;
  verificationUrl: string;
  walletNonce: string;
}

export default function CharityApply() {
  const { connected, publicKey, signMessage } = useWallet();
  const { toast } = useToast();
  const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletVerifying, setWalletVerifying] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);

  const form = useForm<CharityApplication>({
    resolver: zodResolver(charityApplicationSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      website: "",
      email: "",
      walletAddress: "",
      registrationNumber: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: CharityApplication) => {
      const response = await apiRequest("POST", "/api/charities/apply", {
        ...data,
        submitterWallet: publicKey?.toBase58(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setApplicationResult(data);
        toast({
          title: "Application Submitted",
          description: "Please complete the verification steps below.",
        });
      } else {
        toast({
          title: "Application Failed",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const verifyWalletMutation = useMutation({
    mutationFn: async () => {
      if (!signMessage || !publicKey || !applicationResult) {
        throw new Error("Wallet not connected or application not submitted");
      }

      const message = new TextEncoder().encode(
        `GoodBags Charity Verification: ${applicationResult.walletNonce}`
      );
      const signature = await signMessage(message);
      const signatureBase58 = bs58.encode(signature);

      const response = await apiRequest("POST", "/api/charities/verify/wallet", {
        charityId: applicationResult.charityId,
        signature: signatureBase58,
        publicKey: publicKey.toBase58(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setWalletVerified(true);
        toast({
          title: "Wallet Verified",
          description: "Your wallet ownership has been confirmed.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Could not verify wallet.",
          variant: "destructive",
        });
      }
      setWalletVerifying(false);
    },
    onError: (error) => {
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify wallet",
        variant: "destructive",
      });
      setWalletVerifying(false);
    },
  });

  const handleVerifyWallet = async () => {
    setWalletVerifying(true);
    verifyWalletMutation.mutate();
  };

  const copyVerificationLink = () => {
    if (applicationResult) {
      const fullUrl = `${window.location.origin}/api/charities/verify/email/${applicationResult.verificationUrl.split('/').pop()}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = (data: CharityApplication) => {
    applyMutation.mutate(data);
  };

  // Use connected wallet as default wallet address
  const handleUseConnectedWallet = () => {
    if (publicKey) {
      form.setValue("walletAddress", publicKey.toBase58());
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Register Your Charity</CardTitle>
            <CardDescription>
              Connect your wallet to submit your charity for verification on GoodBags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicationResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-center">Application Submitted</CardTitle>
            <CardDescription className="text-center">
              Complete the verification steps below to finish your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Step 1: Verify Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click the verification link sent to your charity&apos;s email address.
                      If you don&apos;t see it, check your spam folder.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyVerificationLink}
                        data-testid="button-copy-verification-link"
                      >
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? "Copied" : "Copy Verification Link"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        (For testing - in production this is sent via email)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${walletVerified ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    <Wallet className={`h-4 w-4 ${walletVerified ? 'text-green-500' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Step 2: Verify Wallet Ownership</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign a message with your charity&apos;s wallet to prove ownership.
                    </p>
                    <div className="mt-3">
                      {walletVerified ? (
                        <Alert className="bg-green-500/10 border-green-500/20">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <AlertDescription className="text-green-600">
                            Wallet verified successfully!
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          onClick={handleVerifyWallet}
                          disabled={walletVerifying || !signMessage}
                          data-testid="button-verify-wallet"
                        >
                          {walletVerifying ? "Signing..." : "Sign & Verify Wallet"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-muted-foreground">Step 3: Admin Review</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      After verification, a GoodBags admin will review your application.
                      This typically takes 1-3 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your charity ID: <code className="text-xs">{applicationResult.charityId}</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Register Your Charity
          </CardTitle>
          <CardDescription>
            Submit your charity to receive donations from GoodBags token creators.
            All charities go through a verification process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Save the Ocean Foundation" {...field} data-testid="input-charity-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe your charity's mission and work..." 
                        className="resize-none"
                        {...field} 
                        data-testid="input-charity-description"
                      />
                    </FormControl>
                    <FormDescription>10-500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-charity-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IMPACT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://yourcharity.org" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-charity-website"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email"
                            placeholder="contact@yourcharity.org" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-charity-email"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Must match your website domain</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solana Wallet Address</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Your charity's Solana wallet address" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-charity-wallet"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUseConnectedWallet}
                          data-testid="button-use-connected-wallet"
                        >
                          Use Connected
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      This is where donations will be sent. You will need to verify ownership.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., EIN: 12-3456789" 
                        {...field} 
                        data-testid="input-charity-ein"
                      />
                    </FormControl>
                    <FormDescription>
                      US 501(c)(3) EIN or equivalent registration number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={applyMutation.isPending}
                data-testid="button-submit-charity"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
