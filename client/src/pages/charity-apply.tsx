import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Mail, Globe, Wallet, CheckCircle2, AlertCircle, Shield, 
  Copy, Check, ArrowRight, ArrowLeft, ExternalLink, Search, Loader2
} from "lucide-react";
import { charityApplicationSchema, IMPACT_CATEGORIES, type CharityApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { z } from "zod";

const STEPS = [
  { id: 1, label: "Verify EIN", icon: Search },
  { id: 2, label: "Organization Info", icon: Building2 },
  { id: 3, label: "Verify Email", icon: Mail },
  { id: 4, label: "Setup Wallet", icon: Wallet },
  { id: 5, label: "Review", icon: Shield },
];

interface EveryOrgData {
  everyOrgId: string;
  ein: string;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  everyOrgSlug: string;
  isDisbursable: boolean;
  profileUrl: string;
}

interface ApplicationResult {
  success: boolean;
  charityId: string;
  message: string;
  verificationUrl: string;
  walletNonce: string;
}

const einSchema = z.object({
  ein: z.string().min(9, "EIN must be at least 9 digits").max(12, "EIN is too long"),
});

type EinFormData = z.infer<typeof einSchema>;

export default function CharityApply() {
  const { connected, publicKey, signMessage } = useWallet();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [everyOrgData, setEveryOrgData] = useState<EveryOrgData | null>(null);
  const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletVerifying, setWalletVerifying] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const einForm = useForm<EinFormData>({
    resolver: zodResolver(einSchema),
    defaultValues: { ein: "" },
  });

  const applicationForm = useForm<CharityApplication>({
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

  const verifyEinMutation = useMutation({
    mutationFn: async (data: EinFormData) => {
      const cleanEin = data.ein.replace(/[^0-9]/g, '');
      const response = await apiRequest("POST", "/api/charities/verify-ein", { ein: cleanEin });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.nonprofit) {
        setEveryOrgData(data.nonprofit);
        applicationForm.setValue("name", data.nonprofit.name);
        applicationForm.setValue("description", data.nonprofit.description?.substring(0, 500) || "");
        applicationForm.setValue("website", data.nonprofit.website || "");
        applicationForm.setValue("registrationNumber", data.nonprofit.ein);
        setCurrentStep(2);
        toast({
          title: "EIN Verified",
          description: `Found ${data.nonprofit.name} on Every.org`,
        });
      } else {
        toast({
          title: "EIN Not Found",
          description: data.error || "This EIN was not found in the Every.org database. Only verified US 501(c)(3) nonprofits can register.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify EIN",
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: CharityApplication) => {
      const response = await apiRequest("POST", "/api/charities/apply", {
        ...data,
        submitterWallet: publicKey?.toBase58(),
        everyOrgData: everyOrgData ? {
          everyOrgId: everyOrgData.everyOrgId,
          everyOrgSlug: everyOrgData.everyOrgSlug,
          everyOrgName: everyOrgData.name,
          everyOrgDescription: everyOrgData.description,
          everyOrgWebsite: everyOrgData.website,
          everyOrgLogoUrl: everyOrgData.logoUrl,
          everyOrgIsDisbursable: everyOrgData.isDisbursable,
        } : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setApplicationResult(data);
        setCurrentStep(3);
        toast({
          title: "Application Submitted",
          description: "Please verify your email address.",
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
        setCurrentStep(5);
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

  const handleVerifyEin = (data: EinFormData) => {
    verifyEinMutation.mutate(data);
  };

  const handleSubmitApplication = (data: CharityApplication) => {
    applyMutation.mutate(data);
  };

  const handleVerifyWallet = async () => {
    setWalletVerifying(true);
    verifyWalletMutation.mutate();
  };

  const handleUseConnectedWallet = () => {
    if (publicKey) {
      applicationForm.setValue("walletAddress", publicKey.toBase58());
    }
  };

  const copyVerificationLink = () => {
    if (applicationResult) {
      const fullUrl = `${window.location.origin}/api/charities/verify/email/${applicationResult.verificationUrl.split('/').pop()}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailVerified = () => {
    setEmailVerified(true);
    setCurrentStep(4);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                isComplete 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isActive 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${currentStep > step.id ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Verify Your Nonprofit</CardTitle>
        <CardDescription>
          Enter your organization's EIN (Employer Identification Number) to verify your nonprofit status with Every.org.
          Only verified US 501(c)(3) organizations can register.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...einForm}>
          <form onSubmit={einForm.handleSubmit(handleVerifyEin)} className="space-y-6">
            <FormField
              control={einForm.control}
              name="ein"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EIN (Tax ID Number)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12-3456789" 
                      {...field} 
                      data-testid="input-ein"
                    />
                  </FormControl>
                  <FormDescription>
                    Your 9-digit EIN, with or without the dash (e.g., 12-3456789 or 123456789)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We verify nonprofits through <a href="https://every.org" target="_blank" rel="noopener noreferrer" className="underline">Every.org</a>, 
                a trusted nonprofit verification platform. Your EIN must be registered in their database.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyEinMutation.isPending}
              data-testid="button-verify-ein"
            >
              {verifyEinMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify EIN
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          {everyOrgData?.logoUrl && (
            <img 
              src={everyOrgData.logoUrl} 
              alt={everyOrgData.name} 
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <CardTitle className="flex items-center gap-2">
              {everyOrgData?.name}
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </CardTitle>
            <CardDescription>
              EIN: {everyOrgData?.ein}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...applicationForm}>
          <form onSubmit={applicationForm.handleSubmit(handleSubmitApplication)} className="space-y-6">
            <FormField
              control={applicationForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-charity-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={applicationForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="resize-none"
                      {...field} 
                      data-testid="input-charity-description"
                    />
                  </FormControl>
                  <FormDescription>Briefly describe your mission (10-500 characters)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={applicationForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact Category</FormLabel>
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
                control={applicationForm.control}
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
                control={applicationForm.control}
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
              control={applicationForm.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solana Wallet Address</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Your charity's Solana wallet" 
                          className="pl-10"
                          {...field} 
                          data-testid="input-charity-wallet"
                        />
                      </div>
                      {connected && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUseConnectedWallet}
                          data-testid="button-use-connected-wallet"
                        >
                          Use Connected
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    This is where donations will be sent. You'll verify ownership in step 4.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentStep(1)}
                data-testid="button-back-step1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={applyMutation.isPending}
                data-testid="button-submit-charity"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Continue to Email Verification
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We need to verify that you have access to your organization's official email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Check Your Email</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click the verification link sent to <strong>{applicationForm.getValues("email")}</strong>.
                If you don't see it, check your spam folder.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            After clicking the verification link, return here and click "Continue" to set up your wallet.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setCurrentStep(2)}
            data-testid="button-back-step2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            className="flex-1"
            onClick={handleEmailVerified}
            data-testid="button-email-verified"
          >
            I've Verified My Email
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Verify Wallet Ownership</CardTitle>
        <CardDescription>
          Sign a message with your charity's Solana wallet to prove you control where donations will be sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!connected ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect a wallet that matches the address you provided: 
                <code className="block mt-2 text-xs bg-muted p-2 rounded break-all">
                  {applicationForm.getValues("walletAddress")}
                </code>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h3 className="font-semibold mb-3">Don't have a Solana wallet?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up a free wallet with one of these trusted providers:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a 
                  href="https://phantom.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover-elevate"
                  data-testid="link-phantom-wallet"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Wallet className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Phantom</div>
                    <div className="text-xs text-muted-foreground">Most popular Solana wallet</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="https://solflare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover-elevate"
                  data-testid="link-solflare-wallet"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Wallet className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Solflare</div>
                    <div className="text-xs text-muted-foreground">Secure & feature-rich</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </div>

            <div className="flex justify-center">
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600">
                Wallet connected: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
              </AlertDescription>
            </Alert>

            {walletVerified ? (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600">
                  Wallet verified successfully! Click continue to finish.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to sign a verification message. This proves you control the wallet.
                </p>
                <Button
                  onClick={handleVerifyWallet}
                  disabled={walletVerifying || !signMessage}
                  data-testid="button-verify-wallet"
                >
                  {walletVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    "Sign & Verify Wallet"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setCurrentStep(3)}
            data-testid="button-back-step3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {walletVerified && (
            <Button 
              className="flex-1"
              onClick={() => setCurrentStep(5)}
              data-testid="button-continue-to-review"
            >
              Continue to Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <CardTitle>Application Complete!</CardTitle>
        <CardDescription>
          Your charity application has been submitted and is pending admin review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 bg-muted/30">
          <h3 className="font-semibold mb-4">Verification Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>EIN verified via Every.org</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Email ownership verified</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Wallet ownership verified</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Pending admin review (1-3 business days)</span>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your charity ID: <code className="text-xs">{applicationResult?.charityId}</code>
            <br />
            Save this for your records. You'll receive an email when your application is approved.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Button asChild variant="outline">
            <a href="/charities">View All Charities</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Register Your Charity</h1>
        <p className="text-muted-foreground">
          Join GoodBags and receive donations from token creators who care about your cause.
        </p>
      </div>

      {renderStepIndicator()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
    </div>
  );
}
