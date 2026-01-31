import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, AlertTriangle } from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-20 w-20 md:h-28 md:w-28 rounded-2xl object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-terms">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Legal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-terms">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <Card className="mb-6" data-testid="notice-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Please read these Terms of Service carefully before using GoodBags. By accessing or using our platform, 
                  you agree to be bound by these terms and conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using GoodBags ("the Platform"), operated by Master 22 Solutions ("we," "us," or "our"), 
                you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to 
                abide by these terms, please do not use this service.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Your continued use of the Platform following any 
                changes constitutes acceptance of those changes.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
                Platform Description
              </h2>
              <p className="text-muted-foreground mb-4">
                GoodBags is a platform that enables users to create and launch Solana-based tokens ("memecoins") with 
                integrated charitable donation mechanisms. The Platform facilitates:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Creation and deployment of tokens on the Solana blockchain</li>
                <li>Integration with verified charitable organizations</li>
                <li>Automated fee distribution to charities</li>
                <li>Tracking and transparency of charitable contributions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
                User Responsibilities
              </h2>
              <p className="text-muted-foreground mb-4">
                As a user of GoodBags, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Provide accurate and complete information when creating tokens</li>
                <li>Comply with all applicable laws and regulations in your jurisdiction</li>
                <li>Not use the Platform for any illegal, fraudulent, or harmful activities</li>
                <li>Not create tokens that infringe on intellectual property rights</li>
                <li>Not misrepresent the nature or purpose of any token you create</li>
                <li>Accept responsibility for any tokens you create and their associated trading activity</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">4</span>
                Cryptocurrency Risks
              </h2>
              <p className="text-muted-foreground mb-4">
                You acknowledge and accept the inherent risks associated with cryptocurrency and blockchain technology:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Cryptocurrency values are highly volatile and may fluctuate significantly</li>
                <li>Tokens created on the Platform may have no value or lose all value</li>
                <li>Blockchain transactions are irreversible once confirmed</li>
                <li>You are solely responsible for securing your wallet and private keys</li>
                <li>The Platform is not responsible for any losses resulting from market conditions, technical issues, or user error</li>
              </ul>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Warning: Never invest more than you can afford to lose. Cryptocurrency investments carry significant risk.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">5</span>
                Charitable Donations
              </h2>
              <p className="text-muted-foreground mb-4">
                Regarding charitable donations facilitated through the Platform:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>We verify charities through a multi-step process but cannot guarantee the actions of any charity</li>
                <li>Donation amounts are calculated automatically based on trading fees</li>
                <li>Charities receive donations via their verified wallet addresses or X (Twitter) handles</li>
                <li>Donation delivery depends on charity verification status and blockchain conditions</li>
                <li>We are not responsible for how charities use donations received</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">6</span>
                Fees and Payments
              </h2>
              <p className="text-muted-foreground mb-4">
                The Platform operates on a transparent fee structure:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>A 1% trading royalty is applied to all token trades</li>
                <li>0.75% goes directly to the token's designated charity</li>
                <li>0.15% is used for FYI token buybacks to support the platform</li>
                <li>0.10% goes to the token creator (can be donated to charity at launch)</li>
                <li>Additional blockchain transaction fees (gas) apply and are paid to the Solana network</li>
                <li>Fee structures may be updated with notice to users</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">7</span>
                Intellectual Property
              </h2>
              <p className="text-muted-foreground mb-4">
                All content, features, and functionality of the Platform, including but not limited to text, graphics, 
                logos, and software, are the exclusive property of Master 22 Solutions and are protected by international 
                copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground">
                You retain ownership of any content you upload for token creation, but grant us a license to use, display, 
                and distribute such content in connection with the Platform's operations.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">8</span>
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground mb-4">
                To the fullest extent permitted by applicable law, Master 22 Solutions shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Loss of profits, revenue, or data</li>
                <li>Financial losses from trading or holding tokens</li>
                <li>Damages resulting from unauthorized access to your wallet</li>
                <li>Service interruptions or technical failures</li>
                <li>Actions or inactions of third parties, including charities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">9</span>
                Termination
              </h2>
              <p className="text-muted-foreground">
                We reserve the right to terminate or suspend access to the Platform at our sole discretion, without prior 
                notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of 
                Service. All provisions which by their nature should survive termination shall survive.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">10</span>
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-4">
                For any questions about these Terms of Service, please contact us at:
              </p>
              <div className="p-4 rounded-lg bg-muted/30" data-testid="section-contact-info">
                <p className="font-medium" data-testid="text-company-name">Master 22 Solutions</p>
                <p className="text-sm text-muted-foreground" data-testid="text-contact-email">Email: contact@master22solutions.com</p>
                <p className="text-sm text-muted-foreground" data-testid="text-contact-x">X (Twitter): @goodbagstech</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
