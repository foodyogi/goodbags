import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, Eye, Database, Cookie, Mail } from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-privacy">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Privacy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-privacy">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <Card className="mb-6" data-testid="intro-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Your Privacy Matters</h3>
                <p className="text-sm text-muted-foreground">
                  GoodBags is committed to protecting your privacy. This policy explains how we collect, use, and 
                  safeguard your information when you use our platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Information We Collect
              </h2>
              
              <h3 className="font-semibold mt-6 mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><strong>Wallet Address:</strong> When you connect your Solana wallet to use the Platform</li>
                <li><strong>Token Information:</strong> Details you provide when creating tokens (name, symbol, description, images)</li>
                <li><strong>Charity Applications:</strong> Information submitted by charities during the verification process</li>
                <li><strong>Communications:</strong> Any messages or inquiries you send to our support team</li>
              </ul>

              <h3 className="font-semibold mt-6 mb-3">Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><strong>Usage Data:</strong> Information about how you interact with the Platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> IP addresses, access times, and pages viewed</li>
                <li><strong>Blockchain Data:</strong> Transaction history associated with your wallet (publicly available on-chain)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Provide, maintain, and improve the Platform</li>
                <li>Process token creation requests and facilitate transactions</li>
                <li>Verify charity applications and manage donation distributions</li>
                <li>Communicate with you about your account and Platform updates</li>
                <li>Detect and prevent fraud, abuse, or security issues</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Generate aggregated, anonymized analytics to improve our services</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Information Sharing
              </h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><strong>Blockchain Transparency:</strong> Wallet addresses and transaction data are publicly visible on the Solana blockchain by design</li>
                <li><strong>Service Providers:</strong> With third-party services that help us operate the Platform (hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong>Safety and Rights:</strong> To protect the safety, rights, or property of GoodBags, our users, or the public</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Security
              </h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal information by authorized personnel only</li>
                <li>Secure database infrastructure with industry-standard protections</li>
              </ul>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-amber-600 dark:text-amber-400">Important:</strong> You are responsible for securing your wallet's private keys. 
                  We never have access to your private keys and cannot recover funds if they are lost.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                Cookies and Tracking
              </h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Remember your preferences (such as theme settings)</li>
                <li>Maintain your session when connected to the Platform</li>
                <li>Analyze Platform usage and performance</li>
                <li>Improve user experience based on behavior patterns</li>
              </ul>
              <p className="text-muted-foreground">
                You can control cookie preferences through your browser settings. Note that disabling cookies may 
                affect Platform functionality.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your information</li>
              </ul>
              <p className="text-muted-foreground">
                Note that blockchain data is immutable and cannot be modified or deleted once recorded on-chain.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Provide you with our services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain security and prevent fraud</li>
              </ul>
              <p className="text-muted-foreground">
                Blockchain transaction data is permanently stored on the Solana network and cannot be deleted.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                GoodBags is not intended for use by individuals under the age of 18. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new policy on this page and updating the "Last updated" date. Your continued use of the 
                Platform after any changes indicates your acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
